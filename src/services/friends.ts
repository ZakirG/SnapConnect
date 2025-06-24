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
    .from('users')
    .select('id, username, email')
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

  // Start a transaction
  const { error: friendsError } = await supabase
    .from('friends')
    .insert([
      {
        user_id: currentUser.id,
        friend_id: requesterId,
        created_at: now,
      },
      {
        user_id: requesterId,
        friend_id: currentUser.id,
        created_at: now,
      },
    ]);

  if (friendsError) {
    throw new Error(`Failed to create friendship: ${friendsError.message}`);
  }

  // Delete the friend request
  const { error: deleteError } = await supabase
    .from('friend_requests')
    .delete()
    .eq('requester_id', requesterId)
    .eq('recipient_id', currentUser.id);

  if (deleteError) {
    throw new Error(`Failed to delete friend request: ${deleteError.message}`);
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
  const { data, error } = await supabase
    .from('friends')
    .select(`
      friend_id,
      users!friends_friend_id_fkey (
        id,
        username,
        email
      )
    `)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to get friends: ${error.message}`);
  }

  return data?.map((item: any) => ({
    id: item.users.id,
    username: item.users.username,
    email: item.users.email,
  })) || [];
}

/**
 * Returns the list of incoming friend requests.
 *
 * @param {string} userId - The authenticated user ID.
 * @returns {Promise<FriendRequest[]>}
 */
export async function getIncomingFriendRequests(userId: string): Promise<FriendRequest[]> {
  const { data, error } = await supabase
    .from('friend_requests')
    .select(`
      *,
      users!friend_requests_requester_id_fkey (
        id,
        username,
        email
      )
    `)
    .eq('recipient_id', userId);

  if (error) {
    throw new Error(`Failed to get friend requests: ${error.message}`);
  }

  return data?.map((item: any) => ({
    id: item.users.id,
    username: item.users.username,
    email: item.users.email,
    created_at: item.created_at,
    requester_id: item.requester_id,
  })) || [];
} 