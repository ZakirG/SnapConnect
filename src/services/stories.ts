/**
 * Stories Service
 * ---------------
 * Handles all Supabase interactions for Instagram/Snapchat-style user stories.
 * A "story" is ephemeral media (image or video) that expires after 24h and is
 * visible to the user's friends.
 *
 * Table: stories
 *   - id (uuid, pk)
 *   - user_id (uuid, fk → users.id)
 *   - storage_url (text)
 *   - media_type (text; 'image' | 'video')
 *   - created_at (timestamp)
 *   - expires_at (timestamp)
 *
 * This service purposefully mirrors snaps.ts to keep the codebase consistent.
 */

import { supabase } from './supabase/config';
import { getFriends } from './friends';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer'; // Ensures polyfill for atob/btoa if needed

export type MediaType = 'image' | 'video';

/**
 * uploads a story file to Supabase storage and returns its public URL.
 */
async function uploadStoryMedia(
  userId: string,
  mediaUri: string,
  mediaType: MediaType,
): Promise<string> {
  if (!userId) throw new Error('Missing userId while uploading story');
  if (!mediaUri) throw new Error('Missing mediaUri while uploading story');

  // ----------------------------------------------------------------------------------
  // React Native fetch(uri) returns zero-byte blob for local files. Instead, read the
  // file using Expo FileSystem, convert base64 → Buffer, then upload.
  // ----------------------------------------------------------------------------------
  const base64 = await FileSystem.readAsStringAsync(mediaUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Convert base64 → binary Uint8Array because supabase-js on RN handles
  // Uint8Array/ArrayBuffer more reliably than Node Buffer.
  const binaryString = globalThis.atob ? globalThis.atob(base64) : Buffer.from(base64, 'base64').toString('binary');
  const fileBytes = Uint8Array.from(binaryString, (x) => x.charCodeAt(0));

  console.log('[stories] upload fileBytes length', fileBytes.length);

  const extension = mediaType === 'video' ? 'mp4' : 'jpg';
  const filePath = `stories/${userId}/${Date.now()}.${extension}`;

  const { data, error } = await supabase.storage
    .from('stories-bucket')
    .upload(filePath, fileBytes, {
      contentType: mediaType === 'video' ? 'video/mp4' : 'image/jpeg',
      upsert: false,
    });

  if (error) {
    throw new Error(`Story upload failed: ${error.message}`);
  }

  // Always create a signed URL valid for 24 h so it works with either
  // public *or* private buckets and avoids 401s in client fetches.
  const { data: signed, error: signedErr } = await supabase.storage
    .from('stories-bucket')
    .createSignedUrl(data.path, 60 * 60 * 24);

  if (signedErr) {
    throw new Error(`Failed to generate signed URL: ${signedErr.message}`);
  }

  return signed.signedUrl;
}

/**
 * Creates a new story row after uploading media.
 */
export async function postStory(
  userId: string,
  mediaUri: string,
  mediaType: MediaType = 'image',
): Promise<void> {
  const storageUrl = await uploadStoryMedia(userId, mediaUri, mediaType);

  const now = Date.now();
  const { error } = await supabase.from('stories').insert([
    {
      user_id: userId,
      storage_url: storageUrl,
      media_type: mediaType,
      created_at: new Date(now).toISOString(),
      expires_at: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
    },
  ]);

  if (error) throw new Error(`Failed to insert story row: ${error.message}`);
}

/**
 * Fetches the latest story (within 24h) for each friend + the user.
 *
 * @param {string} userId – Current authenticated user.
 */
export async function getStoriesForUser(userId: string): Promise<{
  id: string; // story id
  userId: string;
  username: string;
  avatarUrl?: string;
  storageUrl: string;
  mediaType: MediaType;
  createdAt: string;
  expiresAt: string;
}[]> {
  if (!userId) return [];

  // Compile list of userIds whose stories we care about
  const friends = await getFriends(userId);
  const userIds = [userId, ...friends.map((f) => f.id)];

  const nowIso = new Date().toISOString();

  // Get stories within last 24h of those users
  const { data: storyRows, error: storiesError } = await supabase
    .from('stories')
    .select('id, user_id, storage_url, media_type, created_at, expires_at')
    .in('user_id', userIds)
    .gte('expires_at', nowIso)
    .order('created_at', { ascending: false });

  if (storiesError) {
    throw new Error(`Failed to fetch stories: ${storiesError.message}`);
  }

  if (!storyRows || storyRows.length === 0) return [];

  // Keep only the latest story per user_id
  const latestPerUser = new Map<string, any>();
  for (const row of storyRows) {
    if (!latestPerUser.has(row.user_id)) {
      latestPerUser.set(row.user_id, row);
    }
  }

  // Fetch associated profiles for usernames & avatars
  const profileIds = Array.from(latestPerUser.keys());
  const { data: profileRows, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', profileIds);

  if (profileError) {
    throw new Error(`Failed to fetch story user profiles: ${profileError.message}`);
  }

  const profileMap = new Map(profileRows?.map((p: any) => [p.id, p]));

  // Build combined result
  const results = Array.from(latestPerUser.values()).map((story: any) => {
    const profile = profileMap.get(story.user_id) || {};
    return {
      id: story.id,
      userId: story.user_id,
      username: profile.username ?? 'Unknown',
      avatarUrl: profile.avatar_url,
      storageUrl: story.storage_url,
      mediaType: story.media_type as MediaType,
      createdAt: story.created_at,
      expiresAt: story.expires_at,
    };
  });

  return results;
} 