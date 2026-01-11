import * as Crypto from 'expo-crypto';
import { WeightEntry } from '../types';
import { getDatabase } from './init';
import { formatDateForSheet, formatDateDisplay } from '../utils';

interface DbRow {
  id: string;
  date: string;
  formatted_date: string;
  weight: number;
  created_at: number;
  updated_at: number;
  sync_status: string;
  sheets_row_index: number | null;
}

function mapRowToEntry(row: DbRow): WeightEntry {
  return {
    id: row.id,
    date: row.date,
    formattedDate: row.formatted_date,
    weight: row.weight,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status as WeightEntry['syncStatus'],
    sheetsRowIndex: row.sheets_row_index ?? undefined,
  };
}

export const weightRepository = {
  async create(date: Date, weight: number): Promise<WeightEntry> {
    const db = await getDatabase();
    const now = Date.now();
    const entry: WeightEntry = {
      id: Crypto.randomUUID(),
      date: formatDateForSheet(date),
      formattedDate: formatDateDisplay(date),
      weight,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
    };

    await db.runAsync(
      `INSERT INTO weight_entries (id, date, formatted_date, weight, created_at, updated_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [entry.id, entry.date, entry.formattedDate, entry.weight, entry.createdAt, entry.updatedAt, entry.syncStatus]
    );

    return entry;
  },

  async getById(id: string): Promise<WeightEntry | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<DbRow>(
      'SELECT * FROM weight_entries WHERE id = ?',
      [id]
    );
    return row ? mapRowToEntry(row) : null;
  },

  async getByDate(date: string): Promise<WeightEntry | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<DbRow>(
      'SELECT * FROM weight_entries WHERE date = ?',
      [date]
    );
    return row ? mapRowToEntry(row) : null;
  },

  async getAll(): Promise<WeightEntry[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<DbRow>(
      'SELECT * FROM weight_entries ORDER BY date DESC'
    );
    return rows.map(mapRowToEntry);
  },

  async getInRange(startDate: string, endDate: string): Promise<WeightEntry[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<DbRow>(
      'SELECT * FROM weight_entries WHERE date >= ? AND date <= ? ORDER BY date DESC',
      [startDate, endDate]
    );
    return rows.map(mapRowToEntry);
  },

  async update(id: string, weight: number): Promise<void> {
    const db = await getDatabase();
    const now = Date.now();
    await db.runAsync(
      `UPDATE weight_entries SET weight = ?, updated_at = ?, sync_status = 'pending' WHERE id = ?`,
      [weight, now, id]
    );
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM weight_entries WHERE id = ?', [id]);
  },

  async getPending(): Promise<WeightEntry[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<DbRow>(
      `SELECT * FROM weight_entries WHERE sync_status = 'pending' ORDER BY date ASC`
    );
    return rows.map(mapRowToEntry);
  },

  async markSynced(id: string, rowIndex: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE weight_entries SET sync_status = 'synced', sheets_row_index = ? WHERE id = ?`,
      [rowIndex, id]
    );
  },

  async markConflict(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE weight_entries SET sync_status = 'conflict' WHERE id = ?`,
      [id]
    );
  },

  async upsert(date: Date, weight: number): Promise<WeightEntry> {
    const dateStr = formatDateForSheet(date);
    const existing = await this.getByDate(dateStr);

    if (existing) {
      await this.update(existing.id, weight);
      return { ...existing, weight, updatedAt: Date.now(), syncStatus: 'pending' };
    }

    return this.create(date, weight);
  },

  async getCount(): Promise<number> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM weight_entries'
    );
    return result?.count ?? 0;
  },
};
