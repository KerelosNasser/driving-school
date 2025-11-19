
const COUNTRY_PATTERNS = {
  AU: {
    pattern: /^(\+61[2-9]\d{8}|\+614\d{8}|0[2-9]\d{8}|04\d{8})$/,
    format: (num: string) => {
      const clean = num.replace(/\D/g, '');
      if (clean.startsWith('61')) {
        // Handle mobile numbers (+614...)
        if (clean.startsWith('614')) {
          return `+61 ${clean.slice(2, 5)} ${clean.slice(5, 8)} ${clean.slice(8)}`;
        }
        // Handle landline numbers (+61[2-9]...)
        return `+61 ${clean.slice(2, 3)} ${clean.slice(3, 7)} ${clean.slice(7)}`;
      }
      if (clean.startsWith('0')) {
        // Handle mobile numbers (04...)
        if (clean.startsWith('04')) {
          return `${clean.slice(0, 4)} ${clean.slice(4, 7)} ${clean.slice(7)}`;
        }
        // Handle landline numbers (0[2-9]...)
        return `${clean.slice(0, 2)} ${clean.slice(2, 6)} ${clean.slice(6)}`;
      }
      return num;
    },
    normalize: (num: string) => {
      const clean = num.replace(/\D/g, '');
      if (clean.startsWith('0')) {
        return `+61${clean.slice(1)}`;
      }
      if (clean.startsWith('61')) {
        return `+${clean}`;
      }
      return `+61${clean}`;
    }
  },
  US: {
    pattern: /^(\+1)?[2-9]\d{2}[2-9]\d{2}\d{4}$/,
    format: (num: string) => {
      const clean = num.replace(/\D/g, '');
      if (clean.length === 11 && clean.startsWith('1')) {
        return `+1 (${clean.slice(1, 4)}) ${clean.slice(4, 7)}-${clean.slice(7)}`;
      }
      if (clean.length === 10) {
        return `(${clean.slice(0, 3)}) ${clean.slice(3, 6)}-${clean.slice(6)}`;
      }
      return num;
    },
    normalize: (num: string) => {
      const clean = num.replace(/\D/g, '');
      if (clean.length === 10) {
        return `+1${clean}`;
      }
      if (clean.startsWith('1')) {
        return `+${clean}`;
      }
      return `+1${clean}`;
    }
  },
  GB: {
    pattern: /^(\+44|0)[1-9]\d{8,9}$/,
    format: (num: string) => {
      const clean = num.replace(/\D/g, '');
      if (clean.startsWith('44')) {
        return `+44 ${clean.slice(2, 4)} ${clean.slice(4, 8)} ${clean.slice(8)}`;
      }
      if (clean.startsWith('0')) {
        return `${clean.slice(0, 2)} ${clean.slice(2, 6)} ${clean.slice(6)}`;
      }
      return num;
    },
    normalize: (num: string) => {
      const clean = num.replace(/\D/g, '');
      if (clean.startsWith('0')) {
        return `+44${clean.slice(1)}`;
      }
      if (clean.startsWith('44')) {
        return `+${clean}`;
      }
      return `+44${clean}`;
    }
  }
};

// Default country (Australia for this driving school)
const DEFAULT_COUNTRY = 'AU';

/**
 * Phone number validation result
 */
export interface PhoneValidationResult {
  isValid: boolean;
  formatted: string;
  normalized: string;
  country: string;
  error?: string;
}

/**
 * Phone number formatting options
 */
export interface PhoneFormatOptions {
  country?: keyof typeof COUNTRY_PATTERNS;
  international?: boolean;
  displayFormat?: 'national' | 'international' | 'e164';
}

/**
 * Normalize phone number to E.164 format
 * @param phoneNumber - Raw phone number input
 * @param country - Country code (default: AU)
 * @returns Normalized phone number in E.164 format
 */
export function normalizePhoneNumber(
  phoneNumber: string,
  country: keyof typeof COUNTRY_PATTERNS = DEFAULT_COUNTRY
): string {
  if (!phoneNumber) return '';
  
  const countryConfig = COUNTRY_PATTERNS[country];
  if (!countryConfig) return phoneNumber;
  
  try {
    return countryConfig.normalize(phoneNumber.trim());
  } catch {
    return phoneNumber;
  }
}

/**
 * Format phone number for display
 * @param phoneNumber - Phone number to format
 * @param options - Formatting options
 * @returns Formatted phone number
 */
export function formatPhoneNumber(
  phoneNumber: string,
  options: PhoneFormatOptions = {}
): string {
  if (!phoneNumber) return '';
  
  const { country = DEFAULT_COUNTRY, displayFormat = 'national' } = options;
  const countryConfig = COUNTRY_PATTERNS[country];
  
  if (!countryConfig) return phoneNumber;
  
  const normalized = normalizePhoneNumber(phoneNumber, country);
  
  switch (displayFormat) {
    case 'e164':
      return normalized;
    case 'international':
      return countryConfig.format(normalized);
    case 'national':
    default:
      return countryConfig.format(phoneNumber);
  }
}

/**
 * Validate phone number with comprehensive checks
 * @param phoneNumber - Phone number to validate
 * @param country - Country code (default: AU)
 * @returns Validation result with formatting and normalization
 */
export function validatePhoneNumber(
  phoneNumber: string,
  country: keyof typeof COUNTRY_PATTERNS = DEFAULT_COUNTRY
): PhoneValidationResult {
  const result: PhoneValidationResult = {
    isValid: false,
    formatted: phoneNumber,
    normalized: phoneNumber,
    country
  };
  
  // Basic checks
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    result.error = 'Phone number is required';
    return result;
  }
  
  const trimmed = phoneNumber.trim();
  if (trimmed.length === 0) {
    result.error = 'Phone number cannot be empty';
    return result;
  }
  
  // Test phone bypass for development/testing
  if (isTestPhoneBypassEnabled(true) && isBypassPhoneNumber(trimmed, country)) {
    result.isValid = true;
    result.formatted = formatPhoneNumber(trimmed, { country });
    result.normalized = normalizePhoneNumber(trimmed, country);
    return result;
  }
  
  // Enhanced security checks - prevent injection attacks and malicious input
  const config = getSecurityConfig();
  
  if (!config.allowedCharacters.test(trimmed)) {
    result.error = 'Phone number contains invalid characters';
    return result;
  }
  
  // Check for suspicious patterns (repeated characters, etc.)
  if (config.suspiciousPatternDetection && /(.)\1{9,}/.test(trimmed.replace(/\D/g, ''))) {
    result.error = 'Phone number format appears invalid';
    return result;
  }
  
  // Prevent excessively long input (DoS protection)
  if (trimmed.length > config.maxPhoneLength) {
    result.error = 'Phone number is too long';
    return result;
  }
  
  const countryConfig = COUNTRY_PATTERNS[country];
  if (!countryConfig) {
    result.error = `Unsupported country: ${country}`;
    return result;
  }
  
  // Clean and validate against pattern
  const cleanNumber = trimmed.replace(/\D/g, '');
  
  // Length checks
  if (cleanNumber.length < 7) {
    result.error = 'Phone number is too short';
    return result;
  }
  
  if (cleanNumber.length > 15) {
    result.error = 'Phone number is too long';
    return result;
  }
  
  // Pattern validation
  if (!countryConfig.pattern.test(trimmed)) {
    result.error = `Invalid ${country} phone number format`;
    return result;
  }
  
  // Success - format and normalize
  try {
    result.formatted = countryConfig.format(trimmed);
    result.normalized = countryConfig.normalize(trimmed);
    result.isValid = true;
    delete result.error;
  } catch (error) {
    result.error = 'Failed to format phone number'+error;
  }
  
  return result;
}

/**
 * Sanitize phone number input (remove dangerous characters)
 * @param phoneNumber - Raw phone number input
 * @returns Sanitized phone number
 */
export function sanitizePhoneNumber(phoneNumber: string): string {
  if (!phoneNumber || typeof phoneNumber !== 'string') return '';
  
  // Remove all non-phone characters except allowed ones
  return phoneNumber
    .trim()
    .replace(/[^\d\s\-\+\(\)\.]/g, '')
    .slice(0, 20); // Limit length for security
}

/**
 * Check if phone number is mobile (Australian context)
 * @param phoneNumber - Phone number to check
 * @returns True if mobile number
 */
export function isMobileNumber(phoneNumber: string): boolean {
  const normalized = normalizePhoneNumber(phoneNumber);
  const cleanNumber = normalized.replace(/\D/g, '');
  
  // Australian mobile numbers start with 04 (or +614)
  if (cleanNumber.startsWith('614')) {
    return true;
  }
  
  const withoutCountry = cleanNumber.startsWith('61') ? cleanNumber.slice(2) : cleanNumber;
  return withoutCountry.startsWith('04') || withoutCountry.startsWith('4');
}

/**
 * Get phone number type (mobile, landline, etc.)
 * @param phoneNumber - Phone number to analyze
 * @returns Phone number type
 */
export function getPhoneNumberType(phoneNumber: string): 'mobile' | 'landline' | 'unknown' {
  if (isMobileNumber(phoneNumber)) {
    return 'mobile';
  }
  
  const validation = validatePhoneNumber(phoneNumber);
  if (validation.isValid) {
    return 'landline';
  }
  
  return 'unknown';
}

/**
 * Format phone number for database storage (E.164)
 * @param phoneNumber - Phone number to store
 * @param country - Country code
 * @returns E.164 formatted phone number or null if invalid
 */
export function formatForStorage(
  phoneNumber: string,
  country: keyof typeof COUNTRY_PATTERNS = DEFAULT_COUNTRY
): string {
  if (isTestPhoneBypassEnabled(true) && isBypassPhoneNumber(phoneNumber)) {
    return normalizePhoneNumber(phoneNumber, country);
  }
  const validation = validatePhoneNumber(phoneNumber, country);
  if (!validation.isValid) {
    throw new Error(validation.error || 'Invalid phone number for storage');
  }
  return validation.formatted;
}

/**
 * Format phone number for display in UI
 * @param phoneNumber - Phone number to display
 * @param options - Display options
 * @returns User-friendly formatted phone number
 */
export function formatForDisplay(
  phoneNumber: string,
  options: PhoneFormatOptions = {}
): string {
  if (!phoneNumber) return 'Not provided';
  
  const formatted = formatPhoneNumber(phoneNumber, {
    ...options,
    displayFormat: options.displayFormat || 'national'
  });
  
  return formatted || phoneNumber;
}

/**
 * Create a phone number input mask for forms
 * @param country - Country code
 * @returns Input mask pattern
 */
export function getPhoneInputMask(country: keyof typeof COUNTRY_PATTERNS = DEFAULT_COUNTRY): string {
  switch (country) {
    case 'AU':
      return '(99) 9999 9999';
    case 'US':
      return '(999) 999-9999';
    case 'GB':
      return '99 9999 9999';
    default:
      return '999 999 9999';
  }
}

/**
 * Real-time phone number formatting for input fields
 * @param value - Current input value
 * @param country - Country code
 * @returns Formatted value for input field
 */
export function formatPhoneInput(
  value: string,
  country: keyof typeof COUNTRY_PATTERNS = DEFAULT_COUNTRY
): string {
  const sanitized = sanitizePhoneNumber(value);
  if (!sanitized) return '';
  
  const countryConfig = COUNTRY_PATTERNS[country];
  if (!countryConfig) return sanitized;
  
  try {
    return countryConfig.format(sanitized);
  } catch {
    return sanitized;
  }
}

// Security and Privacy Functions (2025 Standards)
import { getSecurityConfig } from './phone-security.config';

/**
 * Rate limiting for phone validation (in-memory cache)
 * In production, use Redis or similar distributed cache
 */
const validationCache = new Map<string, { count: number; lastReset: number }>();
const securityConfig = getSecurityConfig();

/**
 * Check if phone validation is rate limited
 * @param identifier - IP address or user ID
 * @returns True if rate limited
 */
export function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const entry = validationCache.get(identifier);
  
  if (!entry || now - entry.lastReset > securityConfig.rateLimitWindow) {
    validationCache.set(identifier, { count: 1, lastReset: now });
    return false;
  }
  
  if (entry.count >= securityConfig.maxValidationsPerWindow) {
    return true;
  }
  
  entry.count++;
  return false;
}

export function hashPhoneNumber(phoneNumber: string, salt?: string): string {
  if (!phoneNumber) return '';
  
  const normalized = normalizePhoneNumber(phoneNumber);
  const saltValue = salt || 'default-salt-change-in-production';
  
  // Simple hash for demo - use bcrypt or similar in production
  let hash = 0;
  const input = normalized + saltValue;
  
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Mask phone number for display (GDPR compliance)
 * @param phoneNumber - Phone number to mask
 * @param visibleDigits - Number of digits to show at end
 * @returns Masked phone number
 */
export function maskPhoneNumber(phoneNumber: string, visibleDigits: number = 4): string {
  if (!phoneNumber) return 'Not provided';
  
  const formatted = formatPhoneNumber(phoneNumber);
  const digits = formatted.replace(/\D/g, '');
  
  if (digits.length <= visibleDigits) {
    return '*'.repeat(digits.length);
  }
  return formatted.replace(/\d/g, (digit, index) => {
    const digitIndex = formatted.slice(0, index).replace(/\D/g, '').length;
    return digitIndex < digits.length - visibleDigits ? '*' : digit;
  });
}

export const TEST_BYPASS_NUMBERS_E164 = ['+61491570006', '+61491570156', '+61491570159'];

/**
 * Returns true if OTP bypass is enabled for development/test builds.
 * Client-side uses NEXT_PUBLIC_ENABLE_PHONE_TEST_BYPASS, server can use ENABLE_PHONE_TEST_BYPASS.
 */
export function isTestPhoneBypassEnabled(isServer: boolean = typeof window === 'undefined'): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  const bypassEnabled = isServer
    ? process.env.ENABLE_PHONE_TEST_BYPASS === 'true' || process.env.NEXT_PUBLIC_ENABLE_PHONE_TEST_BYPASS === 'true'
    : process.env.NEXT_PUBLIC_ENABLE_PHONE_TEST_BYPASS === 'true';
  console.log(`isTestPhoneBypassEnabled (isServer: ${isServer}): ${bypassEnabled}`);
  return bypassEnabled;
}

/**
 * Check if a phone number matches the allowed test numbers (normalized to E.164)
 */
export function isBypassPhoneNumber(
  phoneNumber: string,
  country: keyof typeof COUNTRY_PATTERNS = DEFAULT_COUNTRY
): boolean {
  if (!phoneNumber) return false;
  try {
    const normalized = normalizePhoneNumber(phoneNumber, country);
    return TEST_BYPASS_NUMBERS_E164.includes(normalized);
  } catch (e) {
    console.error(`isBypassPhoneNumber error: ${e}`);
    return false;
  }
}

/**
 * Validate phone number with rate limiting
 * @param phoneNumber - Phone number to validate
 * @param identifier - Rate limiting identifier (IP/user ID)
 * @param country - Country code
 * @returns Validation result or rate limit error
 */
export function validatePhoneNumberSecure(
  phoneNumber: string,
  identifier: string,
  country: keyof typeof COUNTRY_PATTERNS = DEFAULT_COUNTRY
): PhoneValidationResult {
  // Check rate limiting first
  if (isRateLimited(identifier)) {
    return {
      isValid: false,
      formatted: phoneNumber,
      normalized: phoneNumber,
      country,
      error: 'Too many validation requests. Please try again later.'
    };
  }
  
  return validatePhoneNumber(phoneNumber, country);
}

/**
 * Security audit log entry for phone number operations
 */
export interface PhoneSecurityLog {
  timestamp: Date;
  operation: 'validate' | 'format' | 'normalize' | 'mask';
  identifier: string;
  success: boolean;
  error?: string;
}

/**
 * Log phone number operations for security auditing
 * @param log - Security log entry
 */
export function logPhoneOperation(log: PhoneSecurityLog): void {
  const config = getSecurityConfig();
  
  if (!config.auditLoggingEnabled) {
    return;
  }
  
  const auditEntry = {
    ...log,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    userAgent: typeof window !== 'undefined' ? window.navigator?.userAgent : 'server',
    sessionId: generateSessionId()
  };
  
  // In production, send to secure logging service (e.g., AWS CloudTrail, Azure Monitor)
  if (process.env.NODE_ENV === 'production') {
    // TODO: Implement secure logging service integration
    // Example: await secureLogger.audit(auditEntry);
    console.log('[Phone Security Audit]', auditEntry);
  } else {
    console.log('[Phone Security]', auditEntry);
  }
}

/**
 * Generate a session ID for audit logging
 */
function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Export default validation function for backward compatibility
 */
export default validatePhoneNumber;