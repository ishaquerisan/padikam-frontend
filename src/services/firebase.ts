import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = (): boolean => {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.apiKey !== 'your-firebase-api-key' &&
    firebaseConfig.projectId !== 'your-firebase-project-id'
  );
};

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;

export const getFirebaseApp = (): FirebaseApp => {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase is not configured. Please fill in your Firebase credentials in frontend/.env file.',
    );
  }

  if (!appInstance) {
    appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }
  return appInstance;
};

export const getFirebaseAuth = (): Auth => {
  if (!authInstance) {
    const app = getFirebaseApp();
    authInstance = getAuth(app);
  }
  return authInstance;
};

export const signInWithGooglePopup = async (): Promise<string> => {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase is not configured yet. Please add your Firebase Web app credentials to frontend/.env (VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, etc.).',
    );
  }

  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account',
  });

  try {
    const result = await signInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken(true);
    return idToken;
  } catch (error: any) {
    // Provide user-friendly error messages for common Firebase auth errors
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in popup was closed before completing authentication.');
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('The sign-in popup was blocked by your browser. Please allow popups for this site.');
    } else if (error.code === 'auth/unauthorized-domain') {
      throw new Error('This domain is not authorized in Firebase Console (Authentication > Settings > Authorized domains).');
    } else if (error.code === 'auth/cancelled-popup-request') {
      throw new Error('Another sign-in window was opened. Please try again.');
    }
    throw error;
  }
};
