/**
 * Encryption utilities for sensitive data like API keys
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = process.env.HYDRO_SECRET_KEY || 'hydro-default-secret-key-32-chars!!';

/**
 * Encrypt sensitive data
 */
export function encrypt(text: string): string {
  try {
    // Create a hash of the secret key to ensure it's 32 bytes
    const key = crypto.createHash('sha256').update(SECRET_KEY).digest();
    
    // Generate random IV
    const iv = crypto.randomBytes(16);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Combine IV + encrypted data
    const combined = iv.toString('hex') + ':' + encrypted;
    
    return Buffer.from(combined).toString('base64');
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedData: string): string {
  try {
    // Decode from base64
    const combined = Buffer.from(encryptedData, 'base64').toString('utf8');
    
    // Split IV and encrypted data
    const parts = combined.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0]!, 'hex');
    const encrypted = parts[1]!;
    
    // Create a hash of the secret key to ensure it's 32 bytes
    const key = crypto.createHash('sha256').update(SECRET_KEY).digest();
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    // Decrypt the data
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a secure random key for encryption
 */
export function generateSecretKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a string for comparison (one-way)
 */
export function hash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}
