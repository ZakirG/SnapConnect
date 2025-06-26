/**
 * Genius API service for fetching and cleaning song lyrics.
 *
 * Uses the genius-lyrics-api package which handles all the API complexity
 * and provides clean lyrics in text format.
 *
 * External dependencies:
 *  - genius-lyrics-api for lyrics fetching
 *  - bad-words for profanity filtering
 *
 * Environment variables expected:
 *  • EXPO_PUBLIC_GENIUS_ACCESS_TOKEN - Genius API client access token
 *
 * All functions log their major operations for debugging.
 */

import { getLyrics } from 'genius-lyrics-api';
import Filter from 'bad-words';
import { Asset } from 'expo-asset';

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
 * Searches Genius for a track and fetches cleaned lyrics using the genius-lyrics-api package.
 *
 * @param track - Song title
 * @param artist - Artist name
 * @returns Cleaned lyrics string or null if not found/failed
 */
export async function fetchLyrics(track: string, artist: string): Promise<string | null> {
  console.log(`[Genius] Fetching lyrics for "${track}" by ${artist}`);
  
  try {
    const options = {
      apiKey: GENIUS_TOKEN,
      title: track,
      artist: artist,
      optimizeQuery: true, // Perform cleanup to maximize chance of finding a match
      authHeader: true // Include auth header in the search request
    };
    
    console.log(`[Genius] Making request with options:`, { title: track, artist: artist, optimizeQuery: true });
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => {
        console.error('[Genius] Request timed out after 10 seconds');
        resolve(null);
      }, 10000);
    });
    
    const lyricsPromise = getLyrics(options);
    
    // Race between the lyrics request and timeout
    const lyrics = await Promise.race([lyricsPromise, timeoutPromise]);
    
    if (!lyrics) {
      console.log(`[Genius] No lyrics found for "${track}" by ${artist}`);
      return null;
    }
    
    console.log(`[Genius] Raw lyrics length: ${lyrics.length} characters`);
    
    // Clean the lyrics
    const cleanedLyrics = cleanLyrics(lyrics);
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
 * @param rawLyrics - Raw lyrics text from genius-lyrics-api
 * @returns Cleaned lyrics string
 */
function cleanLyrics(rawLyrics: string): string {
//   console.log('\n\n >> cleanLyrics received rawLyrics: ', rawLyrics);
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
  
//   console.log('\n\n >> cleanLyrics returning cleaned lyrics: ', cleaned);
  return cleaned;
} 