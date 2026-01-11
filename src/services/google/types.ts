export interface GoogleAuthConfig {
  androidClientId?: string;
  iosClientId?: string;
  webClientId?: string;
}

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface SheetRow {
  date: string;
  formattedDate: string;
  weight: number;
  rowIndex?: number;
}

export interface SheetAppendResult {
  rowIndex: number;
}
