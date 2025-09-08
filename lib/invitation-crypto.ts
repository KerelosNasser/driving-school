import crypto from 'crypto';

// Use a secret key for encryption (should be in environment variables)
const INVITATION_SECRET = process.env.INVITATION_SECRET_KEY || 'your-secret-key-change-this-in-production';
const ALGORITHM = 'aes-256-gcm';

interface InvitationData {
  userId: string;
  timestamp: number;
  version: string;
}

/**
 * Generate an encrypted invitation code
 * Format: ENCRYPTED_DATA.AUTH_TAG.IV (Base64 encoded parts)
 */
export function generateEncryptedInvitationCode(userId: string): string {
  try {
    const data: InvitationData = {
      userId,
      timestamp: Date.now(),
      version: '1.0'
    };
    
    const plaintext = JSON.stringify(data);
    const iv = crypto.randomBytes(16);
    
    // Create key from secret (must be 32 bytes for aes-256-gcm)
    const key = crypto.scryptSync(INVITATION_SECRET, 'salt', 32);
    
    // Use createCipheriv instead of deprecated createCipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    cipher.setAAD(Buffer.from('invitation-code'));
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Combine encrypted data, auth tag, and IV
    const combined = `${encrypted}.${authTag.toString('hex')}.${iv.toString('hex')}`;
    
    // Convert to base64 and make it URL-safe
    const code = Buffer.from(combined).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    // Add prefix to make it recognizable and limit length
    return `DRV${code.substring(0, 16).toUpperCase()}`;
  } catch (error) {
    console.error('Error generating invitation code:', error);
    // Fallback to simple code if encryption fails
    return `DRV${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
  }
}

/**
 * Decrypt and validate an invitation code
 */
export function decryptInvitationCode(code: string): { userId: string; isValid: boolean; error?: string } {
  try {
    if (!code.startsWith('DRV') || code.length < 10) {
      return { userId: '', isValid: false, error: 'Invalid code format' };
    }
    
    // Remove prefix and convert back from URL-safe base64
    const base64Code = code.substring(3)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    // Add padding if needed
    const padded = base64Code + '='.repeat((4 - base64Code.length % 4) % 4);
    
    try {
      const combined = Buffer.from(padded, 'base64').toString();
      const parts = combined.split('.');
      
      if (parts.length !== 3) {
        return { userId: '', isValid: false, error: 'Invalid code structure' };
      }
      
      const [encrypted, authTagHex, ivHex] = parts;
      const authTag = Buffer.from(authTagHex, 'hex');
      const iv = Buffer.from(ivHex, 'hex');
      
      // Create key from secret (must be 32 bytes for aes-256-gcm)
      const key = crypto.scryptSync(INVITATION_SECRET, 'salt', 32);
      
      // Use createDecipheriv instead of deprecated createDecipher
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);
      decipher.setAAD(Buffer.from('invitation-code'));
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      const data: InvitationData = JSON.parse(decrypted);
      
      // Validate timestamp (codes expire after 1 year)
      const ageInMs = Date.now() - data.timestamp;
      const maxAge = 365 * 24 * 60 * 60 * 1000; // 1 year
      
      if (ageInMs > maxAge) {
        return { userId: data.userId, isValid: false, error: 'Code expired' };
      }
      
      return { userId: data.userId, isValid: true };
      
    } catch (decryptError) {
      console.log(decryptError)
      return { userId: '', isValid: false, error: 'Decryption failed' };
    }
    
  } catch (error) {
    console.error('Error decrypting invitation code:', error);
    return { userId: '', isValid: false, error: 'Invalid code' };
  }
}

/**
 * Generate a simple, readable invitation code (fallback)
 */
export function generateSimpleInvitationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'DRV';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Validate invitation code format
 */
export function isValidInvitationCodeFormat(code: string): boolean {
  if (!code || typeof code !== 'string') return false;
  
  // Must start with DRV and be at least 6 characters long
  if (!code.startsWith('DRV') || code.length < 6) return false;
  
  // Check if contains only valid characters
  const validChars = /^DRV[A-Z0-9_-]+$/;
  return validChars.test(code);
}
