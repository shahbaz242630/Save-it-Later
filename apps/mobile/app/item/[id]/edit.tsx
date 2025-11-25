import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { TextInput } from '@/components/TextInput';
import { Button } from '@/components/Button';
import { TagSelector } from '@/components/TagSelector';
import { useItems } from '@/hooks/useItems';
import { useTags } from '@/hooks/useTags';
import { supabase } from '@/lib/supabase';
import type { SavedItem } from '@/types';
import { isValidUrl } from '@/utils/url';

export default function EditItemScreen() {
  const params = useLocalSearchParams();
  const itemId = params.id as string;
  const { updateItem } = useItems({ autoFetch: false });
  const { tags: availableTags } = useTags();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [sourceApp, setSourceApp] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const fetchItem = useCallback(async () => {
    if (!itemId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('saved_items')
      .select('*, saved_item_tags(tag:tags(*))')
      .eq('id', itemId)
      .single();

    if (error || !data) {
      Alert.alert('Unable to load item', error?.message ?? 'Item not found', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
      return;
    }

    const typed = data as SavedItem & { saved_item_tags?: { tag?: { name: string } }[] };

    setUrl(typed.url ?? '');
    setTitle(typed.title ?? '');
    setNotes(typed.notes ?? '');
    setSourceApp(typed.source_app ?? '');
    setSelectedTags(
      typed.saved_item_tags?.map((link) => link.tag?.name).filter((name): name is string => Boolean(name)) ?? [],
    );
    setLoading(false);
  }, [itemId]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  const handleSave = async () => {
    if (!itemId) return;
    const trimmedUrl = url.trim();
    if (!trimmedUrl || !isValidUrl(trimmedUrl)) {
      Alert.alert('Invalid URL', 'Enter a valid URL that includes http or https.');
      return;
    }

    try {
      setSaving(true);
      await updateItem(itemId, {
        url: trimmedUrl,
        title: title.trim() || undefined,
        notes: notes.trim() || undefined,
        tag_names: selectedTags,
        source_app: sourceApp.trim() || undefined,
      });
      router.back();
    } catch (error: any) {
      Alert.alert('Update failed', error.message ?? 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ScrollView contentContainerStyle={styles.loader}>
        <ActivityIndicator size="large" />
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      keyboardVerticalOffset={80}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Edit Saved Item</Text>
        <TextInput label="URL" value={url} autoCapitalize="none" onChangeText={setUrl} />
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
        <Button label="Save changes" onPress={handleSave} loading={saving} style={{ marginTop: 16 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    color: '#0f172a',
  },
});
