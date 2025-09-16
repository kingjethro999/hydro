import CryptoJS from 'crypto-js';

// App-specific secret key (in production, this should be more secure)
const APP_SECRET = 'cal-track-2025-secure-key-v1';

/**
 * Encrypt a string using AES encryption
 */
export function encryptString(text: string): string {
  return CryptoJS.AES.encrypt(text, APP_SECRET).toString();
}

/**
 * Decrypt an encrypted string
 */
export function decryptString(encryptedText: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedText, APP_SECRET);
  return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * Encrypt API key for secure storage
 */
export function encryptApiKey(apiKey: string): string {
  return encryptString(apiKey);
}

/**
 * Decrypt API key for use
 */
export function decryptApiKey(encryptedApiKey: string): string {
  return decryptString(encryptedApiKey);
}
