/**
 * Snaps Service
 * -------------
 * Handles uploading a Snap photo to Supabase Storage and creating a database
 * record that tracks where the image lives and whom it was sent to.
 *
 * Database Schema (PostgreSQL tables)
 * -----------------------------------
 * snaps table:
 *   - id (uuid, primary key)
 *   - sender_id (uuid, foreign key to users.id)
 *   - recipient_ids (uuid[], array of recipient user IDs)
 *   - storage_url (text, public URL to the media file)
 *   - media_type (text, 'image' or 'video')
 *   - created_at (timestamp)
 */

import { supabase } from './supabase/config';

/**
 * Supported media types for a Snap.
 */
export type MediaType = 'image' | 'video';

/**
 * Uploads a Snap media file to Supabase Storage and returns the public URL.
 *
 * @param {string} senderId - ID of the user sending the snap (used for path).
 * @param {string} mediaUri - The local file URI of the captured media.
 * @param {MediaType} mediaType - Type of the media file.
 * @returns {Promise<string>} The public URL of the uploaded media.
 */
async function uploadSnapMedia(
  senderId: string,
  mediaUri: string,
  mediaType: MediaType,
): Promise<string> {
  const response = await fetch(mediaUri);
  const blob = await response.blob();

  const extension = mediaType === 'video' ? 'mp4' : 'jpg';
  const filePath = `snaps/${senderId}/${Date.now()}.${extension}`;

  const { data, error } = await supabase.storage
    .from('snaps-bucket')
    .upload(filePath, blob, {
      contentType: mediaType === 'video' ? 'video/mp4' : 'image/jpeg',
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload media: ${error.message}`);
  }

  // Get the public URL
  const { data: urlData } = supabase.storage
    .from('snaps-bucket')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

/**
 * Sends a snap to the specified recipients: uploads the media and creates a
 * database record. The actual per-recipient deletion logic (after view/24h)
 * will be handled elsewhere (database triggers or client-side cleanup).
 *
 * @param {string} senderId - ID of the sending user.
 * @param {string[]} recipientIds - Array of recipient user IDs.
 * @param {string} mediaUri - Local URI of the captured media.
 * @param {MediaType} mediaType - Type of the media (default: 'image').
 */
export async function sendSnap(
  senderId: string,
  recipientIds: string[],
  mediaUri: string,
  mediaType: MediaType = 'image',
): Promise<void> {
  if (!mediaUri) throw new Error('Missing snap media');
  if (!recipientIds.length) throw new Error('Recipient list is empty');

  const storageUrl = await uploadSnapMedia(senderId, mediaUri, mediaType);

  const { error } = await supabase
    .from('snaps')
    .insert([
      {
        sender_id: senderId,
        recipient_ids: recipientIds,
        storage_url: storageUrl,
        media_type: mediaType,
        created_at: new Date().toISOString(),
      },
    ]);

  if (error) {
    throw new Error(`Failed to create snap record: ${error.message}`);
  }
}

/**
 * Gets snaps received by a specific user.
 *
 * @param {string} userId - The ID of the user to get snaps for.
 * @returns {Promise<any[]>} Array of snap records.
 */
export async function getReceivedSnaps(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('snaps')
    .select(`
      *,
      users!snaps_sender_id_fkey (
        id,
        username
      )
    `)
    .contains('recipient_ids', [userId])
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get received snaps: ${error.message}`);
  }

  return data || [];
}

/**
 * Gets snaps sent by a specific user.
 *
 * @param {string} userId - The ID of the user to get sent snaps for.
 * @returns {Promise<any[]>} Array of snap records.
 */
export async function getSentSnaps(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('snaps')
    .select('*')
    .eq('sender_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get sent snaps: ${error.message}`);
  }

  return data || [];
} 