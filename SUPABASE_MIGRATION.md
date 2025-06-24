# Firebase to Supabase Migration Guide

## Overview

This document outlines the complete migration from Firebase to Supabase for the SnapConnect application.

## Changes Made

### 1. Dependencies
- **Removed**: `firebase` package
- **Added**: `@supabase/supabase-js` package

### 2. Configuration
- **Updated**: `src/services/supabase/config.ts` (formerly `firebase/config.ts`)
  - Replaced Firebase initialization with Supabase client setup
  - Uses environment variables: `SUPABASE_URL` and `SUPABASE_ANON_KEY`
  - Configured AsyncStorage for auth persistence

### 3. Authentication
- **Updated**: All authentication screens and flows
  - `LoginScreen.js`: Uses `supabase.auth.signInWithPassword()`
  - `SignupScreen.js`: Uses `supabase.auth.signUp()` + user profile creation
  - `ProfileScreen.js`: Uses `supabase.auth.signOut()`
  - `App.js`: Uses Supabase auth state monitoring

### 4. Database Services
- **Friends Service** (`src/services/friends.ts`):
  - Migrated from Firestore to PostgreSQL tables
  - Uses SQL queries instead of Firestore operations
  - Implements proper error handling

- **Chat Service** (`src/services/chat.ts`):
  - Migrated from Firebase Realtime Database to Supabase real-time
  - Uses PostgreSQL tables with real-time subscriptions
  - Deterministic conversation IDs

- **Snaps Service** (`src/services/snaps.ts`):
  - Migrated from Firebase Storage to Supabase Storage
  - Uses PostgreSQL for metadata storage
  - Supports recipient arrays for multi-user snaps

### 5. Type Definitions
- **Updated**: `src/store/user.ts` - Uses Supabase User type
- **Updated**: `src/types/env.d.ts` - Updated environment variables
- **Removed**: Firebase-specific type definitions

### 6. Configuration Files
- **Simplified**: `metro.config.js` - Removed Firebase-specific configurations

## Required Supabase Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully set up (this can take a few minutes)

### 2. Get Your Supabase Keys
In your Supabase dashboard:

1. Go to **Settings** → **API**
2. You'll find two important values:
   - **Project URL** (looks like: `https://your-project.supabase.co`)
   - **Anon/Public Key** (looks like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### 3. Environment Variables
Update your `.env` file with these values:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important**: 
- Use the **Project URL** for `SUPABASE_URL`
- Use the **anon/public key** (NOT the service_role key) for `SUPABASE_ANON_KEY`
- Remove the old `NEXT_PUBLIC_SUPABASE_URL` and `DATABASE_URL` if they exist

### 4. Enable Authentication
In your Supabase dashboard:

1. Go to **Authentication** → **Settings**
2. Make sure these are enabled:
   - **Enable email confirmations**: Turn OFF for development (you can enable later)
   - **Allow unverified email sign-ins**: Turn ON for development
3. Under **Auth Providers**, make sure **Email** is enabled

### 5. Database Schema
Run the SQL commands in `src/services/supabase/schema.sql` in your Supabase SQL editor:

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy and paste the entire schema from the file
3. Click **Run** to execute the SQL

This will create:
- `users` table (extends auth.users)
- `friends` table (bidirectional friendships)
- `friend_requests` table
- `conversations` table
- `messages` table
- `snaps` table
- Row Level Security (RLS) policies
- Performance indexes

### 6. Storage Bucket
1. Go to **Storage** in your Supabase dashboard
2. Click **Create bucket**
3. Name it `snaps-bucket`
4. Make it **Public** (for easier access to images)
5. Click **Create bucket**

## Key Differences

### Firebase vs Supabase

| Feature | Firebase | Supabase |
|---------|----------|----------|
| Database | Firestore (NoSQL) | PostgreSQL (SQL) |
| Real-time | Realtime Database | Real-time subscriptions |
| Storage | Cloud Storage | Supabase Storage |
| Auth | Firebase Auth | Supabase Auth |
| User IDs | String UIDs | UUID |

### API Changes

#### Authentication
```javascript
// Firebase
await signInWithEmailAndPassword(auth, email, password);

// Supabase
const { data, error } = await supabase.auth.signInWithPassword({ email, password });
```

#### Database Queries
```javascript
// Firebase
const snapshot = await getDocs(query(collection(db, 'users'), where('username', '==', username)));

// Supabase
const { data, error } = await supabase.from('users').select('*').eq('username', username);
```

#### Real-time Subscriptions
```javascript
// Firebase
onValue(ref(rtdb, `conversations/${roomId}/messages`), callback);

// Supabase
const channel = supabase.channel('messages').on('postgres_changes', { ... }, callback).subscribe();
```

## Testing the Migration

1. **Set up Supabase project** with the provided schema
2. **Update environment variables** with your Supabase credentials
3. **Test authentication flows**: Login, signup, logout
4. **Test friend system**: Search, send requests, accept/deny
5. **Test chat functionality**: Send messages, real-time updates
6. **Test snap functionality**: Upload media, send snaps

## Troubleshooting

### "Invalid API Key" Error
- Make sure you're using the **anon/public key**, not the service_role key
- Verify the `SUPABASE_URL` is correct (should start with `https://`)
- Check that your `.env` file is in the root directory of your project

### Authentication Issues
- In Supabase dashboard, go to Authentication → Settings
- Turn OFF email confirmations for development
- Turn ON "Allow unverified email sign-ins"
- Make sure Email provider is enabled

### Database Connection Issues
- Make sure you've run the SQL schema in your Supabase SQL editor
- Check that RLS policies are set up correctly
- Verify tables exist in the Table editor

## Benefits of Supabase

1. **SQL Database**: More familiar query language and better relations
2. **Real-time**: Built-in real-time subscriptions for all tables
3. **Type Safety**: Better TypeScript support with generated types
4. **Row Level Security**: Built-in security policies
5. **Cost**: Generally more cost-effective than Firebase
6. **Open Source**: Can self-host if needed

## Next Steps

1. Set up your Supabase project
2. Get your API keys from the dashboard
3. Update your environment variables
4. Run the database schema
5. Configure authentication settings
6. Test the application thoroughly
7. Consider implementing database triggers for automatic cleanup (expired snaps)
8. Optimize queries and indexes based on usage patterns 