/**
 * Temporary module augmentation for firebase/auth to provide the React-Native helpers
 * that are implemented in JS but missing from the type declarations of the SDK.
 * Remove this file once the upstream types include these exports.
 */

declare module 'firebase/auth' {
  import { FirebaseApp } from 'firebase/app';
  import { Persistence, Auth } from 'firebase/auth';

  /**
   * React Native–specific initializer that lets you supply a custom persistence layer.
   */
  export function initializeAuth(app: FirebaseApp, options: { persistence: Persistence }): Auth;

  /**
   * Wraps a React-Native storage engine so it can be used as a Firebase Auth persistence layer.
   */
  export function getReactNativePersistence(storage: any): Persistence;
} 