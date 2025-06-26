/**
 * Genius API service for fetching and cleaning song lyrics.
 *
 * Uses the official Genius API endpoints:
 * 1. Search endpoint to find song ID
 * 2. Referents endpoint to get lyrics in text format
 *
 * External dependencies:
 *  - bad-words for profanity filtering
 *
 * Environment variables expected:
 *  • EXPO_PUBLIC_GENIUS_ACCESS_TOKEN - Genius API client access token
 *
 * All functions log their major operations for debugging.
 */

import Filter from 'bad-words';
import { Asset } from 'expo-asset';

/** Genius API endpoints */
const GENIUS_API_BASE = 'https://api.genius.com';
const SEARCH_ENDPOINT = `${GENIUS_API_BASE}/search`;

/** Access token from environment variables */
const GENIUS_TOKEN = 
  process.env.EXPO_PUBLIC_GENIUS_ACCESS_TOKEN || process.env.GENIUS_ACCESS_TOKEN;

if (!GENIUS_TOKEN) {
  throw new Error('[Genius] ACCESS_TOKEN is missing – check your environment vars');
}

/** Initialize profanity filter */
const filter = new Filter();

/**
 * Loads custom exclude words from assets/excludeWords.txt and adds them to the filter.
 */
async function loadCustomExcludeWords(): Promise<void> {
  try {
    const asset = Asset.fromModule(require('../../assets/excludeWords.txt'));
    await asset.downloadAsync();
    
    if (asset.localUri) {
      const response = await fetch(asset.localUri);
      const text = await response.text();
      const customWords = text.split('\n').map(word => word.trim()).filter(Boolean);
      filter.addWords(...customWords);
      console.log(`[Genius] Loaded ${customWords.length} custom exclude words`);
    }
  } catch (error) {
    console.warn('[Genius] Failed to load custom exclude words:', error);
  }
}

// Load custom words on module initialization
loadCustomExcludeWords();

/**
 * Searches Genius for a track and returns the song ID.
 *
 * @param track - Song title
 * @param artist - Artist name
 * @returns Song ID or null if not found
 */
async function searchSong(track: string, artist: string): Promise<number | null> {
  console.log(`[Genius] Searching for "${track}" by ${artist}`);
  
  try {
    const searchQuery = `${track} ${artist}`;
    const searchUrl = `${SEARCH_ENDPOINT}?q=${encodeURIComponent(searchQuery)}`;
    
    console.log(`[Genius] Making request to: ${searchUrl}`);
    
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${GENIUS_TOKEN}`,
        'User-Agent': 'SnapConnect/1.0',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    console.log(`[Genius] Search response status: ${searchResponse.status}`);
    
    if (!searchResponse.ok) {
      console.error(`[Genius] Search failed: ${searchResponse.status} - ${searchResponse.statusText}`);
      return null;
    }
    
    const searchData = await searchResponse.json();
    console.log(`[Genius] Search response received, hits count: ${searchData.response?.hits?.length || 0}`);
    
    const hits = searchData.response?.hits as any[];
    
    if (!hits || hits.length === 0) {
      console.log(`[Genius] No results found for "${searchQuery}"`);
      return null;
    }
    
    // Try to find the most relevant hit by matching both title and artist
    const normalizedTrack = track.toLowerCase().replace(/[^a-z0-9]+/gi, ' ').trim();
    const normalizedArtist = artist.toLowerCase();

    console.log(`[Genius] Looking for exact match with normalized track: "${normalizedTrack}" and artist: "${normalizedArtist}"`);

    for (const hit of hits) {
      const hitTitle = hit.result?.title || '';
      const hitArtist = hit.result?.primary_artist?.name || '';
      const normalizedHitTitle = hitTitle.toLowerCase().replace(/[^a-z0-9]+/gi, ' ').trim();
      const normalizedHitArtist = hitArtist.toLowerCase();

      console.log(`[Genius] Checking hit: "${hitTitle}" by ${hitArtist} (normalized: "${normalizedHitTitle}" by "${normalizedHitArtist}")`);

      if (normalizedHitArtist.includes(normalizedArtist) && normalizedTrack.includes(normalizedHitTitle)) {
        const songId = hit.result?.id;
        console.log(`[Genius] Found exact match: "${hitTitle}" by ${hitArtist} (ID: ${songId})`);
        return songId;
      }
    }

    // If no exact match, use first hit but with sanity check
    const firstHit = hits[0];
    const songId = firstHit.result?.id;
    const hitTitle = firstHit.result?.title || '';
    const hitArtist = firstHit.result?.primary_artist?.name || '';
    const lyricsUrl = firstHit.result?.url;
    
    
    console.log(`[Genius] No exact match found. Using first hit: "${hitTitle}" by ${hitArtist} (ID: ${songId})`);
    console.log(`[Genius] First hit URL: ${lyricsUrl}`);
    
    // Sanity check: ensure the URL contains the longest word of the track title (avoids false positives like "A")
    const titleWords = normalizedTrack.split(' ').filter(Boolean);
    const longestWord = titleWords.sort((a, b) => b.length - a.length)[0] || '';

    console.log(`[Genius] Sanity check - longest word from track: "${longestWord}"`);

    if (!lyricsUrl || !lyricsUrl.toLowerCase().includes(longestWord)) {
      console.warn(`[Genius] Sanity check failed – URL does not contain longest word "${longestWord}". Skipping song.`);
      return null;
    }
    
    console.log(`[Genius] Sanity check passed. Using first hit: "${hitTitle}" by ${hitArtist} (ID: ${songId})`);
    return songId;
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('[Genius] Search request timed out after 10 seconds');
    } else {
      console.error('[Genius] Error searching for song:', error);
    }
    return null;
  }
}

/**
 * Fetches lyrics for a song using the Genius referents API.
 *
 * @param songId - Genius song ID
 * @returns Raw lyrics text or null if not found
 */
async function fetchLyricsBySongId(songId: number): Promise<string | null> {
  console.log(`[Genius] Fetching lyrics for song ID: ${songId}`);
  
  try {
    // Use the referents endpoint to get lyrics
    const referentsUrl = `${GENIUS_API_BASE}/referents?song_id=${songId}&text_format=plain`;
    
    console.log(`[Genius] Making referents request to: ${referentsUrl}`);
    
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const referentsResponse = await fetch(referentsUrl, {
      headers: {
        'Authorization': `Bearer ${GENIUS_TOKEN}`,
        'User-Agent': 'SnapConnect/1.0',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    console.log(`[Genius] Referents response status: ${referentsResponse.status}`);
    
    if (!referentsResponse.ok) {
      console.error(`[Genius] Referents request failed: ${referentsResponse.status} - ${referentsResponse.statusText}`);
      return null;
    }
    
    const referentsData = await referentsResponse.json();
    const referents = referentsData.response?.referents as any[];
    
    if (!referents || referents.length === 0) {
      console.log(`[Genius] No referents found for song ID: ${songId}`);
      return null;
    }
    
    console.log(`[Genius] Found ${referents.length} referents for song ID: ${songId}`);
    
    // Combine all referents into one lyrics text
    let allLyrics = '';
    for (const referent of referents) {
      const fragment = referent.fragment;
      if (fragment && fragment.trim()) {
        allLyrics += fragment + '\n';
      }
    }
    
    if (!allLyrics.trim()) {
      console.log(`[Genius] No lyrics content found in referents for song ID: ${songId}`);
      return null;
    }
    
    console.log(`[Genius] Combined ${allLyrics.length} characters of lyrics from referents`);
    return allLyrics.trim();
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('[Genius] Referents request timed out after 10 seconds');
    } else {
      console.error('[Genius] Error fetching lyrics by song ID:', error);
    }
    return null;
  }
}

/**
 * Searches Genius for a track and fetches cleaned lyrics using the proper API.
 *
 * @param track - Song title
 * @param artist - Artist name
 * @returns Cleaned lyrics string or null if not found/failed
 */
export async function fetchLyrics(track: string, artist: string): Promise<string | null> {
  console.log(`[Genius] Fetching lyrics for "${track}" by ${artist}`);
  
  try {
    // Step 1: Search for the song to get the song ID
    const songId = await searchSong(track, artist);
    
    if (!songId) {
      console.log(`[Genius] Could not find song ID for "${track}" by ${artist}`);
      return null;
    }
    
    // Step 2: Fetch lyrics using the song ID
    const rawLyrics = await fetchLyricsBySongId(songId);
    
    
    if (!rawLyrics) {
      console.log(`[Genius] Could not fetch lyrics for song ID: ${songId}`);
      return null;
    }
    
    console.log(`[Genius] Raw lyrics length: ${rawLyrics.length} characters`);
    
    // Step 3: Clean the lyrics
    const cleanedLyrics = cleanLyrics(rawLyrics);
    console.log(`[Genius] Cleaned lyrics length: ${cleanedLyrics.length} characters`);
    
    return cleanedLyrics;
    
  } catch (error) {
    console.error('[Genius] Error fetching lyrics:', error);
    return null;
  }
}

/**
 * Cleans raw lyrics by removing annotations and filtering profanity.
 *
 * @param rawLyrics - Raw lyrics text from Genius API
 * @returns Cleaned lyrics string
 */
function cleanLyrics(rawLyrics: string): string {
    console.log('\n\n >> cleanLyrics received rawLyrics: ', rawLyrics);
  let cleaned = rawLyrics;
  
  // Remove bracketed annotations like [Chorus], [Verse 1], etc.
  cleaned = cleaned.replace(/\[.*?\]/g, '');
  
  // Remove parenthetical annotations like (Chorus), (x2), etc.
  cleaned = cleaned.replace(/\(.*?\)/g, '');
  
  // Split into lines and filter out profanity
  const lines = cleaned.split('\n');
  const filteredLines = lines.filter(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return false;
    
    // Check if line contains profanity
    const hasProfanity = filter.isProfane(trimmedLine);
    if (hasProfanity) {
      console.log(`[Genius] Filtered profane line: "${trimmedLine.substring(0, 30)}..."`);
      return false;
    }
    
    return true;
  });
  
  // Rejoin lines and clean up extra whitespace
  cleaned = filteredLines
    .join('\n')
    .replace(/\n\s*\n/g, '\n') // Remove empty lines
    .trim();
  console.log('\n\n >> cleanLyrics returning cleaned lyrics: ', cleaned);
  return cleaned;
} 