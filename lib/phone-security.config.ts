/**
 * Phone Number Security Configuration - 2025 Standards
 * Environment-based security settings and best practices
 */

export interface PhoneSecurityConfig {
  // Rate limiting settings
  rateLimitWindow: number;
  maxValidationsPerWindow: number;
  
  // Hashing and encryption
  saltRounds: number;
  hashAlgorithm: string;
  
  // Privacy and compliance
  maskingEnabled: boolean;
  auditLoggingEnabled: boolean;
  gdprCompliant: boolean;
  
  // Input validation
  maxPhoneLength: number;
  allowedCharacters: RegExp;
  suspiciousPatternDetection: boolean;
  
  // Storage security
  encryptAtRest: boolean;
  encryptInTransit: boolean;
  
  // Monitoring and alerts
  anomalyDetection: boolean;
  securityAlertsEnabled: boolean;
}

/**
 * Default security configuration
 */
export const DEFAULT_SECURITY_CONFIG: PhoneSecurityConfig = {
  // Rate limiting (production values)
  rateLimitWindow: 60000, // 1 minute
  maxValidationsPerWindow: 10,
  
  // Hashing (use bcrypt in production)
  saltRounds: 12,
  hashAlgorithm: 'bcrypt',
  
  // Privacy compliance
  maskingEnabled: true,
  auditLoggingEnabled: true,
  gdprCompliant: true,
  
  // Input validation
  maxPhoneLength: 25,
  allowedCharacters: /^[\d\s\-\+\(\)\.]+$/,
  suspiciousPatternDetection: true,
  
  // Storage security
  encryptAtRest: true,
  encryptInTransit: true,
  
  // Monitoring
  anomalyDetection: true,
  securityAlertsEnabled: true
};

/**
 * Development configuration (less strict for testing)
 */
export const DEV_SECURITY_CONFIG: PhoneSecurityConfig = {
  ...DEFAULT_SECURITY_CONFIG,
  rateLimitWindow: 30000, // 30 seconds
  maxValidationsPerWindow: 20,
  saltRounds: 4, // Faster for development
  auditLoggingEnabled: false,
  securityAlertsEnabled: false
};

/**
 * Get security configuration based on environment
 */
export function getSecurityConfig(): PhoneSecurityConfig {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return {
        ...DEFAULT_SECURITY_CONFIG,
        // Override with environment variables if available
        rateLimitWindow: parseInt(process.env.PHONE_RATE_LIMIT_WINDOW || '60000'),
        maxValidationsPerWindow: parseInt(process.env.PHONE_MAX_VALIDATIONS || '10'),
        saltRounds: parseInt(process.env.PHONE_SALT_ROUNDS || '12'),
        maskingEnabled: process.env.PHONE_MASKING_ENABLED !== 'false',
        auditLoggingEnabled: process.env.PHONE_AUDIT_LOGGING !== 'false'
      };
    
    case 'test':
      return {
        ...DEV_SECURITY_CONFIG,
        rateLimitWindow: 10000, // 10 seconds for faster tests
        maxValidationsPerWindow: 50,
        auditLoggingEnabled: false
      };
    
    default: // development
      return DEV_SECURITY_CONFIG;
  }
}

/**
 * Security best practices documentation
 */
export const SECURITY_BEST_PRACTICES = {
  storage: [
    'Always hash phone numbers before storing in database',
    'Use environment-specific salt values',
    'Encrypt sensitive data at rest and in transit',
    'Implement proper access controls and audit trails'
  ],
  
  validation: [
    'Implement rate limiting to prevent abuse',
    'Sanitize all input to prevent injection attacks',
    'Use allowlists for permitted characters',
    'Detect and block suspicious patterns'
  ],
  
  privacy: [
    'Mask phone numbers in logs and UI displays',
    'Implement GDPR-compliant data handling',
    'Provide data deletion capabilities',
    'Log all access and modifications for audit'
  ],
  
  monitoring: [
    'Monitor for unusual validation patterns',
    'Set up alerts for security violations',
    'Regular security audits and penetration testing',
    'Keep security libraries and dependencies updated'
  ]
};

/**
 * Validate security configuration
 */
export function validateSecurityConfig(config: PhoneSecurityConfig): string[] {
  const errors: string[] = [];
  
  if (config.rateLimitWindow < 1000) {
    errors.push('Rate limit window too short (minimum 1 second)');
  }
  
  if (config.maxValidationsPerWindow < 1) {
    errors.push('Max validations per window must be at least 1');
  }
  
  if (config.saltRounds < 4) {
    errors.push('Salt rounds too low (minimum 4 for security)');
  }
  
  if (config.maxPhoneLength > 50) {
    errors.push('Max phone length too high (security risk)');
  }
  
  return errors;
}