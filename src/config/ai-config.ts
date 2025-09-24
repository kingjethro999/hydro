/**
 * AI Configuration for OpenRouter API
 */

import { decrypt } from '@/utils/encryption';

export const AI_CONFIG = {
  // OpenRouter API Configuration (encrypted)
  OPENROUTER_API_KEY: 'Y2JmMzQxMmRiMzFiNjhiOWI2MGQ1ZGZkNWQ3ODk1YmM6YzEzNWQ5OTBmNGIwNWZhODZiYWRiNDQ3ZDFiNDY0MTc4NjQ5NTIzNmJiOTA3ODRkYjcwZjZlNmFiMDU5Nzg4YzE0MDE1M2Q4NjU4YTRhMjU1MTc1YWJlZDAzYmYwZTBjNjk0YzNjYTYwMzIyNjIyY2YzMzhhNmU4YTdmYzBlMDU1NDQ3Y2EyMGQ1NTliMzM5MTVlYjUxNGFiNjYxYTIxYQ==',
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
