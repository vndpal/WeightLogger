import { create } from 'zustand';
import { SyncState } from '../types';

interface SyncStore extends SyncState {
  setIsSyncing: (isSyncing: boolean) => void;
  setLastSyncAt: (timestamp: number | null) => void;
  setPendingCount: (count: number) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: SyncState = {
  isSyncing: false,
  lastSyncAt: null,
  pendingCount: 0,
  error: null,
};

export const useSyncStore = create<SyncStore>((set) => ({
  ...initialState,
  setIsSyncing: (isSyncing) => set({ isSyncing }),
  setLastSyncAt: (lastSyncAt) => set({ lastSyncAt }),
  setPendingCount: (pendingCount) => set({ pendingCount }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
