import { GoogleAuthConfig } from './types';
import Constants from 'expo-constants';

export const GOOGLE_CONFIG: GoogleAuthConfig = {
  // For Expo Go development and web - using Constants.expoConfig.extra for reliable runtime access
  webClientId: Constants.expoConfig?.extra?.googleWebClientId,

  // For standalone Android builds
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,

  // For standalone iOS builds
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
};

export const GOOGLE_SCOPES = [
  'openid',
  'profile',
  'email',
  'https://www.googleapis.com/auth/spreadsheets',
];
