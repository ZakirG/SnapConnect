/**
 * Thin wrapper around Expo SecureStore to simplify get/set/remove operations.
 */
import * as SecureStore from 'expo-secure-store';

export async function saveSecure(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value);
}

export async function loadSecure(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(key);
}

export async function deleteSecure(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key);
} 