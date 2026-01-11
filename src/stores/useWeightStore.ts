import { create } from 'zustand';
import { WeightEntry } from '../types';
import { weightRepository } from '../database';

interface WeightStore {
  entries: WeightEntry[];
  isLoading: boolean;
  error: string | null;

  loadEntries: () => Promise<void>;
  addEntry: (date: Date, weight: number) => Promise<WeightEntry>;
  updateEntry: (id: string, weight: number) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  upsertEntry: (date: Date, weight: number) => Promise<WeightEntry>;
  markEntrySynced: (id: string, sheetsRowIndex: number) => void;

  getLatestEntry: () => WeightEntry | null;
  getEntriesByDateRange: (startDate: string, endDate: string) => WeightEntry[];
}

export const useWeightStore = create<WeightStore>((set, get) => ({
  entries: [],
  isLoading: false,
  error: null,

  loadEntries: async () => {
    set({ isLoading: true, error: null });
    try {
      const entries = await weightRepository.getAll();
      set({ entries, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addEntry: async (date, weight) => {
    try {
      const entry = await weightRepository.create(date, weight);
      set((state) => ({
        entries: [entry, ...state.entries].sort((a, b) => b.date.localeCompare(a.date)),
      }));
      return entry;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateEntry: async (id, weight) => {
    try {
      await weightRepository.update(id, weight);
      set((state) => ({
        entries: state.entries.map((e) =>
          e.id === id ? { ...e, weight, updatedAt: Date.now(), syncStatus: 'pending' as const } : e
        ),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteEntry: async (id) => {
    try {
      await weightRepository.delete(id);
      set((state) => ({
        entries: state.entries.filter((e) => e.id !== id),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  upsertEntry: async (date, weight) => {
    try {
      const entry = await weightRepository.upsert(date, weight);
      set((state) => {
        const existingIndex = state.entries.findIndex((e) => e.date === entry.date);
        let newEntries;
        if (existingIndex >= 0) {
          newEntries = [...state.entries];
          newEntries[existingIndex] = entry;
        } else {
          newEntries = [entry, ...state.entries];
        }
        return { entries: newEntries.sort((a, b) => b.date.localeCompare(a.date)) };
      });
      return entry;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  getLatestEntry: () => {
    const { entries } = get();
    return entries.length > 0 ? entries[0] : null;
  },

  getEntriesByDateRange: (startDate, endDate) => {
    const { entries } = get();
    return entries.filter((e) => e.date >= startDate && e.date <= endDate);
  },
  markEntrySynced: (id: string, sheetsRowIndex: number) => {
    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === id ? { ...e, syncStatus: 'synced', sheetsRowIndex } : e
      ),
    }));
  },
}));
