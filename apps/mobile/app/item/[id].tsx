import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import type { SavedItem } from '@/types';
import { Button } from '@/components/Button';
import { TagChip } from '@/components/TagChip';

export default function ItemDetailScreen() {
  const params = useLocalSearchParams();
  const itemId = params.id as string;
  const [item, setItem] = useState<SavedItem | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchItem = useCallback(async () => {
    if (!itemId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('saved_items')
      .select('*, saved_item_tags(tag:tags(*))')
      .eq('id', itemId)
      .single();

    if (error) {
      Alert.alert('Unable to load item', error.message);
      setLoading(false);
      return;
    }

    setItem({
      ...(data as any),
      tags:
        data.saved_item_tags
          ?.map((link: any) => link.tag)
          .filter(Boolean) ?? [],
    });
    setLoading(false);
  }, [itemId]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  const updateItem = async (updates: Partial<SavedItem>) => {
    if (!item) return;
    const { error } = await supabase.from('saved_items').update(updates).eq('id', item.id);
    if (error) {
      Alert.alert('Update failed', error.message);
      return;
    }
    setItem({ ...item, ...updates });
  };

  const handleDelete = () => {
    if (!item) return;
    Alert.alert('Delete saved item?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('saved_items').delete().eq('id', item.id);
          if (error) {
            Alert.alert('Delete failed', error.message);
            return;
          }
          router.back();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.loader}>
        <Text>Item not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{item.title || item.url}</Text>
      <Text style={styles.url} onPress={() => Linking.openURL(item.url)}>
        {item.url}
      </Text>
      <View style={styles.actionsRow}>
        <Button
          label={item.is_favorite ? 'Unfavorite' : 'Favorite'}
          variant="secondary"
          onPress={() => updateItem({ is_favorite: !item.is_favorite })}
        />
        <Button
          label={item.is_archived ? 'Unarchive' : 'Archive'}
          variant="secondary"
          onPress={() => updateItem({ is_archived: !item.is_archived })}
        />
      </View>
      <Text style={styles.sectionTitle}>Notes</Text>
      <Text style={styles.body}>{item.notes || 'No notes added.'}</Text>
      <Text style={styles.sectionTitle}>Tags</Text>
      <View style={styles.tagsRow}>
        {item.tags?.length ? item.tags.map((tag) => <TagChip key={tag.id} label={tag.name} />) : <Text>No tags</Text>}
      </View>
      {item.source_app ? (
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Source</Text>
          <Text style={styles.metaValue}>{item.source_app}</Text>
        </View>
      ) : null}
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Created</Text>
        <Text style={styles.metaValue}>{new Date(item.created_at).toLocaleString()}</Text>
      </View>
      <Button label="Open Link" onPress={() => Linking.openURL(item.url)} style={{ marginTop: 24 }} />
      <Button label="Delete" variant="danger" onPress={handleDelete} style={{ marginTop: 12 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  url: {
    color: '#2563eb',
    marginTop: 8,
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  body: {
    color: '#334155',
    marginBottom: 16,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  metaLabel: {
    color: '#94a3b8',
  },
  metaValue: {
    color: '#0f172a',
  },
});
