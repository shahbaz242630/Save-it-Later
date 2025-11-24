import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { SavedItem, SavedItemInput, Tag, UpdateSavedItemInput } from '@/types';
import { useAuthStore } from '@/store/authStore';

interface UseItemsOptions {
  search?: string;
  tagId?: string | null;
  primaryFilter?: 'all' | 'favorites' | 'archived';
  autoFetch?: boolean;
}

const buildSearchFilter = (search?: string) => {
  if (!search) return undefined;
  const like = `%${search}%`;
  return `title.ilike.${like},notes.ilike.${like},url.ilike.${like}`;
};

const normalizeTagNames = (tagNames?: string[]) => {
  if (!tagNames) return [];
  return Array.from(
    new Set(
      tagNames
        .map((tag) => tag.trim())
        .filter(Boolean)
        .map((name) => name.toLowerCase())
    )
  );
};

export function useItems(options: UseItemsOptions = {}) {
  const { search, tagId, primaryFilter = 'all', autoFetch = true } = options;
  const session = useAuthStore((state) => state.session);
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ensureTags = useCallback(
    async (tagNames?: string[]) => {
      if (!session || !tagNames?.length) return [] as Tag[];

      const normalized = normalizeTagNames(tagNames);
      if (!normalized.length) return [] as Tag[];

      const { data: existing, error: existingError } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', session.user.id)
        .in('name', normalized);

      if (existingError) throw existingError;

      const missing = normalized.filter(
        (name) => !existing?.some((tag) => tag.name.toLowerCase() === name)
      );

      let inserted: Tag[] = [];
      if (missing.length) {
        const { data, error } = await supabase
          .from('tags')
          .insert(missing.map((name) => ({ user_id: session.user.id, name })))
          .select('*');

        if (error) throw error;
        inserted = data ?? [];
      }

      return [...(existing ?? []), ...inserted];
    },
    [session]
  );

  const syncItemTags = useCallback(
    async (itemId: string, tagNames?: string[]) => {
      if (!session) return;
      await supabase.from('saved_item_tags').delete().eq('saved_item_id', itemId);
      const tags = await ensureTags(tagNames);
      if (!tags.length) return;
      const rows = tags.map((tag) => ({ saved_item_id: itemId, tag_id: tag.id }));
      const { error } = await supabase.from('saved_item_tags').insert(rows);
      if (error) throw error;
    },
    [ensureTags, session]
  );

  const fetchItems = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('saved_items')
        .select('*, saved_item_tags(tag:tags(*))')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (search) {
        const orFilter = buildSearchFilter(search);
        if (orFilter) {
          query = query.or(orFilter);
        }
      }

      if (primaryFilter === 'favorites') {
        query = query.eq('is_favorite', true);
      }

      if (primaryFilter === 'archived') {
        query = query.eq('is_archived', true);
      } else {
        query = query.eq('is_archived', false);
      }

      if (tagId) {
        const { data: tagItems, error: tagError } = await supabase
          .from('saved_item_tags')
          .select('saved_item_id')
          .eq('tag_id', tagId);

        if (tagError) throw tagError;
        const ids = tagItems?.map((row) => row.saved_item_id) ?? [];
        if (!ids.length) {
          setItems([]);
          setLoading(false);
          return;
        }

        query = query.in('id', ids);
      }

      const { data, error } = await query;
      if (error) throw error;

      const mapped: SavedItem[] = (data ?? []).map((row: any) => ({
        ...row,
        tags: row.saved_item_tags
          ?.map((link: any) => link.tag)
          .filter(Boolean) ?? [],
      }));

      setItems(mapped);
    } catch (err: any) {
      console.error('Failed to fetch items', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [primaryFilter, search, session, tagId]);

  useEffect(() => {
    if (autoFetch) {
      fetchItems();
    }
  }, [autoFetch, fetchItems]);

  useEffect(() => {
    if (!autoFetch || !session) return;
    const channel = supabase
      .channel(`saved_items_${session.user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'saved_items', filter: `user_id=eq.${session.user.id}` },
        () => {
          fetchItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [autoFetch, fetchItems, session]);

  const createItem = useCallback(
    async (payload: SavedItemInput) => {
      if (!session) return;
      const { tag_names: tagNames, ...rest } = payload;
      const { data, error } = await supabase
        .from('saved_items')
        .insert({ ...rest, user_id: session.user.id })
        .select('*')
        .single();

      if (error) throw error;
      await syncItemTags(data.id, tagNames);
      await fetchItems();
    },
    [fetchItems, session, syncItemTags]
  );

  const updateItem = useCallback(
    async (itemId: string, updates: UpdateSavedItemInput) => {
      const { tag_names: tagNames, ...rest } = updates;
      const { error } = await supabase
        .from('saved_items')
        .update(rest)
        .eq('id', itemId);

      if (error) throw error;
      if (tagNames) {
        await syncItemTags(itemId, tagNames);
      }
      await fetchItems();
    },
    [fetchItems, syncItemTags]
  );

  const deleteItem = useCallback(
    async (itemId: string) => {
      const { error } = await supabase
        .from('saved_items')
        .delete()
        .eq('id', itemId);
      if (error) throw error;
      await fetchItems();
    },
    [fetchItems]
  );

  const toggleFavorite = useCallback(
    async (itemId: string, isFavorite: boolean) => {
      await updateItem(itemId, { is_favorite: isFavorite });
    },
    [updateItem]
  );

  const toggleArchive = useCallback(
    async (itemId: string, isArchived: boolean) => {
      await updateItem(itemId, { is_archived: isArchived });
    },
    [updateItem]
  );

  return {
    items,
    loading,
    error,
    refetch: fetchItems,
    createItem,
    updateItem,
    deleteItem,
    toggleFavorite,
    toggleArchive,
  };
}
