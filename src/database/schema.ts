export const CREATE_WEIGHT_ENTRIES_TABLE = `
  CREATE TABLE IF NOT EXISTS weight_entries (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL UNIQUE,
    formatted_date TEXT NOT NULL,
    weight REAL NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    sync_status TEXT DEFAULT 'pending',
    sheets_row_index INTEGER
  );
`;

export const CREATE_DATE_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_date ON weight_entries(date DESC);
`;

export const CREATE_SYNC_STATUS_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_sync_status ON weight_entries(sync_status);
`;
