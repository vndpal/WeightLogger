import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GOOGLE_CONFIG, GOOGLE_SCOPES } from './config';
import { GoogleUser } from './types';

// Configure Google Sign-In
export function configureGoogleSignIn() {
  GoogleSignin.configure({
    webClientId: GOOGLE_CONFIG.webClientId,
    offlineAccess: true,
    scopes: GOOGLE_SCOPES,
  });
}

export async function signInWithGoogle(): Promise<{
  user: GoogleUser;
  accessToken: string;
}> {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();

    // Get the access token
    const tokens = await GoogleSignin.getTokens();

    const user: GoogleUser = {
      id: userInfo.data?.user.id ?? '',
      email: userInfo.data?.user.email ?? '',
      name: userInfo.data?.user.name ?? '',
      picture: userInfo.data?.user.photo ?? undefined,
    };

    return {
      user,
      accessToken: tokens.accessToken,
    };
  } catch (error: any) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      console.log('User cancelled the login');
      throw new Error('Sign in cancelled');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      console.log('Sign in is in progress');
      throw new Error('Sign in already in progress');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      console.log('Play services not available');
      throw new Error('Play services not available');
    } else {
      console.log('Error:', error);
      throw error;
    }
  }
}

export async function signOutFromGoogle(): Promise<void> {
  try {
    await GoogleSignin.signOut();
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}
