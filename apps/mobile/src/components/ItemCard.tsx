import { Feather } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SavedItem } from '@/types';
import { TagChip } from './TagChip';

interface Props {
  item: SavedItem;
  onPress: () => void;
  onToggleFavorite: (next: boolean) => void;
  onToggleArchive: (next: boolean) => void;
}

export function ItemCard({ item, onPress, onToggleFavorite, onToggleArchive }: Props) {
  const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true });
  const domain = (() => {
    if (item.domain) return item.domain;
    try {
      const url = new URL(item.url);
      return url.host.replace('www.', '');
    } catch {
      return item.url;
    }
  })();

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}>
      <View style={styles.row}>
        <View style={styles.textWrapper}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title || item.url}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {domain} - {timeAgo}
          </Text>
          {item.tags?.length ? (
            <View style={styles.tagsRow}>
              {item.tags.map((tag) => (
                <TagChip key={tag.id} label={tag.name} />
              ))}
            </View>
          ) : null}
        </View>
        <View style={styles.actions}>
          <Pressable onPress={() => onToggleFavorite(!item.is_favorite)} style={styles.iconButton}>
            <Feather name="star" size={20} color={item.is_favorite ? '#fbbf24' : '#94a3b8'} />
          </Pressable>
          <Pressable onPress={() => onToggleArchive(!item.is_archived)} style={styles.iconButton}>
            <Feather name={item.is_archived ? 'refresh-ccw' : 'archive'} size={20} color="#334155" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardPressed: {
    opacity: 0.9,
  },
  row: {
    flexDirection: 'row',
  },
  textWrapper: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  meta: {
    color: '#64748b',
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  actions: {
    justifyContent: 'space-between',
  },
  iconButton: {
    padding: 6,
    borderRadius: 20,
  },
});
