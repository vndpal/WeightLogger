import { SheetRow, SheetAppendResult } from './types';

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

export const sheetsService = {
  async createSheet(accessToken: string, title: string): Promise<string> {
    const response = await fetch(SHEETS_API_BASE, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: { title },
        sheets: [{
          properties: { title: 'Weight Log' },
          data: [{
            startRow: 0,
            startColumn: 0,
            rowData: [{
              values: [
                { userEnteredValue: { stringValue: 'Date' } },
                { userEnteredValue: { stringValue: 'Formatted Date' } },
                { userEnteredValue: { stringValue: 'Weight (kg)' } },
              ],
            }],
          }],
        }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error('Failed to create sheet: ' + error);
    }

    const data = await response.json();
    return data.spreadsheetId;
  },

  async appendRow(
    accessToken: string,
    sheetId: string,
    sheetName: string,
    row: SheetRow
  ): Promise<SheetAppendResult> {
    const range = sheetName + '!A:C';
    const url = SHEETS_API_BASE + '/' + sheetId + '/values/' + encodeURIComponent(range) + ':append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [[row.date, row.formattedDate, row.weight]],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error('Failed to append row: ' + error);
    }

    const data = await response.json();
    const updatedRange = data.updates?.updatedRange || '';
    const match = updatedRange.match(/(\d+)$/);
    const rowIndex = match ? parseInt(match[1], 10) : 0;

    return { rowIndex };
  },

  async getRows(
    accessToken: string,
    sheetId: string,
    sheetName: string
  ): Promise<SheetRow[]> {
    const range = sheetName + '!A2:C';
    const url = SHEETS_API_BASE + '/' + sheetId + '/values/' + encodeURIComponent(range);

    const response = await fetch(url, {
      headers: { Authorization: 'Bearer ' + accessToken },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error('Failed to get rows: ' + error);
    }

    const data = await response.json();
    const values = data.values || [];

    return values.map((row: string[], index: number) => ({
      date: row[0] || '',
      formattedDate: row[1] || '',
      weight: parseFloat(row[2]) || 0,
      rowIndex: index + 2, // Data starts at row 2
    }));
  },

  async updateRow(
    accessToken: string,
    sheetId: string,
    sheetName: string,
    rowIndex: number,
    row: SheetRow
  ): Promise<void> {
    const range = sheetName + '!A' + rowIndex + ':C' + rowIndex;
    const url = SHEETS_API_BASE + '/' + sheetId + '/values/' + encodeURIComponent(range) + '?valueInputOption=USER_ENTERED';

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [[row.date, row.formattedDate, row.weight]],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error('Failed to update row: ' + error);
    }
  },

  async deleteRow(
    accessToken: string,
    sheetId: string,
    sheetIndex: number,
    rowIndex: number
  ): Promise<void> {
    const url = SHEETS_API_BASE + '/' + sheetId + ':batchUpdate';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [{
          deleteDimension: {
            range: {
              sheetId: sheetIndex,
              dimension: 'ROWS',
              startIndex: rowIndex - 1,
              endIndex: rowIndex,
            },
          },
        }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error('Failed to delete row: ' + error);
    }
  },

  parseSheetIdFromUrl(url: string): string | null {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  },

  async validateSheet(accessToken: string, sheetId: string): Promise<boolean> {
    try {
      const url = SHEETS_API_BASE + '/' + sheetId + '?fields=spreadsheetId';
      const response = await fetch(url, {
        headers: { Authorization: 'Bearer ' + accessToken },
      });
      return response.ok;
    } catch {
      return false;
    }
  },
};
