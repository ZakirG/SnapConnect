/**
 * Friend Management Service
 * -------------------------
 * This module contains all Supabase interactions related to the friend
 * management system:
 *   • Searching users by username
 *   • Sending, receiving, accepting, and denying friend requests
 *   • Fetching the current user's friends list
 *
 * Database Schema (PostgreSQL tables)
 * -----------------------------------
 * users table:
 *   - id (uuid, primary key) - matches auth.users.id
 *   - username (text, unique)
 *   - email (text)
 *   - created_at (timestamp)
 *
 * friends table:
 *   - id (uuid, primary key)
 *   - user_id (uuid, foreign key to users.id)
 *   - friend_id (uuid, foreign key to users.id)
 *   - created_at (timestamp)
 *
 * friend_requests table:
 *   - id (uuid, primary key)
 *   - requester_id (uuid, foreign key to users.id)
 *   - recipient_id (uuid, foreign key to users.id)
 *   - created_at (timestamp)
 */

import { supabase } from './supabase/config';
import type { User } from '@supabase/supabase-js';

/** *******************************
 * Type Definitions
 * *******************************/

/**
 * A lightweight representation of a user.
 */
export interface PublicUser {
  id: string;
  username: string;
  email?: string;
  avatar_url?: string;
}

/**
 * A friend request object returned from the database.
 */
export interface FriendRequest extends PublicUser {
  created_at: string;
  requester_id: string;
}

/** *******************************
 * Public API
 * *******************************/

/**
 * Searches for users whose `username` field matches the provided search term.
 *
 * @param {string} username - The username to search for.
 * @returns {Promise<PublicUser[]>} A list of matching users.
 */
export async function searchUsersByUsername(username: string): Promise<PublicUser[]> {
  if (!username) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .ilike('username', `%${username.toLowerCase().trim()}%`)
    .limit(20);

  if (error) {
    throw new Error(`Failed to search users: ${error.message}`);
  }

  return data || [];
}

/**
 * Sends a friend request from the current user to the given recipient.
 *
 * @param {User} currentUser - The authenticated Supabase user object.
 * @param {string} recipientId - The ID of the user to send a request to.
 */
export async function sendFriendRequest(currentUser: User, recipientId: string): Promise<void> {
  if (!currentUser) throw new Error('User must be authenticated');
  if (currentUser.id === recipientId) throw new Error('Cannot add yourself as a friend');

  const { error } = await supabase
    .from('friend_requests')
    .insert([
      {
        requester_id: currentUser.id,
        recipient_id: recipientId,
        created_at: new Date().toISOString(),
      },
    ]);

  if (error) {
    throw new Error(`Failed to send friend request: ${error.message}`);
  }
}

/**
 * Accepts a friend request.
 *
 * Steps:
 *   1. Add friendship record in both directions
 *   2. Delete the friend request
 *
 * @param {User} currentUser - The authenticated Supabase user (recipient).
 * @param {string} requesterId - ID of the user who sent the request.
 */
export async function acceptFriendRequest(currentUser: User, requesterId: string): Promise<void> {
  if (!currentUser) throw new Error('User must be authenticated');

  const now = new Date().toISOString();

  // Create canonical row (user_id < friend_id)
  const [userOne, userTwo] = [currentUser.id, requesterId].sort();

  const { error: friendsError } = await supabase
    .from('friendships')
    .insert([
      {
        user_id: userOne,
        friend_id: userTwo,
        status: 'accepted',
        created_at: now,
      },
    ]);

  if (friendsError) {
    throw new Error(`Failed to create friendship: ${friendsError.message}`);
  }

  // Mark the friend request as accepted
  const { error: updateError } = await supabase
    .from('friend_requests')
    .update({ status: 'accepted' })
    .eq('requester_id', requesterId)
    .eq('recipient_id', currentUser.id);

  if (updateError) {
    throw new Error(`Failed to update friend request status: ${updateError.message}`);
  }
}

/**
 * Denies (or cancels) a friend request.
 *
 * @param {User} currentUser - The authenticated Supabase user (recipient).
 * @param {string} requesterId - ID of the user who sent the request.
 */
export async function denyFriendRequest(currentUser: User, requesterId: string): Promise<void> {
  if (!currentUser) throw new Error('User must be authenticated');

  const { error } = await supabase
    .from('friend_requests')
    .delete()
    .eq('requester_id', requesterId)
    .eq('recipient_id', currentUser.id);

  if (error) {
    throw new Error(`Failed to deny friend request: ${error.message}`);
  }
}

/**
 * Returns the list of accepted friends for the current user.
 *
 * @param {string} userId - The ID of the authenticated user.
 * @returns {Promise<PublicUser[]>}
 */
export async function getFriends(userId: string): Promise<PublicUser[]> {
  // Step 1: fetch friendship rows
  const { data: friendshipRows, error: friendshipError } = await supabase
    .from('friendships')
    .select('user_id, friend_id')
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
    .eq('status', 'accepted');

  if (friendshipError) {
    throw new Error(`Failed to get friendships: ${friendshipError.message}`);
  }

  if (!friendshipRows || friendshipRows.length === 0) return [];

  // Collect friend IDs (the other participant in each row)
  const friendIds = friendshipRows.map((row: any) =>
    row.user_id === userId ? row.friend_id : row.user_id
  );

  // Step 2: fetch profiles for those IDs
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', friendIds);

  if (profilesError) {
    throw new Error(`Failed to fetch friend profiles: ${profilesError.message}`);
  }

  return (
    profiles?.map((p: any) => ({
      id: p.id,
      username: p.username,
      avatar_url: p.avatar_url,
    })) || []
  );
}

/**
 * Returns the list of incoming friend requests.
 *
 * @param {string} userId - The authenticated user ID.
 * @returns {Promise<FriendRequest[]>}
 */
export async function getIncomingFriendRequests(userId: string): Promise<FriendRequest[]> {
  const { data: requests, error: reqError } = await supabase
    .from('friend_requests')
    .select('*')
    .eq('recipient_id', userId)
    .eq('status', 'pending');

  console.log('[Friends] Incoming friend requests raw:', requests, reqError);

  if (reqError) {
    throw new Error(`Failed to get friend requests: ${reqError.message}`);
  }

  if (!requests || requests.length === 0) return [];

  const requesterIds = requests.map((r: any) => r.requester_id);

  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', requesterIds);

  console.log('[Friends] Profiles for requesterIds:', requesterIds, profilesData, profilesError);

  if (profilesError) {
    throw new Error(`Failed to fetch requester profiles: ${profilesError.message}`);
  }

  const profileMap = new Map(profilesData?.map((p: any) => [p.id, p]));

  return requests.map((req: any) => {
    const profile = profileMap.get(req.requester_id);
    return {
      id: profile?.id ?? req.requester_id,
      username: profile?.username ?? 'unknown',
      avatar_url: profile?.avatar_url ?? null,
      created_at: req.created_at,
      requester_id: req.requester_id,
    } as FriendRequest;
  });
} 