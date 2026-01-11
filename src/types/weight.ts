export interface WeightEntry {
  id: string;
  date: string; // YYYY-MM-DD
  formattedDate: string; // "Mon, 30-Dec"
  weight: number; // Always stored in kg
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
  syncStatus: 'pending' | 'synced' | 'conflict';
  sheetsRowIndex?: number;
}

export type WeightUnit = 'kg' | 'lbs';

export interface WeightStats {
  latestEntry: WeightEntry | null;
  changeSinceLastEntry: number;
  thisWeekAverage: number;
  lastWeekAverage: number;
  weeklyChange: number;
  thisMonthAverage: number;
  lastMonthAverage: number;
  monthlyChange: number;
  minWeight: { value: number; date: string } | null;
  maxWeight: { value: number; date: string } | null;
  totalEntries: number;
}
