#!/usr/bin/env node

/**
 * Simple test to verify AI service works
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = process.env.HYDRO_SECRET_KEY || 'hydro-default-secret-key-32-chars!!';

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

// Test the API key
const encryptedKey = 'NzEzZjA4ODI4NmIzMWJiMjE0YmE0ZDcyYWJjNmYxMTQ6YmMyNGI5ZTRlYzhmZjA2MWEwNjVhNGUwZDNlZGExNzkyYjBiY2I1YTFhMmUwODJkMmI0N2M4MjJkNTMyOWJkOWM1YjgzMWQ4YWU3NzcxMDU2OTU4NGViM2ViZjQzYWJhNGJiMDRiNmFjZGVlZWEwMTU1ZmI1MTJiY2VhZDkxNzkxYWZjMWQ5YWUwM2E1NDkzN2Q4MGVlNDZmYzI4MDA0MQ==';

console.log('Testing API key decryption...');
const apiKey = decrypt(encryptedKey);
console.log('✅ API key decrypted:', apiKey.substring(0, 20) + '...');

// Test a simple API call
async function testAICall() {
  try {
    console.log('\nTesting OpenRouter API call...');
    
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://hydro.dev",
        "X-Title": "Hydro CLI",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "deepseek/deepseek-chat-v3.1:free",
        "messages": [
          {
            "role": "user",
            "content": "Say 'Hello from Hydro AI!' and nothing else."
          }
        ]
      })
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (response.ok) {
      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content;
      console.log('✅ AI Response:', aiResponse);
    } else {
      const errorText = await response.text();
      console.log('❌ API Error:', errorText);
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }
}

testAICall();
