/**
 * This file contains TypeScript declarations for the environment variables.
 * It provides type safety for the variables loaded from the .env file.
 */

declare module '@env' {
  export const API_KEY: string;
  export const AUTH_DOMAIN: string;
  export const PROJECT_ID: string;
  export const STORAGE_BUCKET: string;
  export const MESSAGING_SENDER_ID: string;
  export const APP_ID: string;
} 