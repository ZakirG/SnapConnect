/**
 * Friend Management Service
 * -------------------------
 * This module contains all Firestore interactions related to the friend
 * management system:
 *   • Searching users by username
 *   • Sending, receiving, accepting, and denying friend requests
 *   • Fetching the current user's friends list
 *
 * Firestore Data Model (proposed)
 * -------------------------------
 * users (collection)
 *   └─ {uid} (document)
 *        • username: string
 *        • createdAt: Timestamp
 *        ├─ friends (sub-collection)
 *        │   └─ {friendUid} → { createdAt: Timestamp }
 *        └─ friendRequests (sub-collection)
 *            └─ {requesterUid} → { createdAt: Timestamp }
 *
 * This structure allows efficient lookup of a user's friends and incoming
 * friend requests while avoiding complex cross-user document updates.
 */

import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  Timestamp,
  where,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase/config';
import type { User as FirebaseUser } from 'firebase/auth';

/** *******************************
 * Type Definitions
 * *******************************/

/**
 * A lightweight representation of a user stored in Firestore.
 */
export interface PublicUser {
  uid: string;
  username: string;
}

/**
 * A friend request object returned from Firestore.
 */
export interface FriendRequest extends PublicUser {
  requestedAt: Timestamp;
}

/** *******************************
 * Helper Utilities
 * *******************************/

/**
 * Returns a reference to the `users/{uid}` document.
 */
const userDocRef = (uid: string) => doc(db, 'users', uid);

/**
 * Returns a reference to the `users/{uid}/friends` sub-collection.
 */
const friendsColRef = (uid: string) => collection(userDocRef(uid), 'friends');

/**
 * Returns a reference to the `users/{uid}/friendRequests` sub-collection.
 */
const friendRequestsColRef = (uid: string) => collection(userDocRef(uid), 'friendRequests');

/** *******************************
 * Public API
 * *******************************/

/**
 * Searches for users whose `username` field **exactly** matches the provided
 * search term. For partial matching, consider using third-party search (e.g.
 * Algolia) or integrate Firestore's full-text search solution.
 *
 * @param {string} username - The unique username to search for.
 * @returns {Promise<PublicUser[]>} A list of matching users (maximum 20).
 */
export async function searchUsersByUsername(username: string): Promise<PublicUser[]> {
  if (!username) return [];

  const q = query(
    collection(db, 'users'),
    where('username', '==', username.toLowerCase().trim())
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ uid: d.id, username: d.get('username') }));
}

/**
 * Sends a friend request from the **current** user to the given `recipientUid`.
 *
 * Implementation details:
 *   • Writes a document under `users/{recipientUid}/friendRequests/{senderUid}`.
 *   • No data is written under the sender's document. If you require outgoing
 *     request tracking, extend this function accordingly.
 *
 * @param {User} currentUser - The authenticated Firebase user object.
 * @param {string} recipientUid - The UID of the user to send a request to.
 */
export async function sendFriendRequest(currentUser: FirebaseUser, recipientUid: string): Promise<void> {
  if (!currentUser) throw new Error('User must be authenticated');
  if (currentUser.uid === recipientUid) throw new Error('Cannot add yourself as a friend');

  const requestRef = doc(friendRequestsColRef(recipientUid), currentUser.uid);
  await setDoc(requestRef, { requestedAt: Timestamp.now() });
}

/**
 * Accepts a friend request.
 *
 * Steps:
 *   1. Add each user to the other's `friends` sub-collection.
 *   2. Delete the request document.
 *
 * @param {User} currentUser - The authenticated Firebase user (recipient).
 * @param {string} requesterUid - UID of the user who sent the request.
 */
export async function acceptFriendRequest(currentUser: FirebaseUser, requesterUid: string): Promise<void> {
  if (!currentUser) throw new Error('User must be authenticated');

  const batch = writeBatch(db);
  const now = Timestamp.now();

  batch.set(doc(friendsColRef(currentUser.uid), requesterUid), { createdAt: now });
  batch.set(doc(friendsColRef(requesterUid), currentUser.uid), { createdAt: now });
  batch.delete(doc(friendRequestsColRef(currentUser.uid), requesterUid));

  await batch.commit();
}

/**
 * Denies (or cancels) a friend request.
 *
 * @param {User} currentUser - The authenticated Firebase user (recipient).
 * @param {string} requesterUid - UID of the user who sent the request.
 */
export async function denyFriendRequest(currentUser: FirebaseUser, requesterUid: string): Promise<void> {
  if (!currentUser) throw new Error('User must be authenticated');

  await deleteDoc(doc(friendRequestsColRef(currentUser.uid), requesterUid));
}

/**
 * Returns the list of **accepted friends** for the current user.
 *
 * @param {string} uid - The UID of the authenticated user.
 * @returns {Promise<PublicUser[]>}
 */
export async function getFriends(uid: string): Promise<PublicUser[]> {
  const snapshot = await getDocs(friendsColRef(uid));
  return snapshot.docs.map((d) => ({ uid: d.id, username: d.id /* Placeholder, fetch as needed */ }));
}

/**
 * Returns the list of **incoming friend requests**.
 *
 * @param {string} uid - The authenticated user UID.
 * @returns {Promise<FriendRequest[]>}
 */
export async function getIncomingFriendRequests(uid: string): Promise<FriendRequest[]> {
  const snapshot = await getDocs(friendRequestsColRef(uid));
  return snapshot.docs.map((d) => ({ uid: d.id, username: d.id, requestedAt: d.get('requestedAt') }));
} 