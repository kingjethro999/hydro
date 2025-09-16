import { decryptString, encryptString } from './encryption';

// All sensitive data should be encrypted here
export const SECURE_CONFIG = {
  // Encrypted OpenRouter AI API Key
  OPENROUTER_API_KEY: "U2FsdGVkX1918fHsPs6Cdhd+k6DYRMbB7wgbDJg0TIZABd5vCzpu9/iK8ZuVt7cZzrEzwN49wplesiy+VCtw/kjiX2U1sRGYZCHaRLSaLSfs0Vv7wHqXOnMTNwpm8JkI",
  
  // Add other encrypted secrets here as needed
  // ANOTHER_SECRET: encryptString("your-secret-here"),
};

/**
 * Get decrypted API key
 */
export function getOpenRouterApiKey(): string {
  return decryptString(SECURE_CONFIG.OPENROUTER_API_KEY);
}

/**
 * Utility to encrypt new secrets (for development)
 */
export function encryptSecret(secret: string): string {
  return encryptString(secret);
}
