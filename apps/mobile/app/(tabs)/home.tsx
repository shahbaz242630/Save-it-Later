import { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { TextInput } from '@/components/TextInput';
import { ItemCard } from '@/components/ItemCard';
import { TagChip } from '@/components/TagChip';
import { EmptyState } from '@/components/EmptyState';
import { useItems } from '@/hooks/useItems';
import { useTags } from '@/hooks/useTags';
import { useUiStore } from '@/store/uiStore';

const filters = [
  { key: 'all', label: 'All' },
  { key: 'favorites', label: 'Favorites' },
  { key: 'archived', label: 'Archived' },
] as const;

export default function HomeScreen() {
  const { tags } = useTags();
  const search = useUiStore((s) => s.search);
  const selectedTagId = useUiStore((s) => s.selectedTagId);
  const primaryFilter = useUiStore((s) => s.primaryFilter);
  const setSearch = useUiStore((s) => s.setSearch);
  const setSelectedTag = useUiStore((s) => s.setSelectedTag);
  const setPrimaryFilter = useUiStore((s) => s.setPrimaryFilter);

  const { items, loading, loadingMore, refreshing, hasMore, refetch, loadMore, toggleFavorite, toggleArchive } = useItems({
    search,
    tagId: selectedTagId,
    primaryFilter,
  });

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loadingMore) {
      loadMore();
    }
  }, [hasMore, loadMore, loadingMore]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const emptyState = (() => {
    if (loading) return null;
    if (primaryFilter === 'favorites') {
      return <EmptyState title="No favorites" subtitle="Favorite items to see them here." />;
    }
    if (primaryFilter === 'archived') {
      return <EmptyState title="Archive is empty" subtitle="Archived items will show here." />;
    }
    return <EmptyState title="No saved items" subtitle="Use the + button or share sheet to save content." />;
  })();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>Save-It-Later</Text>
          <Text style={styles.subtitle}>Capture links from anywhere</Text>
        </View>
        <Pressable style={styles.addButton} onPress={() => router.push('/add-item')}>
          <Feather name="plus" size={20} color="#fff" />
        </Pressable>
      </View>
      <TextInput
        label="Search"
        value={search}
        onChangeText={setSearch}
        placeholder="Search title, url, notes"
      />
      <View style={styles.chipsRow}>
        {filters.map((filter) => (
          <TagChip
            key={filter.key}
            label={filter.label}
            selected={primaryFilter === filter.key}
            onPress={() => setPrimaryFilter(filter.key)}
          />
        ))}
      </View>
      <View style={styles.tagsRow}>
        <FlatList
          data={tags}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={() => (
            <TagChip
              label={selectedTagId ? 'Clear filter' : 'All tags'}
              selected={!selectedTagId}
              onPress={() => setSelectedTag(null)}
            />
          )}
          renderItem={({ item }) => (
            <TagChip
              label={`${item.name}${item.item_count ? ` (${item.item_count})` : ''}`}
              selected={selectedTagId === item.id}
              onPress={() => setSelectedTag(selectedTagId === item.id ? null : item.id)}
              style={{ marginRight: 12 }}
            />
          )}
        />
      </View>
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={refetch}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          renderItem={({ item }) => (
            <ItemCard
              item={item}
              onPress={() => router.push(`/item/${item.id}`)}
              onToggleArchive={(next) => toggleArchive(item.id, next)}
              onToggleFavorite={(next) => toggleFavorite(item.id, next)}
            />
          )}
          ListEmptyComponent={emptyState}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" />
              </View>
            ) : null
          }
        />
      )}
      <Pressable style={styles.fab} onPress={() => router.push('/add-item')}>
        <Feather name="plus" size={24} color="#fff" />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f1f5f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brand: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    color: '#64748b',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsRow: {
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 8,
  },
  tagsRow: {
    marginBottom: 8,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 120,
  },
  footerLoader: {
    paddingVertical: 16,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 48,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
});
