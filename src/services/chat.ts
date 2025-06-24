/**
 * Chat Service
 * ------------
 * A service for handling one-on-one text chat using Supabase's real-time features.
 * Image / Snap messages can be added in a future iteration.
 *
 * Database Schema (PostgreSQL tables)
 * -----------------------------------
 * conversations table:
 *   - id (uuid, primary key)
 *   - participant_one_id (uuid, foreign key to users.id)
 *   - participant_two_id (uuid, foreign key to users.id)
 *   - created_at (timestamp)
 *
 * messages table:
 *   - id (uuid, primary key)
 *   - conversation_id (uuid, foreign key to conversations.id)
 *   - sender_id (uuid, foreign key to users.id)
 *   - text (text)
 *   - created_at (timestamp)
 *
 * The conversation ID is deterministic based on the two participant IDs,
 * ensuring that the same pair of users always maps to the same conversation.
 */

import { supabase } from './supabase/config';
import type { RealtimeChannel } from '@supabase/supabase-js';

/** *******************************
 * Type Definitions
 * *******************************/

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  participant_one_id: string;
  participant_two_id: string;
  created_at: string;
}

/**
 * Creates or gets an existing conversation between two users.
 *
 * @param {string} userIdA - First user ID.
 * @param {string} userIdB - Second user ID.
 * @returns {Promise<string>} The conversation ID.
 */
async function getOrCreateConversation(userIdA: string, userIdB: string): Promise<string> {
  // Step 1: try to find existing conversation containing both participants
  const { data: existing, error: lookupError } = await supabase.rpc('find_conversation_between', {
    user_id_a: userIdA,
    user_id_b: userIdB,
  });

  if (lookupError) {
    console.warn('lookup conversation error (fallback to client)', lookupError);
  }

  if (existing && existing.length > 0) {
    return existing[0].id;
  }

  // If not found, create conversation row
  const { data: convoInsert, error: convoError } = await supabase
    .from('conversations')
    .insert([{ created_at: new Date().toISOString(), type: 'direct' }])
    .select('id')
    .single();

  if (convoError) {
    console.error('[Chat] Conversation insert error', convoError);
    throw new Error(`Create conversation failed: ${convoError.message}`);
  }

  const convoId = convoInsert.id;

  const { error: partErr } = await supabase
    .from('conversation_participants')
    .insert([
      { conversation_id: convoId, user_id: userIdA },
      { conversation_id: convoId, user_id: userIdB },
    ]);

  if (partErr) {
    console.error('[Chat] Participant insert error', partErr);
    throw new Error(`Add participants failed: ${partErr.message}`);
  }

  return convoId;
}

/**
 * Sends a text message to the specified conversation.
 *
 * @param {string} conversationId - The conversation ID.
 * @param {string} senderId - ID of the current (sending) user.
 * @param {string} text - Message text payload.
 * @returns {Promise<void>} Promise resolved when the message is sent.
 */
export async function sendMessage(conversationId: string, senderId: string, text: string): Promise<void> {
  if (!text.trim()) return;

  const { error } = await supabase
    .from('messages')
    .insert([
      {
        conversation_id: conversationId,
        sender_id: senderId,
        text: text.trim(),
        created_at: new Date().toISOString(),
      },
    ]);

  if (error) {
    throw new Error(`Failed to send message: ${error.message}`);
  }
}

/**
 * Sends a message between two users, creating a conversation if needed.
 *
 * @param {string} userIdA - First user ID.
 * @param {string} userIdB - Second user ID.
 * @param {string} senderId - ID of the sending user.
 * @param {string} text - Message text.
 * @returns {Promise<void>}
 */
export async function sendMessageBetweenUsers(
  userIdA: string,
  userIdB: string,
  senderId: string,
  text: string
): Promise<void> {
  const conversationId = await getOrCreateConversation(userIdA, userIdB);
  await sendMessage(conversationId, senderId, text);
}

/**
 * Gets all messages for a conversation.
 *
 * @param {string} conversationId - The conversation ID.
 * @returns {Promise<ChatMessage[]>} Array of messages ordered by creation time.
 */
export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get messages: ${error.message}`);
  }

  return data || [];
}

/**
 * Subscribes to real-time message updates for a conversation.
 * It immediately fetches the latest messages (descending order) and then
 * listens for new INSERTs in that conversation, refetching on every change.
 *
 * @param {string}   conversationId
 * @param {(msgs: ChatMessage[]) => void} callback – Receives the updated list.
 * @returns {RealtimeChannel}
 */
export function subscribeToMessages(
  conversationId: string,
  callback: (messages: ChatMessage[]) => void
): RealtimeChannel {
  // Initial fetch
  getMessages(conversationId).then(callback);

  // Subscribe to new inserts
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      () => {
        getMessages(conversationId).then(callback);
      }
    )
    .subscribe();

  return channel;
}

export async function ensureConversation(userIdA: string, userIdB: string): Promise<string> {
  return getOrCreateConversation(userIdA, userIdB);
}