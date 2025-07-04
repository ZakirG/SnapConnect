/**
 * This Supabase Edge Function orchestrates the RAG process to find a lyric for a given caption.
 * It is responsible for:
 * 1. Receiving a POST request with a "caption" and "userId".
 * 2. Generating an embedding for the caption using OpenAI.
 * 3. Querying a Pinecone index to find the top 5 relevant lyric chunks for the user.
 * 4. Using a Chat model (GPT-4o-mini) to select the best lyric from the candidates.
 * 5. Returning the selected lyric, along with its metadata (artist, track).
 *
 * This function must be deployed to Supabase and requires the following environment variables to be set in the Supabase dashboard:
 *  - OPENAI_API_KEY
 *  - PINECONE_API_KEY
 */

import { corsHeaders } from '../_shared/cors.ts';
import { Pinecone } from 'npm:@pinecone-database/pinecone';
import { OpenAIEmbeddings, ChatOpenAI } from 'npm:@langchain/openai';

// Define the metadata structure for our vectors
type LyricMetadata = {
  userId: string;
  track: string;
  artist: string;
  text: string;
};

// Main function handler
Deno.serve(async (req) => {
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Extract caption, userId, and count from the request body
    const { caption, userId, count = 1 } = await req.json();
    if (!caption || !userId) {
      throw new Error('Missing required fields: caption and userId');
    }

    console.log(`[Function] Received request for userId: ${userId}, caption: "${caption}", count: ${count}`);

    // Initialize clients and embeddings
    const pineconeApiKey = Deno.env.get('PINECONE_API_KEY');
    if (!pineconeApiKey) throw new Error('PINECONE_API_KEY is not set.');
    
    const pinecone = new Pinecone({ apiKey: pineconeApiKey });
    const pineconeIndex = pinecone.index('snap-lyrics');

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    // 1. Generate embedding for the caption
    const captionEmbedding = await embeddings.embedQuery(caption);
    console.log('[Function] Generated embedding for caption.');

    // 2. Query Pinecone - get more results to have variety for multiple options
    const topK = Math.max(5, count * 3); // Get at least 3x the requested count for variety
    const results = await pineconeIndex.query({
      vector: captionEmbedding,
      topK: topK,
      filter: { userId: { '$eq': userId } },
      includeMetadata: true,
    });
    console.log(`[Function] Found ${results.matches.length} potential lyric matches.`);

    if (!results.matches || results.matches.length === 0) {
      return new Response(JSON.stringify({ error: 'No matching lyrics found.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    // 3. Prepare candidate lyrics for the AI model
    const candidates = results.matches
      .map(match => match.metadata as unknown as LyricMetadata)
      .filter(metadata => metadata && metadata.text);

    if (candidates.length === 0) {
        return new Response(JSON.stringify({ error: 'No valid lyric candidates found after filtering.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404,
        });
    }
    
    const candidateLines = candidates.map(c => {
      const trackPart = c.track ? ` from "${c.track}"` : '';
      const artistPart = c.artist ? ` by ${c.artist}` : '';
      return `"${c.text}"${trackPart}${artistPart}`;
    }).join('\n');
    console.log(`[Function] Candidate lines for AI selection:\n${candidateLines}`);

    // 4. Use ChatOpenAI to choose the best line(s)
    const model = new ChatOpenAI({
      openAIApiKey: Deno.env.get('OPENAI_API_KEY'),
      modelName: 'gpt-4o-mini',
      temperature: 0.7, // Higher temperature for more variety
    });

    if (count === 1) {
      // Original logic for single result
      const prompt = `From the following list of song lyrics, choose the single line that best matches the sentiment or theme of this caption: "${caption}".

Candidate lyrics:
${candidateLines}

Return ONLY the full, original candidate line you chose (e.g., "And I think to myself, what a wonderful world." from "What A Wonderful World" by Louis Armstrong). Do not add any extra formatting or explanation.`;

      const response = await model.invoke(prompt);
      const chosenLineWithContext = response.content as string;
      console.log(`[Function] AI model chose: ${chosenLineWithContext}`);

      // Find the full metadata for the chosen line
      const chosenCandidate = candidates.find(c => chosenLineWithContext.includes(c.text));

      if (!chosenCandidate) {
        throw new Error('Could not match AI response to a candidate lyric.');
      }

      console.log(`[Function] Final selection: "${chosenCandidate.text}" from "${chosenCandidate.track}"`);
      
      // Return single result
      return new Response(JSON.stringify(chosenCandidate), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } else {
      // New logic for multiple results
      const prompt = `From the following list of song lyrics, choose the ${count} lines that best match the sentiment or theme of this caption: "${caption}". Choose diverse options that offer different perspectives or moods.

Candidate lyrics:
${candidateLines}

Return ONLY the ${count} chosen lines, each on a separate line, using the exact format from the candidates (e.g., "lyric text" from "song" by artist). Do not add numbering, bullets, or extra formatting.`;

      const response = await model.invoke(prompt);
      const chosenLines = (response.content as string).split('\n').filter(line => line.trim());
      console.log(`[Function] AI model chose ${chosenLines.length} lines:`, chosenLines);

      // Find metadata for each chosen line
      const chosenCandidates = [];
      for (const line of chosenLines.slice(0, count)) {
        const candidate = candidates.find(c => line.includes(c.text));
        if (candidate) {
          chosenCandidates.push(candidate);
        }
      }

      if (chosenCandidates.length === 0) {
        throw new Error('Could not match any AI responses to candidate lyrics.');
      }

      console.log(`[Function] Final ${chosenCandidates.length} selections:`, chosenCandidates.map(c => `"${c.text}" from "${c.track}"`));
      
      // Return multiple results as array
      return new Response(JSON.stringify(chosenCandidates), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

  } catch (error) {
    console.error('[Function] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 