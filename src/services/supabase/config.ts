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