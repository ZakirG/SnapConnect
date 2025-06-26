/**
 * This file defines the Zustand store for managing user authentication state.
 * It provides a centralized store for the user object, login status, and related actions.
 */

import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { saveSecure, loadSecure, deleteSecure } from '../utils/secureStore';

interface UserState {
  user: User | null;
  isLoggedIn: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
  spotifyAccessToken: string | null;
  spotifyRefreshToken: string | null;
  spotifyExpires: number | null; // Unix epoch millis when access token expires
  setSpotifyTokens: (accessToken: string, refreshToken: string, expiresIn: number) => void;
}

/**
 * Zustand store for user authentication.
 *
 * @property {User | null} user - The authenticated user object from Supabase, or null if not logged in.
 * @property {boolean} isLoggedIn - A boolean flag indicating if the user is currently authenticated.
 * @property {function(User | null): void} setUser - Action to set the user and update the login status.
 * @property {function(): void} logout - Action to clear the user data and log the user out.
 * @property {string | null} spotifyAccessToken - The Spotify access token.
 * @property {string | null} spotifyRefreshToken - The Spotify refresh token.
 * @property {number | null} spotifyExpires - The Unix epoch millis when the access token expires.
 * @property {function(string, string, number): void} setSpotifyTokens - Action to set the Spotify tokens.
 */
export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoggedIn: false,
  setUser: (user) => set({ user, isLoggedIn: !!user }),
  logout: () => {
    deleteSecure('spotify_tokens').catch(() => {});
    set({
      user: null,
      isLoggedIn: false,
      spotifyAccessToken: null,
      spotifyRefreshToken: null,
      spotifyExpires: null,
    });
  },
  spotifyAccessToken: null,
  spotifyRefreshToken: null,
  spotifyExpires: null,
  setSpotifyTokens: (accessToken, refreshToken, expiresIn) => {
    const payload = {
      accessToken,
      refreshToken,
      expiresAt: Date.now() + expiresIn * 1000,
    };
    saveSecure('spotify_tokens', JSON.stringify(payload)).catch(() => {});
    set({
      spotifyAccessToken: accessToken,
      spotifyRefreshToken: refreshToken,
      spotifyExpires: payload.expiresAt,
    });
  },
})) as unknown as UserState & { hydrateSpotifyTokens: () => Promise<void> };

// Hydration helper
export async function hydrateSpotifyTokens(store: any) {
  try {
    const data = await loadSecure('spotify_tokens');
    if (!data) return;
    const parsed = JSON.parse(data);
    const now = Date.now();
    if (parsed.expiresAt && parsed.expiresAt > now) {
      // Token still valid
      store.setState({
        spotifyAccessToken: parsed.accessToken,
        spotifyRefreshToken: parsed.refreshToken,
        spotifyExpires: parsed.expiresAt,
      });
    } else if (parsed.refreshToken) {
      // Attempt refresh
      const { refreshAccessToken } = await import('../services/spotify');
      const refreshed = await refreshAccessToken(parsed.refreshToken);
      if (refreshed) {
        store.getState().setSpotifyTokens(
          refreshed.accessToken,
          refreshed.refreshToken || parsed.refreshToken,
          refreshed.expiresIn,
        );
      }
    }
  } catch {}
} 