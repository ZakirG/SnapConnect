/**
 * This service is the client-side entry point for the RAG (Retrieval-Augmented Generation) process.
 * It securely calls a Supabase Edge Function to protect sensitive API keys and business logic.
 *
 * The main function, `captionToLyric`, sends a caption to the backend, which then finds
 * a relevant song lyric and returns it along with its metadata (track and artist name).
 */
import { supabase } from './supabase/config';
import { useUserStore } from '../store/user';

/**
 * A type definition for the expected successful response from the edge function.
 */
type LyricResponse = {
  line: string;
  track: string;
  artist: string;
  text: string;
};

/**
 * Calls the `caption-to-lyric` Supabase Edge Function to convert an image caption to relevant song lyrics.
 *
 * @param {string} caption - The input caption describing an image.
 * @param {number} count - The number of lyric options to return (defaults to 1).
 * @returns {Promise<LyricResponse[] | LyricResponse | null>}
 *          An array of lyrics (if count > 1), a single lyric object (if count = 1), or null if an error occurs.
 */
export async function captionToLyric(caption: string, count: number = 1): Promise<LyricResponse[] | LyricResponse | null> {
  const state = useUserStore.getState();
  if (!state.user) {
    console.error('[RAG] User not found, cannot invoke edge function.');
    return null;
  }

  try {
    console.log('[RAG] Invoking caption-to-lyric edge function with caption:', caption, 'count:', count);
    const { data, error } = await supabase.functions.invoke('caption-to-lyric', {
      body: { caption, userId: state.user.id, count },
    });
    
    // Log the raw response for debugging
    console.log('[RAG] Raw response from edge function:');
    console.log('Data:', JSON.stringify(data, null, 2));
    console.log('Error:', JSON.stringify(error, null, 2));

    if (error) {
      throw error;
    }
    
    if (!data) {
        throw new Error("No data returned from the function.");
    }
    
    // The 'data' from a successful function invocation is the JSON payload.
    console.log('[RAG] Successfully parsed lyric from edge function:', data);
    return data as LyricResponse;

  } catch (error) {
    console.error('[RAG] Error invoking or processing caption-to-lyric function:', error);
    return null;
  }
} 