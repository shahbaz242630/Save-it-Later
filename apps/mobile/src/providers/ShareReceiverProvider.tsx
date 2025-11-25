import { PropsWithChildren, useCallback, useEffect, useState } from 'react';
import { Alert, Platform, ToastAndroid } from 'react-native';
import { router, useRootNavigationState } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useShareStore } from '@/store/shareStore';
import { useItems } from '@/hooks/useItems';
import { extractSourceApp } from '@/utils/share';
import { isValidUrl } from '@/utils/url';

type SharedItem = {
  mimeType?: string;
  data?: unknown;
  extraData?: Record<string, unknown>;
};

const URL_REGEX = /(https?:\/\/[^\s<>"']+)/i;

const normalizeSharedItem = (item?: SharedItem | null) => {
  if (!item) return null;

  const maybeData = item.data;
  let payloadText: string | undefined;

  if (typeof maybeData === 'string') {
    payloadText = maybeData.trim();
  } else if (Array.isArray(maybeData)) {
    const first = maybeData.find((value) => typeof value === 'string');
    payloadText = typeof first === 'string' ? first.trim() : undefined;
  } else if (typeof maybeData === 'object' && maybeData !== null) {
    const maybeString = Reflect.get(maybeData, 'value');
    if (typeof maybeString === 'string') {
      payloadText = maybeString.trim();
    }
  }

  if (!payloadText?.length) {
    return null;
  }

  const rawMatch = payloadText.match(URL_REGEX);
  const sanitizedUrl = rawMatch?.[0]?.replace(/[)\],.>]+$/, '');

  return {
    url: sanitizedUrl,
    rawText: payloadText,
    mimeType: item.mimeType ?? 'text/plain',
    extraData: typeof item.extraData === 'object' && item.extraData !== null ? item.extraData : null,
    receivedAt: Date.now(),
  };
};

export function ShareReceiverProvider({ children }: PropsWithChildren) {
  const setPendingShare = useShareStore((state) => state.setPendingShare);
  const pendingShare = useShareStore((state) => state.pendingShare);
  const clearPendingShare = useShareStore((state) => state.clearPendingShare);
  const session = useAuthStore((state) => state.session);
  const loadingAuth = useAuthStore((state) => state.loading);
  const navigationState = useRootNavigationState();
  const { createItem } = useItems({ autoFetch: false });
  const [savingShare, setSavingShare] = useState(false);

  const handleShare = useCallback(
    (sharedItem?: SharedItem | null) => {
      if (!sharedItem) {
        return;
      }

      const normalized = normalizeSharedItem(sharedItem);

      if (!normalized) {
        Alert.alert('Unsupported share', 'Only text or URLs can be saved right now.');
        return;
      }

      setPendingShare(normalized);
    },
    [setPendingShare],
  );

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    let mounted = true;
    let listener: { remove: () => void } | null = null;

    const attachShareListeners = async () => {
      const shareModule = await import('react-native-share-menu');
      if (!mounted) return;

      const ShareMenu = shareModule.default ?? shareModule;
      ShareMenu.getInitialShare(handleShare);
      listener = ShareMenu.addNewShareListener(handleShare);
    };

    attachShareListeners();

    return () => {
      mounted = false;
      listener?.remove?.();
    };
  }, [handleShare]);

  useEffect(() => {
    if (!pendingShare || loadingAuth || !navigationState?.key || savingShare) {
      return;
    }

    if (!session) {
      router.navigate('/(auth)/login');
      return;
    }

    if (!pendingShare.url || !isValidUrl(pendingShare.url)) {
      Alert.alert('Unsupported share', 'Shared content did not include a valid URL.');
      clearPendingShare();
      return;
    }

    const runQuickSave = async () => {
      try {
        setSavingShare(true);
        const detectedSource = extractSourceApp(pendingShare.extraData ?? undefined);
        const derivedTitle =
          pendingShare.extraData && typeof (pendingShare.extraData as Record<string, unknown>).title === 'string'
            ? ((pendingShare.extraData as Record<string, string>).title ?? '').trim() || undefined
            : undefined;
        const normalizedNotes =
          pendingShare.rawText && pendingShare.rawText !== pendingShare.url ? pendingShare.rawText : undefined;

        await createItem({
          url: pendingShare.url,
          title: derivedTitle,
          notes: normalizedNotes,
          source_app: detectedSource,
        });

        if (Platform.OS === 'android') {
          ToastAndroid.show('Saved to Save-It-Later', ToastAndroid.SHORT);
        } else {
          Alert.alert('Saved', 'Link saved to Save-It-Later.');
        }

        clearPendingShare();
        router.replace('/(tabs)/home');
      } catch (error: any) {
        Alert.alert('Unable to save shared item', error?.message ?? 'Unknown error');
      } finally {
        setSavingShare(false);
      }
    };

    runQuickSave();
  }, [clearPendingShare, createItem, loadingAuth, navigationState?.key, pendingShare, savingShare, session]);

  return children;
}
