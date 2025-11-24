import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useItems } from '@/hooks/useItems';
import { ItemCard } from '@/components/ItemCard';

export default function TagItemsScreen() {
  const params = useLocalSearchParams();
  const tagId = params.id as string;
  const [tagName, setTagName] = useState<string>('');
  const navigation = useNavigation();
  const { items, loading, refetch, toggleArchive, toggleFavorite } = useItems({ tagId });

  const loadTag = useCallback(async () => {
    if (!tagId) return;
    const { data, error } = await supabase.from('tags').select('*').eq('id', tagId).single();
    if (!error && data) {
      setTagName(data.name);
      navigation.setOptions({ title: data.name });
    }
  }, [navigation, tagId]);

  useEffect(() => {
    loadTag();
  }, [loadTag]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  if (!tagId) {
    return (
      <View style={styles.centered}>
        <Text>Missing tag id.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>{tagName}</Text>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ItemCard
              item={item}
              onPress={() => router.push(`/item/${item.id}`)}
              onToggleFavorite={(next) => toggleFavorite(item.id, next)}
              onToggleArchive={(next) => toggleArchive(item.id, next)}
            />
          )}
          ListEmptyComponent={<Text>No items with this tag yet.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
