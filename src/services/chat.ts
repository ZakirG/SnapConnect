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
 * Generates a stable conversation ID for a pair of users (lexicographically sorted).
 */
export function getConversationId(userIdA: string, userIdB: string): string {
  return [userIdA, userIdB].sort().join('_');
}

/**
 * Creates or gets an existing conversation between two users.
 *
 * @param {string} userIdA - First user ID.
 * @param {string} userIdB - Second user ID.
 * @returns {Promise<string>} The conversation ID.
 */
async function getOrCreateConversation(userIdA: string, userIdB: string): Promise<string> {
  const conversationId = getConversationId(userIdA, userIdB);
  
  // Check if conversation already exists
  const { data: existingConversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', conversationId)
    .single();

  if (existingConversation) {
    return conversationId;
  }

  // Create new conversation
  const { error } = await supabase
    .from('conversations')
    .insert([
      {
        id: conversationId,
        participant_one_id: userIdA < userIdB ? userIdA : userIdB,
        participant_two_id: userIdA < userIdB ? userIdB : userIdA,
        created_at: new Date().toISOString(),
      },
    ]);

  if (error) {
    throw new Error(`Failed to create conversation: ${error.message}`);
  }

  return conversationId;
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
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to get messages: ${error.message}`);
  }

  return data || [];
}

/**
 * Subscribes to real-time message updates for the given conversation.
 *
 * @param {string} conversationId - The conversation ID.
 * @param {(messages: ChatMessage[]) => void} callback - Invoked with the
 *        updated list of messages whenever new messages are added.
 * @returns {RealtimeChannel} The subscription channel. Call `.unsubscribe()` to stop listening.
 */
export function subscribeToMessages(
  conversationId: string,
  callback: (messages: ChatMessage[]) => void
): RealtimeChannel {
  // Get initial messages
  getMessages(conversationId).then(callback);

  // Subscribe to new messages
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
        // Refetch all messages when a new one is added
        getMessages(conversationId).then(callback);
      }
    )
    .subscribe();

  return channel;
} 