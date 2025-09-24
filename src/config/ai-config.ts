/**
 * AI Configuration for OpenRouter API
 */

import { decrypt } from '@/utils/encryption';

export const AI_CONFIG = {
  // OpenRouter API Configuration (encrypted)
  OPENROUTER_API_KEY: 'NzEzZjA4ODI4NmIzMWJiMjE0YmE0ZDcyYWJjNmYxMTQ6YmMyNGI5ZTRlYzhmZjA2MWEwNjVhNGUwZDNlZGExNzkyYjBiY2I1YTFhMmUwODJkMmI0N2M4MjJkNTMyOWJkOWM1YjgzMWQ4YWU3NzcxMDU2OTU4NGViM2ViZjQzYWJhNGJiMDRiNmFjZGVlZWEwMTU1ZmI1MTJiY2VhZDkxNzkxYWZjMWQ5YWUwM2E1NDkzN2Q4MGVlNDZmYzI4MDA0MQ==',
  OPENROUTER_API_URL: 'https://openrouter.ai/api/v1/chat/completions',
  
  // Default model to use
  DEFAULT_MODEL: 'deepseek/deepseek-chat-v3.1:free',
  
  // Alternative models (if needed)
  MODELS: {
    FREE: 'deepseek/deepseek-chat-v3.1:free',
    FAST: 'meta-llama/llama-3.2-3b-instruct:free',
    ADVANCED: 'anthropic/claude-3.5-sonnet:beta'
  },
  
  // Request configuration
  MAX_TOKENS: 4000,
  TEMPERATURE: 0.7,
  
  // Site information for OpenRouter rankings
  SITE_URL: 'https://hydro.dev',
  SITE_NAME: 'Hydro CLI'
};

/**
 * Get API key from environment or config (decrypted)
 */
export function getOpenRouterApiKey(): string {
  const encryptedKey = process.env.OPENROUTER_API_KEY || AI_CONFIG.OPENROUTER_API_KEY;
  
  try {
    // Try to decrypt the key
    return decrypt(encryptedKey);
  } catch (error) {
    // If decryption fails, assume it's a plain text key (for development)
    return encryptedKey;
  }
}

/**
 * Get site URL for OpenRouter
 */
export function getSiteUrl(): string {
  return process.env.HYDRO_SITE_URL || AI_CONFIG.SITE_URL;
}

/**
 * Get site name for OpenRouter
 */
export function getSiteName(): string {
  return process.env.HYDRO_SITE_NAME || AI_CONFIG.SITE_NAME;
}
