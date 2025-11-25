import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { SavedItem, SavedItemInput, Tag, UpdateSavedItemInput } from '@/types';
import { useAuthStore } from '@/store/authStore';

interface UseItemsOptions {
  search?: string;
  tagId?: string | null;
  primaryFilter?: 'all' | 'favorites' | 'archived';
  autoFetch?: boolean;
}

const PAGE_SIZE = 20;

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
        .map((name) => name.toLowerCase()),
    ),
  );
};

export function useItems(options: UseItemsOptions = {}) {
  const { search, tagId, primaryFilter = 'all', autoFetch = true } = options;
  const session = useAuthStore((state) => state.session);
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

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

      const missing = normalized.filter((name) => !existing?.some((tag) => tag.name.toLowerCase() === name));

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
    [session],
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
    [ensureTags, session],
  );

  const querySavedItems = useCallback(
    async (from: number, to: number) => {
      if (!session) return [];
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
          return [];
        }
        query = query.in('id', ids);
      }

      const { data, error } = await query.range(from, to);
      if (error) throw error;

      return (data ?? []).map((row: any) => ({
        ...row,
        tags: row.saved_item_tags?.map((link: any) => link.tag).filter(Boolean) ?? [],
      }));
    },
    [primaryFilter, search, session, tagId],
  );

  const loadInitial = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (!session) return;
      setError(null);
      if (mode === 'refresh') {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const results = await querySavedItems(0, PAGE_SIZE - 1);
        setItems(results);
        setOffset(results.length);
        setHasMore(results.length === PAGE_SIZE);
      } catch (err: any) {
        console.error('Failed to fetch items', err.message);
        setError(err.message ?? 'Unknown error');
      } finally {
        if (mode === 'refresh') {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [querySavedItems, session],
  );

  const loadMore = useCallback(async () => {
    if (!session || !hasMore || loadingMore) return;
    setLoadingMore(true);
    setError(null);

    try {
      const from = offset;
      const to = from + PAGE_SIZE - 1;
      const results = await querySavedItems(from, to);
      setItems((prev) => {
        const merged = new Map(prev.map((item) => [item.id, item]));
        results.forEach((item) => merged.set(item.id, item));
        return Array.from(merged.values()).sort((a, b) =>
          a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0,
        );
      });
      setOffset(from + results.length);
      setHasMore(results.length === PAGE_SIZE);
    } catch (err: any) {
      console.error('Failed to fetch items', err.message);
      setError(err.message ?? 'Unknown error');
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, offset, querySavedItems, session]);

  useEffect(() => {
    if (!autoFetch) return;
    setOffset(0);
    setHasMore(true);
    loadInitial('initial');
  }, [autoFetch, loadInitial]);

  useEffect(() => {
    if (!autoFetch || !session) return;
    const channel = supabase
      .channel(`saved_items_${session.user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'saved_items', filter: `user_id=eq.${session.user.id}` },
        () => {
          loadInitial('initial');
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [autoFetch, loadInitial, session]);

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
      await loadInitial('initial');
    },
    [loadInitial, session, syncItemTags],
  );

  const updateItem = useCallback(
    async (itemId: string, updates: UpdateSavedItemInput) => {
      const { tag_names: tagNames, ...rest } = updates;
      const { error } = await supabase.from('saved_items').update(rest).eq('id', itemId);

      if (error) throw error;
      if (tagNames) {
        await syncItemTags(itemId, tagNames);
      }
      await loadInitial('initial');
    },
    [loadInitial, syncItemTags],
  );

  const deleteItem = useCallback(
    async (itemId: string) => {
      const { error } = await supabase.from('saved_items').delete().eq('id', itemId);
      if (error) throw error;
      await loadInitial('initial');
    },
    [loadInitial],
  );

  const toggleFavorite = useCallback(
    async (itemId: string, isFavorite: boolean) => {
      await updateItem(itemId, { is_favorite: isFavorite });
    },
    [updateItem],
  );

  const toggleArchive = useCallback(
    async (itemId: string, isArchived: boolean) => {
      await updateItem(itemId, { is_archived: isArchived });
    },
    [updateItem],
  );

  const status = useMemo(
    () => ({
      items,
      loading,
      loadingMore,
      refreshing,
      error,
      hasMore,
    }),
    [error, hasMore, items, loading, loadingMore, refreshing],
  );

  return {
    ...status,
    refetch: () => loadInitial('refresh'),
    loadMore,
    createItem,
    updateItem,
    deleteItem,
    toggleFavorite,
    toggleArchive,
  };
}
