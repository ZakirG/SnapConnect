/**
 * This file contains the Supabase configuration for the application.
 * It initializes and exports the Supabase client instance.
 *
 * NOTE: The Supabase URL and anon key are read from environment variables.
 * These should be set in your .env file.
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

console.log('🔧 Supabase Configuration Loading...');
console.log('🌐 SUPABASE_URL:', SUPABASE_URL ? `${SUPABASE_URL.substring(0, 20)}...` : 'MISSING');
console.log('🔑 SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? `${SUPABASE_ANON_KEY.substring(0, 20)}...` : 'MISSING');

// Initialize Supabase client
const supabaseUrl = SUPABASE_URL;
const supabaseAnonKey = SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables:');
  console.error('❌ SUPABASE_URL:', supabaseUrl ? '✅ Present' : '❌ Missing');
  console.error('❌ SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Present' : '❌ Missing');
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

console.log('✅ Supabase environment variables found');
console.log('🚀 Creating Supabase client...');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

console.log('✅ Supabase client created successfully');

// ────────────────────────────────────────────────────────────────
// Debug diagnostics: confirm which Supabase project / database we
// are connected to and print Postgres version information. This
// helps ensure we are operating against the expected backend.
// ────────────────────────────────────────────────────────────────
(async () => {
  try {
    // 1. Print the REST endpoint in use (includes project ref)
    // Example: https://abcd1234.supabase.co/rest/v1
    // eslint-disable-next-line no-console
    console.log('🔗 Supabase REST endpoint:', supabaseUrl + '/rest/v1');

    // 2. Attempt to retrieve server version via a lightweight SQL call.
    //    We use the internal /rpc Execute SQL function if enabled; if not,
    //    we simply ignore the failure.
    const { data, error } = await supabase.rpc('pgsql_version');

    if (error) {
      console.warn('⚠️  pgsql_version RPC not found or no permission – skipping version print');
    } else if (data) {
      console.log('🗄️  Postgres version:', data);
    }
  } catch (err) {
    console.error('❌ Debug connection check failed:', err);
  }
})();

// Test the connection
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('❌ Supabase connection test failed:', error);
  } else {
    console.log('✅ Supabase connection test successful');
    console.log('📊 Current session:', data.session ? 'User logged in' : 'No active session');
  }
});

// Export auth for compatibility
export const auth = supabase.auth;

// Export database client
export const db = supabase;

// Keep default export for backward compatibility
export default supabase; 