#!/usr/bin/env node

/**
 * Test script to verify encryption/decryption works
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = process.env.HYDRO_SECRET_KEY || 'hydro-default-secret-key-32-chars!!';

function encrypt(text) {
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
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

function decrypt(encryptedData) {
  try {
    // Decode from base64
    const combined = Buffer.from(encryptedData, 'base64').toString('utf8');
    
    // Split IV and encrypted data
    const parts = combined.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    // Create a hash of the secret key to ensure it's 32 bytes
    const key = crypto.createHash('sha256').update(SECRET_KEY).digest();
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    // Decrypt the data
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

// Test the encryption/decryption
const testKey = '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';
const encryptedKey = 'NzEzZjA4ODI4NmIzMWJiMjE0YmE0ZDcyYWJjNmYxMTQ6YmMyNGI5ZTRlYzhmZjA2MWEwNjVhNGUwZDNlZGExNzkyYjBiY2I1YTFhMmUwODJkMmI0N2M4MjJkNTMyOWJkOWM1YjgzMWQ4YWU3NzcxMDU2OTU4NGViM2ViZjQzYWJhNGJiMDRiNmFjZGVlZWEwMTU1ZmI1MTJiY2VhZDkxNzkxYWZjMWQ5YWUwM2E1NDkzN2Q4MGVlNDZmYzI4MDA0MQ==';

console.log('Testing encryption/decryption...');
console.log('Original key:', testKey);
console.log('Encrypted key:', encryptedKey);

try {
  const decrypted = decrypt(encryptedKey);
  console.log('Decrypted key:', decrypted);
  console.log('✅ Encryption/Decryption test PASSED');
  console.log('Keys match:', testKey === decrypted);
} catch (error) {
  console.log('❌ Encryption/Decryption test FAILED:', error.message);
}
