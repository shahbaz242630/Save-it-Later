import { create } from 'zustand';

export interface PendingSharePayload {
  url?: string;
  rawText?: string;
  mimeType?: string;
  extraData?: Record<string, unknown> | null;
  receivedAt: number;
}

interface ShareState {
  pendingShare: PendingSharePayload | null;
  setPendingShare: (payload: PendingSharePayload) => void;
  clearPendingShare: () => void;
}

export const useShareStore = create<ShareState>((set) => ({
  pendingShare: null,
  setPendingShare: (payload) => set({ pendingShare: payload }),
  clearPendingShare: () => set({ pendingShare: null }),
}));
