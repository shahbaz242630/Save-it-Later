import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Tag } from '@/types';
import { useAuthStore } from '@/store/authStore';

export function useTags() {
  const session = useAuthStore((state) => state.session);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', session.user.id)
        .order('name');

      if (error) throw error;
      const tagList = data ?? [];

      if (!tagList.length) {
        setTags([]);
        return;
      }

      const { data: tagLinks, error: linkError } = await supabase
        .from('saved_item_tags')
        .select('tag_id');

      if (linkError) throw linkError;
      const counts = new Map<string, number>();
      tagLinks?.forEach((link) => {
        counts.set(link.tag_id, (counts.get(link.tag_id) ?? 0) + 1);
      });

      setTags(
        tagList.map((tag) => ({
          ...tag,
          item_count: counts.get(tag.id) ?? 0,
        }))
      );
    } catch (err: any) {
      console.error('Failed to fetch tags', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const createTag = useCallback(
    async (name: string) => {
      if (!session) return;
      const { error } = await supabase
        .from('tags')
        .insert({ name: name.trim(), user_id: session.user.id });
      if (error) throw error;
      await fetchTags();
    },
    [fetchTags, session]
  );

  const deleteTag = useCallback(
    async (tagId: string) => {
      await supabase.from('tags').delete().eq('id', tagId);
      await fetchTags();
    },
    [fetchTags]
  );

  return { tags, loading, error, refetch: fetchTags, createTag, deleteTag };
}
