import CryptoJS from 'crypto-js';
import { config } from '../config';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || config.jwt.secret;

/**
 * Encrypt sensitive data (OAuth tokens, etc.)
 */
export function encryptToken(token: string): string {
  return CryptoJS.AES.encrypt(token, ENCRYPTION_KEY).toString();
}

/**
 * Decrypt sensitive data
 */
export function decryptToken(encryptedToken: string): string {
  const decrypted = CryptoJS.AES.decrypt(encryptedToken, ENCRYPTION_KEY);
  return decrypted.toString(CryptoJS.enc.Utf8);
}

/**
 * Mask sensitive token for logging (e.g., "jira_...3d4c")
 */
export function maskToken(token: string, visibleChars: number = 4): string {
  if (token.length <= visibleChars) return '***';
  return token.substring(0, 3) + '...' + token.slice(-visibleChars);
}
