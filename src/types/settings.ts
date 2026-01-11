import { WeightUnit } from './weight';

export interface UserSettings {
  unit: WeightUnit;
  sheetId: string | null;
  sheetName: string;
  autoSync: boolean;
  lastSyncAt: number | null;
}

export const DEFAULT_SETTINGS: UserSettings = {
  unit: 'kg',
  sheetId: null,
  sheetName: 'Weight Log',
  autoSync: true,
  lastSyncAt: null,
};
