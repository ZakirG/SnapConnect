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
 * Uploads a Snap image located at `photoUri` to Firebase Storage and returns
 * the public download URL.
 *
 * @param {string} senderUid - UID of the user sending the snap (used for path).
 * @param {string} photoUri - The local file URI of the captured image.
 * @returns {Promise<string>} The download URL of the uploaded image.
 */
async function uploadSnapImage(senderUid: string, photoUri: string): Promise<string> {
  const response = await fetch(photoUri);
  const blob = await response.blob();

  const filePath = `snaps/${senderUid}/${Date.now()}.jpg`;
  const imageRef = storageRef(storage, filePath);
  await uploadBytes(imageRef, blob, { contentType: 'image/jpeg' });
  const downloadUrl = await getDownloadURL(imageRef);
  return downloadUrl;
}

/**
 * Sends a snap to the specified recipients: uploads the image and creates a
 * Firestore record. The actual per-recipient deletion logic (after view/24h)
 * will be handled elsewhere (Cloud Functions or client-side cleanup).
 *
 * @param {string} senderUid - UID of the sending user.
 * @param {string[]} recipientUids - Array of recipient UIDs.
 * @param {string} photoUri - Local URI of the captured photo.
 */
export async function sendSnap(
  senderUid: string,
  recipientUids: string[],
  photoUri: string
): Promise<void> {
  if (!photoUri) throw new Error('Missing snap image');
  if (!recipientUids.length) throw new Error('Recipient list is empty');

  const storageUrl = await uploadSnapImage(senderUid, photoUri);

  await addDoc(collection(db, 'snaps'), {
    senderUid,
    recipientUids,
    storageUrl,
    createdAt: Timestamp.now(),
  });
} 