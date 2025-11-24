import { useState } from 'react';
import { Alert, FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { TextInput } from '@/components/TextInput';
import { Button } from '@/components/Button';
import { useTags } from '@/hooks/useTags';

export default function TagsScreen() {
  const { tags, loading, createTag, deleteTag, refetch } = useTags();
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!newTag.trim()) return;
    try {
      setSaving(true);
      await createTag(newTag.trim());
      setNewTag('');
    } catch (error: any) {
      Alert.alert('Unable to create tag', error.message ?? 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (tagId: string) => {
    Alert.alert('Delete tag?', 'This removes it from all saved items.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTag(tagId);
          } catch (error: any) {
            Alert.alert('Unable to delete tag', error.message ?? 'Unknown error');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Tags</Text>
      <TextInput label="New tag" value={newTag} onChangeText={setNewTag} placeholder="e.g. Work" />
      <Button label="Add tag" onPress={handleCreate} loading={saving} />
      <FlatList
        style={{ marginTop: 16 }}
        data={tags}
        refreshing={loading}
        onRefresh={refetch}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <View style={styles.tagRow}>
            <Pressable style={{ flex: 1 }} onPress={() => router.push({ pathname: '/tag/[id]', params: { id: item.id, name: item.name } })}>
              <Text style={styles.tagName}>{item.name}</Text>
              <Text style={styles.tagMeta}>{item.item_count ?? 0} items</Text>
            </Pressable>
            <Pressable onPress={() => handleDelete(item.id)}>
              <Text style={styles.delete}>Delete</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No tags yet.</Text> : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    color: '#0f172a',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  tagName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  tagMeta: {
    color: '#94a3b8',
  },
  delete: {
    color: '#dc2626',
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  empty: {
    textAlign: 'center',
    marginTop: 32,
    color: '#94a3b8',
  },
});
