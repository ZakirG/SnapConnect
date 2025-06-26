/**
 * This file defines the Zustand store for managing user authentication state.
 * It provides a centralized store for the user object, login status, and related actions.
 */

import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';

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
  logout: () => set({ user: null, isLoggedIn: false }),
  spotifyAccessToken: null,
  spotifyRefreshToken: null,
  spotifyExpires: null,
  setSpotifyTokens: (accessToken, refreshToken, expiresIn) =>
    set({
      spotifyAccessToken: accessToken,
      spotifyRefreshToken: refreshToken,
      spotifyExpires: Date.now() + expiresIn * 1000,
    }),
})); 