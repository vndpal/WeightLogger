import { GoogleAuthConfig } from './types';

export const GOOGLE_CONFIG: GoogleAuthConfig = {
  // For Expo Go development and web
  webClientId: '926117358204-1f7k36j4q12cobck6j18rg1uq169edds.apps.googleusercontent.com',

  // For standalone Android builds
  androidClientId: '926117358204-egoqqukbg5nihm2ob14k9h92spqpjtfc.apps.googleusercontent.com',

  // For standalone iOS builds
  iosClientId: '926117358204-1f7k36j4q12cobck6j18rg1uq169edds.apps.googleusercontent.com',
};

export const GOOGLE_SCOPES = [
  'openid',
  'profile',
  'email',
  'https://www.googleapis.com/auth/spreadsheets',
];
