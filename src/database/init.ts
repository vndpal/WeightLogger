import * as SQLite from 'expo-sqlite';
import { CREATE_WEIGHT_ENTRIES_TABLE, CREATE_DATE_INDEX, CREATE_SYNC_STATUS_INDEX } from './schema';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  db = await SQLite.openDatabaseAsync('logmyweight.db');

  await db.execAsync(CREATE_WEIGHT_ENTRIES_TABLE);
  await db.execAsync(CREATE_DATE_INDEX);
  await db.execAsync(CREATE_SYNC_STATUS_INDEX);

  return db;
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
