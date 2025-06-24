/**
 * Chat Service
 * ------------
 * A thin wrapper around Firebase Realtime Database providing a small API for
 * one-on-one text chat. Image / Snap messages can be added in a future
 * iteration.
 *
 * Database Shape (Realtime Database)
 * ----------------------------------
 * /conversations
 *   └─ {roomId}
 *        ├─ participants: { [uid]: true }
 *        └─ messages
 *            └─ {autoId}
 *                • senderUid: string
 *                • text: string
 *                • sentAt: number (Unix timestamp)
 *
 * The `roomId` is a **deterministic** concatenation of both user UIDs, sorted
 * lexicographically, ensuring that the same pair of users always maps to the
 * same conversation node.
 */

import { rtdb } from './firebase/config';
import {
  ref,
  push,
  onValue,
  off,
  Query,
  DataSnapshot,
} from 'firebase/database';
import type { Unsubscribe } from 'firebase/database';

/** *******************************
 * Type Definitions
 * *******************************/

export interface ChatMessage {
  id: string;
  senderUid: string;
  text: string;
  sentAt: number; // Unix epoch (ms)
}

/**
 * Generates a stable room ID for a pair of users (lexicographically sorted).
 */
export function getRoomId(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join('_');
}

/**
 * Sends a text message to the specified room.
 *
 * @param {string} roomId                 Deterministic room ID.
 * @param {string} senderUid              UID of the current (sending) user.
 * @param {string} text                   Message text payload.
 * @returns {Promise<void>}               Promise resolved when the write is complete.
 */
export async function sendMessage(roomId: string, senderUid: string, text: string): Promise<void> {
  if (!text.trim()) return;

  const messagesRef = ref(rtdb, `conversations/${roomId}/messages`);
  await push(messagesRef, {
    senderUid,
    text,
    sentAt: Date.now(),
  });
}

/**
 * Subscribes to live message updates for the given room. Internally uses
 * Firebase's `onValue` listener on the messages node.
 *
 * NOTE: This is a naive implementation that reads the **entire** message list
 * on every update. For production-grade usage, consider pagination (orderBy,
 * limitToLast) or Firestore instead.
 *
 * @param {string} roomId         Deterministic room ID.
 * @param {(messages: ChatMessage[]) => void} callback   Invoked with the
 *        ordered (by sentAt ascending) list of chat messages whenever the
 *        underlying data changes.
 * @returns {Unsubscribe}         Call the returned function to stop listening.
 */
export function subscribeToMessages(
  roomId: string,
  callback: (messages: ChatMessage[]) => void
): Unsubscribe {
  const messagesRef = ref(rtdb, `conversations/${roomId}/messages`);

  const handler = (snapshot: DataSnapshot) => {
    const val = snapshot.val() as Record<string, Omit<ChatMessage, 'id'>> | null;
    if (!val) {
      callback([]);
      return;
    }

    const parsed: ChatMessage[] = Object.entries(val).map(([id, data]) => ({
      id,
      senderUid: data.senderUid,
      text: data.text,
      sentAt: data.sentAt,
    }));

    parsed.sort((a, b) => a.sentAt - b.sentAt);
    callback(parsed);
  };

  onValue(messagesRef, handler);

  return () => off(messagesRef, 'value', handler);
} 