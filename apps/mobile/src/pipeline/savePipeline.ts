import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { SavedItemInput, Tag } from '@/types';
import { normalizeUrl } from '@/tools/normalizeUrl';
import { enrichItem } from '@/enrich/enrichItem';

export interface CapturePayload {
  url?: string;
  text?: string;
  title?: string;
  notes?: string;
  tag_names?: string[];
  source_app?: string;
}

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

const ensureTags = async (userId: string, tagNames?: string[]) => {
  const normalized = normalizeTagNames(tagNames);
  if (!normalized.length) return [] as Tag[];

  const { data: existing, error: existingError } = await supabase
    .from('tags')
    .select('*')
    .eq('user_id', userId)
    .in('name', normalized);

  if (existingError) throw existingError;

  const missing = normalized.filter(
    (name) => !(existing ?? []).some((tag) => tag.name.toLowerCase() === name),
  );

  let inserted: Tag[] = [];
  if (missing.length) {
    const { data, error } = await supabase
      .from('tags')
      .insert(missing.map((name) => ({ user_id: userId, name })))
      .select('*');

    if (error) throw error;
    inserted = data ?? [];
  }

  return [...(existing ?? []), ...inserted];
};

// For CREATE: just attach, no delete
const attachItemTags = async (userId: string, itemId: string, tagNames?: string[]) => {
  const tags = await ensureTags(userId, tagNames);
  if (!tags.length) return;

  const rows = tags.map((tag) => ({ saved_item_id: itemId, tag_id: tag.id }));
  const { error } = await supabase.from('saved_item_tags').insert(rows);
  if (error) throw error;
};

export async function captureAndSave(payload: CapturePayload) {
  const session = useAuthStore.getState().session;
  if (!session) throw new Error('Not authenticated');

  const normalized = normalizeUrl({ url: payload.url, text: payload.text });
  if (!normalized?.url) throw new Error('Invalid URL');

  // Keep SavedItemInput for app logic, but do NOT insert tag_names into DB row
  const input: SavedItemInput = {
    url: normalized.url,
    title: payload.title?.trim() || undefined,
    notes: payload.notes?.trim() || undefined,
    tag_names: payload.tag_names,
    source_app: payload.source_app?.trim() || undefined,
    domain: normalized.domain ?? undefined,
  };

  const dbRow = {
    user_id: session.user.id,
    url: input.url,
    title: input.title ?? null,
    notes: input.notes ?? null,
    source_app: input.source_app ?? null,
    domain: input.domain ?? null,
    processing_status: 'complete', // safe default; can omit if DB default exists
  };

  const { data, error } = await supabase
    .from('saved_items')
    .insert(dbRow)
    .select('*')
    .single();

  if (error) throw error;

  await attachItemTags(session.user.id, data.id, input.tag_names);

  // v1.1 enrichment is a no-op; keep signature simple
  await enrichItem(data.id);

  return data; // helpful for UI callers
}
