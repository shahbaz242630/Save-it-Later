import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import ShareMenu from 'react-native-share-menu';
import { router, useRootNavigationState } from 'expo-router';

import { useAuthStore } from '@/store/authStore';
import { useShareStore } from '@/store/shareStore';
import { extractSourceApp } from '@/utils/share';
import { captureAndSave } from '@/pipeline/savePipeline';

type SharePayload = {
  data?: string;
  mimeType?: string;
  extraData?: Record<string, any>;
};

function deriveTitleFromShare(rawText: string): string | undefined {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l): l is string => Boolean(l)); // strict TS-safe

  if (!lines.length) return undefined;

  const first = lines[0];
  if (first.startsWith('http://') || first.startsWith('https://')) return undefined;

  return first.length > 140 ? first.slice(0, 140) : first;
}

export function ShareReceiverProvider({ children }: { children: React.ReactNode }) {
  const pendingShare = useShareStore((state) => state.pendingShare);
  const setPendingShare = useShareStore((state) => state.setPendingShare);
  const clearPendingShare = useShareStore((state) => state.clearPendingShare);

  const session = useAuthStore((state) => state.session);
  const loadingAuth = useAuthStore((state) => state.loading);

  const navigationState = useRootNavigationState();
  const [savingShare, setSavingShare] = useState(false);

  // 1) Listen for incoming shares (Android via react-native-share-menu)
  useEffect(() => {
    const handleShare = (share: SharePayload) => {
      const rawText = share?.data?.toString?.() ?? '';
      if (!rawText) return;

      setPendingShare({
        rawText,
        extraData: share?.extraData ?? null,
        receivedAt: Date.now(),
      });
    };

    // Share while app is open
    const listener = (ShareMenu as any).addNewShareListener(handleShare);

    // Share when app launches from a share
    (ShareMenu as any).getInitialShare(handleShare);

    return () => {
      listener?.remove?.();
    };
  }, [setPendingShare]);

  // 2) When we have a pending share, quick-save if authenticated
  useEffect(() => {
    if (!navigationState?.key) return;
    if (savingShare) return;
    const rawText = pendingShare?.rawText;
    if (!rawText) return;
    if (loadingAuth) return;

    // Not logged in -> send user to Add Item screen (same v1 behavior)
    if (!session) {
      router.push('/add-item');
      return;
    }

    const run = async () => {
      try {
        setSavingShare(true);

        const detectedSource = extractSourceApp(pendingShare.extraData);
        const derivedTitle = deriveTitleFromShare(rawText);

        // IMPORTANT: pass `text` (not `rawText`) to match your CapturePayload
        await captureAndSave({
          text: rawText,
          title: derivedTitle,
          notes: undefined,
          source_app: detectedSource,
        });

        clearPendingShare();
      } catch (e: any) {
        Alert.alert('Could not save link', e?.message ?? 'Please try again.');
        // Fall back to manual flow with the pending share still available
        router.push('/add-item');
      } finally {
        setSavingShare(false);
      }
    };

    run();
  }, [clearPendingShare, loadingAuth, navigationState?.key, pendingShare, savingShare, session]);

  return <>{children}</>;
}
