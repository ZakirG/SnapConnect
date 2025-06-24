/**
 * Snaps Service
 * -------------
 * Handles uploading a Snap photo to Firebase Storage and creating a Firestore
 * document that tracks where the image lives and whom it was sent to.
 */

import { storage, db } from './firebase/config';
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import {
  collection,
  addDoc,
  Timestamp,
} from 'firebase/firestore';

/**
 * Supported media types for a Snap.
 */
export type MediaType = 'image' | 'video';

/**
 * Uploads a Snap image located at `photoUri` to Firebase Storage and returns
 * the public download URL.
 *
 * @param {string} senderUid - UID of the user sending the snap (used for path).
 * @param {string} photoUri - The local file URI of the captured image.
 * @returns {Promise<string>} The download URL of the uploaded image.
 */
async function uploadSnapMedia(
  senderUid: string,
  mediaUri: string,
  mediaType: MediaType,
): Promise<string> {
  const response = await fetch(mediaUri);
  const blob = await response.blob();

  const extension = mediaType === 'video' ? 'mp4' : 'jpg';
  const contentType = mediaType === 'video' ? 'video/mp4' : 'image/jpeg';

  const filePath = `snaps/${senderUid}/${Date.now()}.${extension}`;
  const fileRef = storageRef(storage, filePath);
  await uploadBytes(fileRef, blob, { contentType });
  const downloadUrl = await getDownloadURL(fileRef);
  return downloadUrl;
}

/**
 * Sends a snap to the specified recipients: uploads the image and creates a
 * Firestore record. The actual per-recipient deletion logic (after view/24h)
 * will be handled elsewhere (Cloud Functions or client-side cleanup).
 *
 * @param {string} senderUid - UID of the sending user.
 * @param {string[]} recipientUids - Array of recipient UIDs.
 * @param {string} mediaUri - Local URI of the captured media.
 * @param {MediaType} mediaType - Type of the media (default: 'image').
 */
export async function sendSnap(
  senderUid: string,
  recipientUids: string[],
  mediaUri: string,
  mediaType: MediaType = 'image',
): Promise<void> {
  if (!mediaUri) throw new Error('Missing snap media');
  if (!recipientUids.length) throw new Error('Recipient list is empty');

  const storageUrl = await uploadSnapMedia(senderUid, mediaUri, mediaType);

  await addDoc(collection(db, 'snaps'), {
    senderUid,
    recipientUids,
    storageUrl,
    mediaType,
    createdAt: Timestamp.now(),
  });
} 