export type UUID = string;

export interface Profile {
  id: UUID;
  email: string | null;
  created_at: string;
}

export interface Tag {
  id: UUID;
  user_id: UUID;
  name: string;
  created_at: string;
  item_count?: number;
}

export interface SavedItem {
  id: UUID;
  user_id: UUID;
  url: string;
  title?: string | null;
  notes?: string | null;
  source_app?: string | null;
  is_favorite: boolean;
  is_archived: boolean;
  created_at: string;
  tags?: Tag[];
}

export interface SavedItemInput {
  url: string;
  title?: string;
  notes?: string;
  tag_names?: string[];
  source_app?: string;
}

export interface UpdateSavedItemInput extends Partial<SavedItemInput> {
  is_favorite?: boolean;
  is_archived?: boolean;
}
