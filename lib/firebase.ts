import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  type Auth 
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App singleton safely
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp({
    apiKey: firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId,
  });
} else {
  app = getApp();
}

// Authentication
export const auth: Auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Cloud Firestore using the provisioned database ID
export const db: Firestore = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Authentication helpers
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user, error: null };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Google sign-in failed.';
    return { user: null, error: message };
  }
}

export async function signOutUser() {
  try {
    await firebaseSignOut(auth);
    return { success: true, error: null };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sign out failed.';
    return { success: false, error: message };
  }
}
