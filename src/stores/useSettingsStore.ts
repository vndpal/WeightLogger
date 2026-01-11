import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserSettings, DEFAULT_SETTINGS, WeightUnit } from '../types';

interface SettingsStore extends UserSettings {
  setUnit: (unit: WeightUnit) => void;
  setSheetId: (sheetId: string | null) => void;
  setSheetName: (sheetName: string) => void;
  setAutoSync: (autoSync: boolean) => void;
  setLastSyncAt: (timestamp: number | null) => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      setUnit: (unit) => set({ unit }),
      setSheetId: (sheetId) => set({ sheetId }),
      setSheetName: (sheetName) => set({ sheetName }),
      setAutoSync: (autoSync) => set({ autoSync }),
      setLastSyncAt: (lastSyncAt) => set({ lastSyncAt }),
      reset: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'weightlog-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
