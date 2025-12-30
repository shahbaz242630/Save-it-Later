import { useCallback, useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { TextInput } from '@/components/TextInput';
import { Button } from '@/components/Button';
import { TagSelector } from '@/components/TagSelector';
import { useItems } from '@/hooks/useItems';
import { useShareStore } from '@/store/shareStore';
import { useTags } from '@/hooks/useTags';
import { extractSourceApp } from '@/utils/share';
import { captureAndSave } from '@/pipeline/savePipeline';
import { normalizeUrl } from '@/tools/normalizeUrl';

export default function AddItemScreen() {
  const { createItem } = useItems({ autoFetch: false });
  const { tags: availableTags } = useTags();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sourceApp, setSourceApp] = useState('');
  const [saving, setSaving] = useState(false);
  const sharePayload = useShareStore((state) => state.pendingShare);
  const clearPendingShare = useShareStore((state) => state.clearPendingShare);

  const handleSave = async () => {
    const trimmedUrl = url.trim();
    const normalized = normalizeUrl({ url: trimmedUrl });
    if (!trimmedUrl || !normalized) {
      Alert.alert('Invalid URL', 'Enter a valid URL that includes http or https.');
      return;
    }

    try {
      setSaving(true);
      await captureAndSave(
        {
          url: normalized.url,
          title,
          notes,
          tag_names: selectedTags,
          source_app: sourceApp,
        },
        createItem,
      );
      clearPendingShare();
      router.back();
    } catch (error: any) {
      Alert.alert('Unable to save item', error.message ?? 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!sharePayload) {
      return;
    }

    if (!url && sharePayload.url) {
      setUrl(sharePayload.url);
    }

    const maybeTitle =
      sharePayload.extraData && typeof (sharePayload.extraData as Record<string, unknown>).title === 'string'
        ? (sharePayload.extraData as Record<string, string>).title
        : undefined;
    if (!title && maybeTitle) {
      setTitle(maybeTitle);
    }

    if (!notes && sharePayload.rawText) {
      setNotes(sharePayload.rawText);
    }

    if (!sourceApp) {
      const detected = extractSourceApp(sharePayload.extraData ?? undefined);
      if (detected) {
        setSourceApp(detected);
      }
    }
  }, [notes, sharePayload, sourceApp, title, url]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        clearPendingShare();
      };
    }, [clearPendingShare]),
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      keyboardVerticalOffset={80}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Save Link</Text>
        <TextInput label="URL" autoCapitalize="none" value={url} onChangeText={setUrl} />
        <TextInput label="Title" value={title} onChangeText={setTitle} />
        <TextInput
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          multiline
          style={{ height: 120, textAlignVertical: 'top' }}
        />
        <TagSelector
          label="Tags"
          availableTags={availableTags}
          selectedTags={selectedTags}
          onChange={setSelectedTags}
        />
        <TextInput
          label="Source App"
          value={sourceApp}
          onChangeText={setSourceApp}
          placeholder="Optional - e.g. Safari, Chrome"
        />
        <Button label="Save" onPress={handleSave} loading={saving} style={{ marginTop: 16 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    color: '#0f172a',
  },
});
