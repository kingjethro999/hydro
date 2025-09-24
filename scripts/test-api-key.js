#!/usr/bin/env node

/**
 * Test script to verify API key decryption and AI service
 */

// Import the AI config
const { getOpenRouterApiKey } = require('../dist/config/ai-config.js');

console.log('Testing API key decryption...');

try {
  const apiKey = getOpenRouterApiKey();
  console.log('✅ API key decrypted successfully');
  console.log('Key length:', apiKey.length);
  console.log('Key starts with:', apiKey.substring(0, 10) + '...');
  console.log('Key ends with:', '...' + apiKey.substring(apiKey.length - 10));
  
  // Test if it looks like a valid OpenRouter key
  if (apiKey.startsWith('sk-or-v1-')) {
    console.log('✅ Key format looks correct (starts with sk-or-v1-)');
  } else {
    console.log('⚠️  Key format might be incorrect');
  }
  
} catch (error) {
  console.log('❌ API key decryption failed:', error.message);
}
