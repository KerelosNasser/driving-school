import crypto from 'crypto';

/**
 * Secure encryption utilities for sensitive data storage
 * Uses AES-256-GCM for authenticated encryption
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For GCM, this is always 16
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const ITERATIONS = 100000; // PBKDF2 iterations

/**
 * Get encryption key from environment variable
 */
function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required for token encryption');
  }
  if (key.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
  }
  return key;
}

/**
 * Derive key from password using PBKDF2
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, ITERATIONS, 32, 'sha512');
}

/**
 * Encrypt sensitive data using AES-256-GCM
 * Returns base64 encoded string containing salt, iv, tag, and encrypted data
 */
export async function encrypt(text: string): Promise<string> {
  try {
    const password = getEncryptionKey();
    
    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Derive key from password and salt
    const key = deriveKey(password, salt);
    
    // Create cipher
    const cipher = crypto.createCipher(ALGORITHM, key);
    cipher.setAAD(Buffer.from('google-oauth-token')); // Additional authenticated data
    
    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get the authentication tag
    const tag = cipher.getAuthTag();
    
    // Combine salt, iv, tag, and encrypted data
    const combined = Buffer.concat([
      salt,
      iv,
      tag,
      Buffer.from(encrypted, 'hex')
    ]);
    
    return combined.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data encrypted with the encrypt function
 */
export async function decrypt(encryptedData: string): Promise<string> {
  try {
    const password = getEncryptionKey();
    
    // Decode from base64
    const combined = Buffer.from(encryptedData, 'base64');
    
    // Extract components
    const salt = combined.subarray(0, SALT_LENGTH);
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    
    // Derive key from password and salt
    const key = deriveKey(password, salt);
    
    // Create decipher
    const decipher = crypto.createDecipher(ALGORITHM, key);
    decipher.setAuthTag(tag);
    decipher.setAAD(Buffer.from('google-oauth-token')); // Same AAD as encryption
    
    // Decrypt the data
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data - token may be corrupted or invalid');
  }
}

/**
 * Generate a secure random encryption key
 * Use this to generate the ENCRYPTION_KEY for your environment
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash sensitive data for comparison (one-way)
 * Useful for storing hashed versions of tokens for validation
 */
export function hashData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Verify if data matches a hash
 */
export function verifyHash(data: string, hash: string): boolean {
  const dataHash = hashData(data);
  return crypto.timingSafeEqual(Buffer.from(dataHash), Buffer.from(hash));
}

/**
 * Generate a secure random token for various purposes
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}