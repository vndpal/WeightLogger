import { weightRepository } from '../../database';
import { sheetsService } from '../google';

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: string[];
}

export async function syncAllPending(
  accessToken: string,
  sheetId: string,
  sheetName: string
): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    syncedCount: 0,
    failedCount: 0,
    errors: [],
  };

  try {
    const pendingEntries = await weightRepository.getPending();

    for (const entry of pendingEntries) {
      try {
        const { rowIndex } = await sheetsService.appendRow(
          accessToken,
          sheetId,
          sheetName,
          {
            date: entry.date,
            formattedDate: entry.formattedDate,
            weight: entry.weight,
          }
        );

        await weightRepository.markSynced(entry.id, rowIndex);
        result.syncedCount++;
      } catch (error) {
        result.failedCount++;
        result.errors.push('Failed to sync entry ' + entry.date + ': ' + (error as Error).message);
      }
    }

    result.success = result.failedCount === 0;
  } catch (error) {
    result.success = false;
    result.errors.push('Sync failed: ' + (error as Error).message);
  }

  return result;
}

export async function pullFromSheets(
  accessToken: string,
  sheetId: string,
  sheetName: string
): Promise<void> {
  const rows = await sheetsService.getRows(accessToken, sheetId, sheetName);

  for (const row of rows) {
    if (!row.date || !row.weight) continue;

    const existing = await weightRepository.getByDate(row.date);
    if (!existing) {
      const date = new Date(row.date);
      const entry = await weightRepository.create(date, row.weight);
      // Since it's from sheets, mark as synced
      await weightRepository.markSynced(entry.id, row.rowIndex || 0);
    }
  }
}
