/**
 * This shared utility provides a function to securely get the authenticated user's ID
 * from the Authorization header of a request.
 *
 * It validates the JWT using the project's JWT secret, ensuring that the request
 * is coming from an authenticated user.
 */
import { verify } from 'https://deno.land/x/djwt@v3.0.2/mod.ts';
import { corsHeaders } from './cors.ts';

// We need to get the JWT secret from the environment variables.
const JWT_SECRET = Deno.env.get('JWT_SECRET');

/**
 * Verifies the JWT from the Authorization header and returns the user ID.
 *
 * @param {Request} req - The incoming request object.
 * @returns {Promise<string>} The user ID if the token is valid.
 * @throws {Error} If the token is missing, invalid, or expired.
 */
export async function getUserIdFromRequest(req: Request): Promise<string | null> {
  if (!JWT_SECRET) {
    console.error('JWT_SECRET is not set in environment variables.');
    return null;
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    console.error('Missing Authorization header.');
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  try {
    // Manually create the CryptoKey for verification.
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    
    const payload = await verify(token, key);
    return payload.sub as string;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
} 