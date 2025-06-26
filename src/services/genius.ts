/**
 * Genius API service for fetching and cleaning song lyrics.
 *
 * External dependencies:
 *  - bad-words for profanity filtering
 *  - cheerio for HTML parsing/scraping
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
 * Searches Genius for a track and fetches cleaned lyrics.
 *
 * @param track - Song title
 * @param artist - Artist name
 * @returns Cleaned lyrics string or null if not found/failed
 */
export async function fetchLyrics(track: string, artist: string): Promise<string | null> {
  console.log(`[Genius] Fetching lyrics for "${track}" by ${artist}`);
  
  try {
    // Step 1: Search for the song
    const searchQuery = `${track} ${artist}`;
    const searchUrl = `${SEARCH_ENDPOINT}?q=${encodeURIComponent(searchQuery)}`;
    
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${GENIUS_TOKEN}`,
        'User-Agent': 'SnapConnect/1.0',
      },
    });
    
    if (!searchResponse.ok) {
      console.error(`[Genius] Search failed: ${searchResponse.status}`);
      return null;
    }
    
    const searchData = await searchResponse.json();
    const hits = searchData.response?.hits as any[];
    
    if (!hits || hits.length === 0) {
      console.log(`[Genius] No results found for "${searchQuery}"`);
      return null;
    }
    
    // Try to find the most relevant hit by matching both title and artist
    let chosenHit: any | null = null;

    const normalizedTrack = track.toLowerCase().replace(/[^a-z0-9]+/gi, ' ').trim();
    const normalizedArtist = artist.toLowerCase();

    for (const hit of hits) {
      const hitTitle = hit.result?.title || '';
      const hitArtist = hit.result?.primary_artist?.name || '';
      const normalizedHitTitle = hitTitle.toLowerCase().replace(/[^a-z0-9]+/gi, ' ').trim();
      const normalizedHitArtist = hitArtist.toLowerCase();

      if (normalizedHitArtist.includes(normalizedArtist) && normalizedTrack.includes(normalizedHitTitle)) {
        chosenHit = hit;
        break;
      }
    }

    // If no perfect match, fallback to first hit
    if (!chosenHit) {
      console.log('[Genius] No exact match found – using first search hit');
      chosenHit = hits[0];
    }

    const lyricsUrl = chosenHit.result?.url;
    
    // Sanity check: ensure the URL contains the longest word of the track title (avoids false positives like "A")
    const titleWords = normalizedTrack.split(' ').filter(Boolean);
    const longestWord = titleWords.sort((a, b) => b.length - a.length)[0] || '';

    if (!lyricsUrl || !lyricsUrl.toLowerCase().includes(longestWord)) {
      console.warn(`[Genius] Sanity check failed – URL does not contain longest word "${longestWord}". Skipping song.`);
      return null;
    }
    
    console.log(`[Genius] Found song URL: ${lyricsUrl}`);
    
    // Step 2: Scrape lyrics from the song page
    const lyricsResponse = await fetch(lyricsUrl, {
      headers: {
        'User-Agent': 'SnapConnect/1.0',
      },
    });
    
    if (!lyricsResponse.ok) {
      console.error(`[Genius] Failed to fetch lyrics page: ${lyricsResponse.status}`);
      return null;
    }
    
    const html = await lyricsResponse.text();
    
    // Extract lyrics using regex patterns (React Native compatible approach)
    let lyricsText = extractLyricsFromHtml(html);
    
    if (!lyricsText || !lyricsText.trim()) {
      console.warn('[Genius] No lyrics text found on page');
      return null;
    }
    
    console.log(`[Genius] Extracted ${lyricsText.length} characters of lyrics`);
    
    // Step 3: Clean the lyrics
    const cleanedLyrics = cleanLyrics(lyricsText);
    
    console.log(`[Genius] Cleaned lyrics: ${cleanedLyrics.length} characters remaining`);
    return cleanedLyrics;
    
  } catch (error) {
    console.error('[Genius] Error fetching lyrics:', error);
    return null;
  }
}

/**
 * Extracts lyrics from Genius HTML using regex patterns (React Native compatible).
 *
 * @param html - Raw HTML from Genius page
 * @returns Extracted lyrics text or null
 */
function extractLyricsFromHtml(html: string): string | null {
  console.log('[Genius] Parsing HTML for lyrics content...');
  
  // Look for lyrics containers with more specific patterns
  // Pattern 1: Find all divs with data-lyrics-container="true"
  const lyricsContainerPattern = /<div[^>]*data-lyrics-container="true"[^>]*>(.*?)<\/div>/gs;
  const containerMatches = [...html.matchAll(lyricsContainerPattern)];
  
  if (containerMatches.length > 0) {
    console.log(`[Genius] Found ${containerMatches.length} lyrics containers`);
    
    // Combine all lyrics containers
    let allLyrics = '';
    for (const match of containerMatches) {
      const containerContent = match[1];
      
      // Clean the HTML content
      let cleanContent = containerContent
        // Convert line breaks to newlines
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        // Remove all HTML tags
        .replace(/<[^>]*>/g, '')
        // Decode HTML entities
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/&apos;/g, "'")
        // Clean up whitespace
        .replace(/\n\s*\n/g, '\n')
        .trim();
      
      if (cleanContent.length > 10) {
        allLyrics += cleanContent + '\n';
      }
    }
    
    if (allLyrics.trim().length > 50) {
      // Remove the first line if it contains title/contributor info (like lyricsgenius does)
      const lines = allLyrics.trim().split('\n');
      const firstLine = lines[0] || '';
      
      // Skip first line if it looks like metadata (contains "Contributor", song title, etc.)
      if (firstLine.includes('Contributor') || 
          firstLine.includes('Lyrics') ||
          firstLine.length < 10) {
        console.log(`[Genius] Removing metadata line: "${firstLine}"`);
        return lines.slice(1).join('\n').trim();
      }
      
      return allLyrics.trim();
    }
  }
  
  // Fallback: Look for any div with "lyrics" in the class name
  console.log('[Genius] Trying fallback lyrics extraction...');
  const fallbackPattern = /<div[^>]*class="[^"]*[Ll]yrics[^"]*"[^>]*>(.*?)<\/div>/gs;
  const fallbackMatches = [...html.matchAll(fallbackPattern)];
  
  for (const match of fallbackMatches) {
    let content = match[1]
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .trim();
    
    if (content.length > 50) {
      // Remove first line if it's metadata
      const lines = content.split('\n');
      if (lines[0] && (lines[0].includes('Contributor') || lines[0].includes('Lyrics'))) {
        return lines.slice(1).join('\n').trim();
      }
      return content;
    }
  }
  
  console.log('[Genius] No lyrics content found in HTML');
  return null;
}

/**
 * Cleans raw lyrics by removing annotations and filtering profanity.
 *
 * @param rawLyrics - Raw lyrics text
 * @returns Cleaned lyrics string
 */
function cleanLyrics(rawLyrics: string): string {
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
  
  return cleaned;
} 