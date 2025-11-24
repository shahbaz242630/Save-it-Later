import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { TextInput } from '@/components/TextInput';
import { Button } from '@/components/Button';
import { useItems } from '@/hooks/useItems';

export default function AddItemScreen() {
  const { createItem } = useItems({ autoFetch: false });
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!url.trim()) {
      Alert.alert('Missing URL', 'Enter a valid URL.');
      return;
    }

    try {
      setSaving(true);
      await createItem({
        url: url.trim(),
        title: title.trim() || undefined,
        notes: notes.trim() || undefined,
        tag_names: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
      router.back();
    } catch (error: any) {
      Alert.alert('Unable to save item', error.message ?? 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

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
        <TextInput
          label="Tags"
          value={tags}
          onChangeText={setTags}
          placeholder="Comma separated, e.g. work, ideas"
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
