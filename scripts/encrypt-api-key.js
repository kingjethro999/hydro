#!/usr/bin/env node

/**
 * Script to encrypt the OpenRouter API key
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

// The API key to encrypt - REPLACE WITH YOUR ACTUAL API KEY
const API_KEY = 'your-actual-openrouter-api-key-here';

console.log('Encrypting API key...');
const encryptedKey = encrypt(API_KEY);
console.log('\n✅ Encrypted API Key:');
console.log(encryptedKey);
console.log('\n📝 Add this to your environment variables or config file as:');
console.log(`OPENROUTER_API_KEY="${encryptedKey}"`);
console.log('\n🔐 The key is encrypted and safe to store in your repository.');
