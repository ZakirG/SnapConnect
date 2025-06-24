/**
 * This file contains the Firebase configuration for the application.
 * It initializes and exports the Firebase app instance.
 *
 * NOTE: Fill in your own Firebase project configuration details below.
 * These keys are sensitive and should not be committed to version control.
 * Consider using environment variables for a production environment.
 */

import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import {
  API_KEY,
  AUTH_DOMAIN,
  PROJECT_ID,
  STORAGE_BUCKET,
  MESSAGING_SENDER_ID,
  APP_ID,
} from '@env';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: API_KEY,
  authDomain: AUTH_DOMAIN,
  projectId: PROJECT_ID,
  storageBucket: STORAGE_BUCKET,
  messagingSenderId: MESSAGING_SENDER_ID,
  appId: APP_ID,
};

// Initialize Firebase app (singleton)
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with AsyncStorage persistence for React Native
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Initialize Firestore and export
export const db = getFirestore(app);

// Initialize Realtime Database and export (used for low-latency chat)
export const rtdb = getDatabase(app);

// Initialize Cloud Storage and export
export const storage = getStorage(app);

// Keep default export for backward compatibility
export default app; 