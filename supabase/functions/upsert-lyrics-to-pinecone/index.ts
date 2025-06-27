/**
 * @file This Supabase Edge Function handles embedding lyrics and upserting them to Pinecone.
 * It is triggered by a POST request containing the userId.
 */

import { corsHeaders } from '../_shared/cors.ts';
import { Pinecone } from 'npm:@pinecone-database/pinecone';
import { OpenAIEmbeddings } from 'npm:@langchain/openai';
import { createClient } from 'npm:@supabase/supabase-js';

console.log('Function booting up...');

// Health check for environment variables
console.log('Checking for required environment variables...');
const requiredEnvs = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'PINECONE_API_KEY',
  'PINECONE_INDEX',
  'OPENAI_API_KEY',
];
let allEnvsPresent = true;
requiredEnvs.forEach(env => {
  if (!Deno.env.get(env)) {
    console.error(`Missing critical environment variable: ${env}`);
    allEnvsPresent = false;
  } else {
    console.log(`Successfully loaded environment variable: ${env}`);
  }
});

if (!allEnvsPresent) {
  console.error('Function cannot start due to missing environment variables.');
  // We don't return here because Deno.serve is top-level. The error will be caught on client initialization.
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL or Service Role Key is missing.');
}
const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Pinecone
const pineconeApiKey = Deno.env.get('PINECONE_API_KEY');
if (!pineconeApiKey) {
  throw new Error('Pinecone API Key is missing.');
}
const pinecone = new Pinecone({ apiKey: pineconeApiKey });

const pineconeIndexName = Deno.env.get('PINECONE_INDEX');
if (!pineconeIndexName) {
  throw new Error('Pinecone index name is missing.');
}
const pineconeIndex = pinecone.index(pineconeIndexName);

Deno.serve(async (req) => {
  console.log(`Received request: ${req.method}`);
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log(`Starting lyric upsert for user: ${userId}`);

    // 1. List files in Supabase Storage
    console.log('Listing files from Supabase Storage...');
    const { data: files, error: listError } = await supabaseClient.storage
      .from('lyrics-bucket')
      .list(userId);

    if (listError) throw listError;

    if (!files || files.length === 0) {
      console.log(`No lyrics found for user ${userId}.`);
      return new Response(JSON.stringify({ message: 'No lyrics found to process.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    console.log(`Found ${files.length} lyric files to process.`);

    // Initialize OpenAI Embeddings
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      // This check is inside the handler, so it can return a proper response.
      return new Response(JSON.stringify({ error: 'OpenAI API Key is not configured.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
    const embeddings = new OpenAIEmbeddings({ openAIApiKey });

    for (const file of files) {
      console.log(`\nProcessing file: ${file.name}`);
      const { data: blob, error: downloadError } = await supabaseClient.storage
        .from('lyrics-bucket')
        .download(`${userId}/${file.name}`);
      
      if (downloadError) {
        console.error(`Failed to download ${file.name}:`, downloadError.message);
        continue;
      }
      console.log(`Successfully downloaded ${file.name}.`);

      const text = await blob.text();
      const trackId = file.name.replace('.txt', '');

      // Split into lines
      const chunks = text.split('\n').filter(line => line.trim() !== '');
      console.log(`Split file into ${chunks.length} lines.`);

      const vectors = [];
      console.log('Generating embeddings for each line...');
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = await embeddings.embedQuery(chunk);
        vectors.push({
          id: `${trackId}_${i}`,
          values: embedding,
          metadata: { userId, trackId, text: chunk },
        });
      }

      console.log(`Generated ${vectors.length} vectors. Upserting to Pinecone...`);
      await pineconeIndex.upsert(vectors);
      console.log(`Successfully upserted vectors for ${file.name}.`);
    }

    console.log('\nFinished processing all lyric files.');
    return new Response(JSON.stringify({ message: 'Successfully processed and upserted lyrics.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/upsert-lyrics-to-pinecone' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
