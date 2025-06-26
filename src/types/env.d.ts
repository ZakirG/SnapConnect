/**
 * This file contains TypeScript declarations for the environment variables.
 * It provides type safety for the variables loaded from the .env file.
 */

declare module '@env' {
  export const SUPABASE_URL: string;
  export const SUPABASE_ANON_KEY: string;
}

declare module 'expo-auth-session';
declare module 'expo-crypto';
declare module 'bad-words';
declare module 'expo-secure-store'; 