/**
 * Spotify service utilities for OAuth linking, playlist listing, and track fetching.
 *
 * External dependencies:
 *  - expo-auth-session (Expo SDK 53) for the Browser/Native PKCE OAuth flow.
 *  - expo-crypto for SHA-256 hashing (PKCE challenge generation).
 *  - expo-web-browser for opening the OAuth flow in a browser.
 *
 * Environment variables expected (configure in .env & app config):
 *  • EXPO_PUBLIC_SPOTIFY_CLIENT_ID – Spotify application Client ID.
 *
 * All functions log the major stages of their work to help with debugging.
 */

import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { fetchLyrics, filter as profanityFilter } from './genius';
import { supabase } from './supabase/config';
import { useUserStore } from '../store/user';

/** Configuration - Easy to change expected song count */
export const EXPECTED_SONG_COUNT = 70; // 50 top tracks + 10 from recent playlist 1 + 10 from recent playlist 2

/** Spotify's OAuth endpoints */
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';

/** Requested scopes – read-only access to the user's playlists. */
const SCOPES = [
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-top-read',
];

/** Client ID is injected via environment variables to avoid hard-coding secrets. */
const CLIENT_ID =
  process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID || process.env.SPOTIFY_CLIENT_ID;

if (!CLIENT_ID) {
  // Fail fast so developers notice mis-configurations immediately.
  throw new Error('[Spotify] CLIENT_ID is missing – check your environment vars');
}

// Ensure the browser can close itself after the OAuth redirect.
WebBrowser.maybeCompleteAuthSession();

/**
 * Launches Spotify's PKCE OAuth flow.
 *
 * @returns A token bundle if the flow succeeds or `null` if the user cancels.
 */
export async function linkAccount(): Promise<
  | {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    }
  | null
> {
  console.log('[Spotify] Starting account link flow');

  /** Generate a secure, random code_verifier (RFC-7636 §4.1). */
  const codeVerifier = generateRandomString(128);

  /** Transform verifier → challenge via SHA-256 then base64URL encoding. */
  const hashed = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    codeVerifier,
    { encoding: Crypto.CryptoEncoding.BASE64 }
  );
  const codeChallenge = base64ToBase64Url(hashed);

  /**
   * Compute the redirect URI.
   *
   * In development (running in Expo Go or a dev-client), we leverage the Expo
   * auth proxy so the redirect is **static** (https://auth.expo.dev/…) instead
   * of the ephemeral `exp://<LAN-IP>` URI—which Spotify will never have.
   *
   * In production builds we disable the proxy and fallback to the custom app
   * scheme (`snapconnect://spotify-callback`) that's registered in the Spotify
   * dashboard.
   */
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'snapconnect',
    path: 'spotify-callback',
    // Use proxy for all non-production environments (Expo Go + dev clients).
    useProxy: process.env.NODE_ENV !== 'production' && Platform.OS !== 'web',
  });

  /** Build full authorize URL. */
  const authUrl =
    `${AUTH_ENDPOINT}?` +
    `client_id=${CLIENT_ID}` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&code_challenge_method=S256` +
    `&code_challenge=${codeChallenge}` +
    `&scope=${encodeURIComponent(SCOPES.join(' '))}`;

  // Verbose debugging to verify redirect URI mismatches quickly.
  console.log('[Spotify] Debug info → redirectUri:', redirectUri);
  console.log('[Spotify] Debug info → encoded redirectUri:', encodeURIComponent(redirectUri));
  console.log('[Spotify] Debug info → authUrl being opened:', authUrl);

  console.log('[Spotify] Opening WebBrowser auth session');

  const browserRes = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

  if (browserRes.type !== 'success' || !browserRes.url) {
    console.log('[Spotify] Auth session aborted', browserRes.type);
    return null;
  }

  console.log('[Spotify] Browser returned URL:', browserRes.url);

  // Extract ?code=... from the redirected URL.
  let authCode: string | null = null;
  try {
    const redirected = new URL(browserRes.url);
    console.log('[Spotify] Parsed URL searchParams:', Array.from(redirected.searchParams.entries()));
    authCode = redirected.searchParams.get('code');
    console.log('[Spotify] Extracted auth code:', authCode);
  } catch (err) {
    console.error('[Spotify] Failed to parse redirect URL', err);
    console.error('[Spotify] Raw URL that failed to parse:', browserRes.url);
  }

  if (!authCode) {
    console.error('[Spotify] No auth code found in redirect');
    console.error('[Spotify] Full browser response:', JSON.stringify(browserRes, null, 2));
    return null;
  }

  console.log('[Spotify] Received auth code – exchanging for tokens');

  /** Exchange the authorization code for access + refresh tokens. */
  const tokenRes = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:
      `client_id=${CLIENT_ID}` +
      `&grant_type=authorization_code` +
      `&code=${authCode}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&code_verifier=${codeVerifier}`,
  });

  if (!tokenRes.ok) {
    console.error('[Spotify] Token exchange failed', await tokenRes.text());
    return null;
  }

  const json = await tokenRes.json();
  console.log('[Spotify] Token exchange success');

  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresIn: json.expires_in, // seconds
  };
}

/**
 * Fetches the authenticated user's playlists (first page only).
 *
 * @param accessToken Spotify access token.
 */
export async function getPlaylists(accessToken: string) {
  console.log('[Spotify] Fetching playlists');
  const res = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    console.error('[Spotify] Failed to fetch playlists', res.status);
    throw new Error('Failed to fetch playlists');
  }

  const data = await res.json();
  return data.items as Array<{ id: string; name: string }>;
}

/**
 * Returns up to the first 100 tracks for a given playlist.
 *
 * @param playlistId Spotify playlist ID.
 * @param accessToken Spotify access token.
 */
export async function getTracks(playlistId: string, accessToken: string) {
  console.log(`[Spotify] Fetching tracks for playlist ${playlistId}`);
  const res = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    console.error('[Spotify] Failed to fetch tracks', res.status);
    throw new Error('Failed to fetch tracks');
  }

  const data = await res.json();
  return data.items;
}

/**
 * Gets the user's top tracks based on calculated affinity.
 *
 * @param accessToken Spotify access token
 * @param limit Number of tracks to return (default: 20, max: 50)
 * @param timeRange Time frame for affinity calculation (short_term, medium_term, long_term)
 * @returns Array of top tracks
 */
export async function getTopTracks(
  accessToken: string, 
  limit: number = 20,
  timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term'
) {
  console.log(`[Spotify] Fetching user's top ${limit} tracks (${timeRange})`);
  
  const res = await fetch(
    `https://api.spotify.com/v1/me/top/tracks?limit=${limit}&time_range=${timeRange}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    console.error('[Spotify] Failed to fetch top tracks', res.status);
    throw new Error('Failed to fetch top tracks');
  }

  const data = await res.json();
  console.log(`[Spotify] Retrieved ${data.items.length} top tracks`);
  return data.items; // Returns array of track objects directly
}

/**
 * Syncs lyrics for all tracks in a playlist to Supabase storage.
 *
 * @param playlistId Spotify playlist ID
 * @param accessToken Spotify access token
 */
export async function syncPlaylistLyrics(playlistId: string, accessToken: string): Promise<void> {
  console.log(`[Spotify] Starting lyrics sync for playlist ${playlistId}`);
  
  try {
    // Get current user ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const userId = user.id;
    
    // Fetch tracks from the playlist
    const tracks = await getTracks(playlistId, accessToken);
    console.log(`[Spotify] Found ${tracks.length} tracks to process`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Process each track
    for (const item of tracks) {
      const track = item.track;
      if (!track || !track.name || !track.artists?.[0]?.name) {
        console.warn('[Spotify] Skipping track with missing data');
        continue;
      }
      
      const trackName = track.name;
      const artistName = track.artists[0].name;
      const trackId = track.id;
      
      try {
        console.log(`[Spotify] Processing: "${trackName}" by ${artistName}`);
        
        // Fetch lyrics from Genius
        const lyrics = await fetchLyrics(trackName, artistName);
        
        if (!lyrics) {
          console.log(`[Spotify] No lyrics found for "${trackName}" – uploading empty placeholder`);
          continue;
        }
        
        // Upload to Supabase storage
        const fileName = `${userId}/${trackId}.txt`;
        const contentToUpload = lyrics ? lyrics : new Blob([''], { type: 'text/plain' });
        const { data, error } = await supabase.storage
          .from('lyrics-bucket')
          .upload(fileName, contentToUpload, { 
            upsert: true,
            contentType: 'text/plain'
          });
        
        if (error) {
          console.error(`[Spotify] Failed to upload lyrics for "${trackName}":`, error);
          errorCount++;
        } else {
          console.log(`[Spotify] Successfully uploaded lyrics for "${trackName}"`);
          successCount++;
        }
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`[Spotify] Error processing "${trackName}":`, error);
        errorCount++;
      }
    }
    
    console.log(`[Spotify] Lyrics sync complete. Success: ${successCount}, Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('[Spotify] Failed to sync playlist lyrics:', error);
    throw error;
  }
}

/**
 * Syncs lyrics for the user's top tracks plus recent playlist tracks to Supabase storage.
 *
 * @param accessToken Spotify access token
 * @param topTracksLimit Number of top tracks to process (default: 50)
 * @param recentPlaylistLimit Number of recent playlist tracks to process per playlist (default: 10)
 * @param timeRange Time frame for top tracks (default: medium_term)
 */
export async function syncTopTracksLyrics(
  accessToken: string,
  topTracksLimit: number = 50,
  recentPlaylistLimit: number = 10,
  timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term'
): Promise<void> {
  console.log(`[Spotify] Starting lyrics sync for top ${topTracksLimit} tracks + ${recentPlaylistLimit} tracks from 2 recent playlists (${timeRange})`);
  
  try {
    // Get current user ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('User not authenticated');
    }
    
    const userId = user.id;

    // List existing lyric files to know which tracks are already processed
    const { data: existingFiles } = await supabase.storage.from('lyrics-bucket').list(userId, { limit: 1000 });
    const alreadyProcessed = new Set<string>(existingFiles?.map(f => f.name.replace('.txt', '')) || []);
    console.log(`[Spotify] Bucket scan complete → ${alreadyProcessed.size} lyric files found`);

    // Fetch user's top tracks
    const topTracks = await getTopTracks(accessToken, topTracksLimit, timeRange);
    console.log(`[Spotify] Found ${topTracks.length} top tracks`);

    // Fetch recent playlist tracks
    let recentTracks = [];
    const playlists = await getPlaylists(accessToken);
    if (playlists.length > 0) {
      const playlistsToProcess = playlists.slice(0, 2);
      for (const playlist of playlistsToProcess) {
        const items = await getTracks(playlist.id, accessToken);
        const tracks = items.map(item => item.track).filter(Boolean).slice(0, recentPlaylistLimit);
        recentTracks.push(...tracks);
      }
    }
    console.log(`[Spotify] Found ${recentTracks.length} tracks from recent playlists`);

    // Combine all tracks, removing duplicates
    const allTracks = [...topTracks, ...recentTracks];
    const uniqueTracks = Array.from(new Map(allTracks.map(t => [t.id, t])).values());
    console.log(`[Spotify] Total unique tracks to process: ${uniqueTracks.length}`);
    
    let successCount = 0;
    let errorCount = 0;

    // Process each track
    for (const track of uniqueTracks) {
      if (!track?.name || !track.artists?.[0]?.name) {
        console.warn('[Spotify] Skipping track with missing data');
        continue;
      }
      
      const trackName = track.name;
      const artistName = track.artists[0].name;
      const trackId = track.id;

      // Skip if song title has profanity
      if (profanityFilter.isProfane(trackName)) {
        console.log(`[Spotify] Skipping song with profane title: "${trackName}"`);
        continue;
      }
      
      if (alreadyProcessed.has(trackId)) {
        console.log(`[Spotify] Skip – lyrics for "${trackName}" already exist`);
        continue;
      }
      
      try {
        console.log(`[Spotify] Processing: "${trackName}" by ${artistName}`);
        
        const lyrics = await fetchLyrics(trackName, artistName);
        
        const filePath = `${userId}/${trackId}.txt`;
        const contentToUpload = lyrics || ''; // Upload empty string for not found
        
        const { error } = await supabase.storage
          .from('lyrics-bucket')
          .upload(filePath, contentToUpload, { 
            upsert: true,
            contentType: 'text/plain;charset=UTF-8'
         });
       
        if (error) {
          console.error(`[Spotify] Failed to upload lyrics for "${trackName}":`, error);
          errorCount++;
        } else {
          console.log(`[Spotify] Successfully processed lyrics for "${trackName}"`);
          successCount++;
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        console.error(`[Spotify] Error processing "${trackName}":`, error);
        errorCount++;
      }
    }

    console.log(`[Spotify] Combined tracks lyrics sync complete. Success: ${successCount}, Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('[Spotify] Failed to sync combined tracks lyrics:', error);
    throw error;
  }
}

/**
 * Refreshes a Spotify access token using the stored refresh token.
 *
 * @param refreshToken Spotify refresh token
 * @returns { accessToken, expiresIn, refreshToken? } or null on failure
 */
export async function refreshAccessToken(refreshToken: string): Promise<null | { accessToken: string; expiresIn: number; refreshToken?: string; }> {
  console.log('[Spotify] Attempting token refresh');

  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:
      `client_id=${CLIENT_ID}` +
      `&grant_type=refresh_token` +
      `&refresh_token=${refreshToken}`,
  });

  if (!res.ok) {
    console.error('[Spotify] Token refresh failed', await res.text());
    return null;
  }

  const json = await res.json();
  console.log('[Spotify] Token refresh success');

  return {
    accessToken: json.access_token,
    expiresIn: json.expires_in,
    refreshToken: json.refresh_token, // may be undefined
  };
}

/** Utility: Generate a random ASCII string for PKCE. */
function generateRandomString(length: number): string {
  let text = '';
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

/** Utility: Convert standard base64 → URL-safe base64 (no padding). */
function base64ToBase64Url(b64: string) {
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Utility: sanitize string for filename */
function sanitize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_');
} 