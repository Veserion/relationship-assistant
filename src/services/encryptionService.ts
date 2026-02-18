import crypto from 'node:crypto';
import { config } from '../config.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

export function encrypt(text: string): string {
  if (!config.encryptionKey) {
    throw new Error('ENCRYPTION_KEY is not set in .env');
  }

  const key = Buffer.from(config.encryptionKey, 'hex');
  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be a 32-byte hex string (64 characters)');
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  // Format: iv:authTag:encryptedText
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  if (!config.encryptionKey) {
    throw new Error('ENCRYPTION_KEY is not set in .env');
  }

  // If text doesn't look like encrypted (no colons), return as is for backward compatibility or migration
  if (!encryptedText.includes(':')) {
    return encryptedText;
  }

  const [ivHex, authTagHex, cipherText] = encryptedText.split(':');
  if (!ivHex || !authTagHex || !cipherText) {
    return encryptedText;
  }

  const key = Buffer.from(config.encryptionKey, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(cipherText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/** Utility to check if a string is likely encrypted */
export function isEncrypted(text: string): boolean {
  return text.includes(':') && text.split(':').length === 3;
}
