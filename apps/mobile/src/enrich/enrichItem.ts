import type { SavedItemInput } from '@/types';

export interface EnrichItemInput {
  itemId?: string;
  input: SavedItemInput;
}

export async function enrichItem(_payload: EnrichItemInput) {
  return;
}
