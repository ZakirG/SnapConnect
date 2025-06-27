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

// Initialize Supabase client with the service role key for admin-level access.
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL or Service Role Key is missing.');
}
const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    // Service role key should be used on the server-side to bypass RLS.
    persistSession: false,
    autoRefreshToken: false,
  },
});

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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const logs: string[] = [];
  const log = (message: any) => {
    const msgString = typeof message === 'string' ? message : JSON.stringify(message);
    logs.push(msgString);
    console.log(message);
  };
  const logError = (message: any, ...optionalParams: any[]) => {
    const msgString = typeof message === 'string' ? message : JSON.stringify(message);
    const paramsString = optionalParams.map(p => typeof p === 'string' ? p : JSON.stringify(p)).join(' ');
    logs.push(`[ERROR] ${msgString} ${paramsString}`);
    console.error(message, ...optionalParams);
  };

  try {
    log(`Received request: ${req.method}`);
    const { userId } = await req.json();
    if (!userId) {
      logError('Request body missing userId');
      return new Response(JSON.stringify({ error: 'userId is required', logs }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    log(`Starting lyric upsert for user: ${userId}`);

    // 1. List files in Supabase Storage
    const BUCKET_NAME = 'lyrics-bucket';
    log(`Listing files from Supabase Storage in bucket: ${BUCKET_NAME}...`);

    // --- Start Diagnostics ---
    log('Inspecting root of bucket for user folders...');
    const { data: rootItems, error: rootListError } = await supabaseClient.storage
      .from(BUCKET_NAME)
      .list();

    if (rootListError) {
      logError('Error listing bucket root:', rootListError.message);
    } else if (rootItems && rootItems.length > 0) {
      log(`Found ${rootItems.length} items at the root:`);
      rootItems.forEach(item => {
        const itemType = item.id === null ? 'folder' : 'file';
        log(`- ${item.name} (type: ${itemType})`);
      });
    } else {
      log('The root of the bucket is empty.');
    }
    // --- End Diagnostics ---

    const { data: files, error: listError } = await supabaseClient.storage
      .from(BUCKET_NAME)
      .list(userId);

    if (listError) {
      logError('Error listing user-specific files:', listError.message);
      throw listError;
    }

    if (files) {
      log(`Found ${files.length} user-specific files:`);
      files.forEach(file => log(`- ${file.name}`));
    }

    if (!files || files.length === 0) {
      log(`No lyrics found for user ${userId}.`);
      return new Response(JSON.stringify({ message: 'No lyrics found to process.', logs }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    log(`Found ${files.length} lyric files to process.`);

    // Initialize OpenAI Embeddings
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      logError('OpenAI API Key is not configured.');
      return new Response(JSON.stringify({ error: 'OpenAI API Key is not configured.', logs }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
    const embeddings = new OpenAIEmbeddings({ openAIApiKey });

    for (const file of files) {
      log(`\nProcessing file: ${file.name}`);
      const { data: blob, error: downloadError } = await supabaseClient.storage
        .from(BUCKET_NAME)
        .download(`${userId}/${file.name}`);
      
      if (downloadError) {
        logError(`Failed to download ${file.name}:`, downloadError.message);
        continue;
      }
      log(`Successfully downloaded ${file.name}.`);

      const text = await blob.text();
      const trackId = file.name.replace('.txt', '');

      // Split into lines
      const chunks = text.split('\n').filter(line => line.trim() !== '');
      log(`Split file into ${chunks.length} lines.`);

      if (chunks.length < 3) {
        log(`Skipping file ${file.name} because it has fewer than 3 lines.`);
        continue;
      }

      const vectors = [];
      log('Generating embeddings for each line...');
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = await embeddings.embedQuery(chunk);
        vectors.push({
          id: `${trackId}_${i}`,
          values: embedding,
          metadata: { userId, trackId, text: chunk },
        });
      }

      log(`Generated ${vectors.length} vectors. Upserting to Pinecone...`);
      await pineconeIndex.upsert(vectors);
      log(`Successfully upserted vectors for ${file.name}.`);
    }

    log('\nFinished processing all lyric files.');
    return new Response(JSON.stringify({ message: 'Successfully processed and upserted lyrics.', logs }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    logError('Error processing request:', error);
    return new Response(JSON.stringify({ error: error.message, logs }), {
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
