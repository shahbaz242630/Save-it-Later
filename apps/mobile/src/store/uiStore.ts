import { create } from 'zustand';

type PrimaryFilter = 'all' | 'favorites' | 'archived';

interface UiState {
  search: string;
  selectedTagId: string | null;
  primaryFilter: PrimaryFilter;
  setSearch: (value: string) => void;
  setSelectedTag: (tagId: string | null) => void;
  setPrimaryFilter: (filter: PrimaryFilter) => void;
  reset: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  search: '',
  selectedTagId: null,
  primaryFilter: 'all',
  setSearch: (value) => set({ search: value }),
  setSelectedTag: (tagId) => set({ selectedTagId: tagId }),
  setPrimaryFilter: (filter) => set({ primaryFilter: filter }),
  reset: () => set({ search: '', selectedTagId: null, primaryFilter: 'all' }),
}));
