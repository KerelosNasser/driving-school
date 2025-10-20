# Security Recommendations

## Executive Summary

This document outlines critical security recommendations for the driving school calendar system. These recommendations address authentication, authorization, data protection, API security, and compliance requirements.

## 🔐 Authentication & Authorization

### Current Implementation Review

#### Strengths
- ✅ NextAuth.js integration for OAuth
- ✅ JWT token-based authentication
- ✅ Google OAuth integration
- ✅ Role-based access control (admin/user)

#### Critical Vulnerabilities & Fixes

1. **JWT Secret Security**
   ```javascript
   // CRITICAL: Ensure strong JWT secret
   // Current: May use weak or default secret
   // Fix: Generate cryptographically secure secret
   
   // Generate secure secret (minimum 32 characters)
   const crypto = require('crypto');
   const secret = crypto.randomBytes(64).toString('hex');
   
   // Environment variable
   NEXTAUTH_SECRET="your-256-bit-secret-here"
   ```

2. **Token Expiration & Rotation**
   ```javascript
   // lib/auth/token-manager.ts - ENHANCEMENT NEEDED
   export class TokenManager {
     private static readonly ACCESS_TOKEN_EXPIRY = 15 * 60 * 1000; // 15 minutes
     private static readonly REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days
     
     // Implement automatic token rotation
     async rotateRefreshToken(userId: string): Promise<TokenPair> {
       // Invalidate old refresh token
       await this.revokeToken(userId, 'refresh');
       
       // Generate new token pair
       return this.generateTokenPair(userId);
     }
   }
   ```

3. **Session Security**
   ```javascript
   // pages/api/auth/[...nextauth].ts - CRITICAL UPDATE
   export default NextAuth({
     session: {
       strategy: 'jwt',
       maxAge: 15 * 60, // 15 minutes
       updateAge: 5 * 60, // Update every 5 minutes
     },
     jwt: {
       maxAge: 15 * 60, // 15 minutes
       encode: async ({ secret, token }) => {
         // Custom JWT encoding with encryption
         return encrypt(JSON.stringify(token), secret);
       },
       decode: async ({ secret, token }) => {
         // Custom JWT decoding with decryption
         return JSON.parse(decrypt(token, secret));
       }
     },
     cookies: {
       sessionToken: {
         name: `__Secure-next-auth.session-token`,
         options: {
           httpOnly: true,
           sameSite: 'strict',
           path: '/',
           secure: true, // HTTPS only
           domain: process.env.NODE_ENV === 'production' ? '.yourdomain.com' : undefined
         }
       }
     }
   });
   ```

### Multi-Factor Authentication (MFA)

```javascript
// lib/auth/mfa.ts - NEW FILE NEEDED
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

export class MFAManager {
  static generateSecret(userEmail: string): string {
    return authenticator.generateSecret();
  }
  
  static async generateQRCode(userEmail: string, secret: string): Promise<string> {
    const service = 'Driving School';
    const otpauth = authenticator.keyuri(userEmail, service, secret);
    return QRCode.toDataURL(otpauth);
  }
  
  static verifyToken(token: string, secret: string): boolean {
    return authenticator.verify({ token, secret });
  }
}

// Database schema addition needed
/*
ALTER TABLE users ADD COLUMN mfa_secret TEXT;
ALTER TABLE users ADD COLUMN mfa_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN backup_codes TEXT[];
*/
```

## 🛡️ API Security

### Rate Limiting Implementation

```javascript
// middleware.ts - CRITICAL ENHANCEMENT
import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

// Different rate limits for different endpoints
const rateLimits = {
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 attempts per 15 minutes
    analytics: true,
  }),
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '15 m'), // 100 requests per 15 minutes
    analytics: true,
  }),
  booking: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 bookings per hour
    analytics: true,
  })
};

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';
  const pathname = request.nextUrl.pathname;
  
  // Determine rate limit based on endpoint
  let rateLimit = rateLimits.api;
  if (pathname.startsWith('/api/auth')) {
    rateLimit = rateLimits.auth;
  } else if (pathname.startsWith('/api/calendar/book')) {
    rateLimit = rateLimits.booking;
  }
  
  const { success, limit, reset, remaining } = await rateLimit.limit(ip);
  
  if (!success) {
    return new NextResponse('Rate limit exceeded', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': new Date(reset).toISOString(),
      },
    });
  }
  
  return NextResponse.next();
}
```

### Input Validation & Sanitization

```javascript
// lib/validation/schemas.ts - NEW FILE NEEDED
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Booking validation schema
export const bookingSchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  lessonType: z.enum(['standard', 'intensive', 'test_prep']),
  notes: z.string().max(500).optional().transform(val => 
    val ? DOMPurify.sanitize(val) : val
  ),
  studentName: z.string().min(2).max(100).regex(/^[a-zA-Z\s]+$/),
  studentEmail: z.string().email(),
  studentPhone: z.string().regex(/^\+?[\d\s\-\(\)]+$/)
});

// User input validation
export const userUpdateSchema = z.object({
  name: z.string().min(2).max(100).regex(/^[a-zA-Z\s]+$/),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/).optional(),
  preferences: z.object({
    notifications: z.boolean(),
    reminderTime: z.number().min(15).max(1440) // 15 minutes to 24 hours
  }).optional()
});

// SQL injection prevention
export function sanitizeQuery(query: string): string {
  // Remove dangerous SQL keywords and characters
  return query.replace(/[';--]/g, '').replace(/\b(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|EXEC|UNION|SELECT)\b/gi, '');
}
```

### API Authentication Middleware

```javascript
// lib/middleware/auth.ts - ENHANCEMENT NEEDED
import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { TokenManager } from '../auth/token-manager';

export async function authenticateAPI(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Missing authentication token' }, { status: 401 });
    }
    
    // Verify JWT token
    const decoded = verify(token, process.env.NEXTAUTH_SECRET!);
    
    // Check if token is blacklisted
    const isBlacklisted = await TokenManager.isTokenBlacklisted(token);
    if (isBlacklisted) {
      return NextResponse.json({ error: 'Token has been revoked' }, { status: 401 });
    }
    
    // Add user info to request
    request.user = decoded;
    return null; // Continue to next middleware
    
  } catch (error) {
    return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
  }
}

// Role-based authorization
export function requireRole(roles: string[]) {
  return (request: NextRequest) => {
    const userRole = request.user?.role;
    
    if (!userRole || !roles.includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    return null;
  };
}
```

## 🔒 Data Protection

### Encryption at Rest

```javascript
// lib/encryption/data-encryption.ts - NEW FILE NEEDED
import crypto from 'crypto';

export class DataEncryption {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;
  
  static encrypt(text: string, key: string): string {
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipher(this.ALGORITHM, key);
    cipher.setAAD(Buffer.from('additional-data'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }
  
  static decrypt(encryptedData: string, key: string): string {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipher(this.ALGORITHM, key);
    decipher.setAAD(Buffer.from('additional-data'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

// Usage in sensitive data storage
export class SecureUserData {
  static async storePersonalInfo(userId: string, data: any) {
    const encryptionKey = process.env.DATA_ENCRYPTION_KEY!;
    const encryptedData = DataEncryption.encrypt(JSON.stringify(data), encryptionKey);
    
    // Store encrypted data in database
    await supabase
      .from('user_personal_data')
      .upsert({ user_id: userId, encrypted_data: encryptedData });
  }
}
```

### PII Data Handling

```javascript
// lib/privacy/pii-handler.ts - NEW FILE NEEDED
export class PIIHandler {
  // Mask sensitive data for logging
  static maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    return `${local.substring(0, 2)}***@${domain}`;
  }
  
  static maskPhone(phone: string): string {
    return phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2');
  }
  
  // Data anonymization for analytics
  static anonymizeUser(userData: any): any {
    return {
      id: crypto.createHash('sha256').update(userData.id).digest('hex'),
      role: userData.role,
      createdAt: userData.createdAt,
      // Remove all PII
    };
  }
  
  // GDPR compliance - data export
  static async exportUserData(userId: string): Promise<any> {
    // Collect all user data from all tables
    const userData = await this.collectAllUserData(userId);
    
    return {
      personal_info: userData.profile,
      bookings: userData.bookings,
      calendar_connections: userData.calendar_connections,
      preferences: userData.preferences,
      exported_at: new Date().toISOString()
    };
  }
  
  // GDPR compliance - data deletion
  static async deleteUserData(userId: string): Promise<void> {
    // Anonymize instead of hard delete for audit trail
    await this.anonymizeUserData(userId);
  }
}
```

## 🌐 Network Security

### HTTPS Configuration

```javascript
// next.config.js - SECURITY HEADERS
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Force HTTPS
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // XSS Protection
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // Referrer Policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https:",
              "connect-src 'self' https://api.yourdomain.com https://accounts.google.com",
              "frame-src https://accounts.google.com"
            ].join('; ')
          },
          // Permissions Policy
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  }
};
```

### CORS Configuration

```javascript
// lib/cors/cors-config.ts - NEW FILE NEEDED
import { NextRequest, NextResponse } from 'next/server';

const allowedOrigins = [
  'https://yourdomain.com',
  'https://www.yourdomain.com',
  ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : [])
];

export function corsMiddleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  // Check if origin is allowed
  if (origin && !allowedOrigins.includes(origin)) {
    return new NextResponse('CORS policy violation', { status: 403 });
  }
  
  // Set CORS headers
  const response = NextResponse.next();
  response.headers.set('Access-Control-Allow-Origin', origin || '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');
  
  return response;
}
```

## 🔍 Logging & Monitoring

### Security Event Logging

```javascript
// lib/logging/security-logger.ts - NEW FILE NEEDED
export enum SecurityEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  DATA_ACCESS = 'data_access',
  ADMIN_ACTION = 'admin_action'
}

export interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  ip: string;
  userAgent: string;
  timestamp: Date;
  details: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class SecurityLogger {
  static async logEvent(event: SecurityEvent): Promise<void> {
    // Log to database
    await supabase.from('security_events').insert({
      type: event.type,
      user_id: event.userId,
      ip_address: event.ip,
      user_agent: event.userAgent,
      timestamp: event.timestamp,
      details: event.details,
      severity: event.severity
    });
    
    // Log to external service (e.g., Sentry, DataDog)
    if (event.severity === 'critical' || event.severity === 'high') {
      await this.alertSecurityTeam(event);
    }
  }
  
  private static async alertSecurityTeam(event: SecurityEvent): Promise<void> {
    // Send immediate alert for critical security events
    // Implementation depends on your alerting system
  }
  
  // Detect suspicious patterns
  static async detectSuspiciousActivity(userId: string, ip: string): Promise<boolean> {
    const recentEvents = await supabase
      .from('security_events')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
      .order('timestamp', { ascending: false });
    
    // Check for suspicious patterns
    const failedLogins = recentEvents.data?.filter(e => e.type === SecurityEventType.LOGIN_FAILURE).length || 0;
    const differentIPs = new Set(recentEvents.data?.map(e => e.ip_address)).size;
    
    return failedLogins > 5 || differentIPs > 3;
  }
}
```

### Audit Trail Implementation

```javascript
// lib/audit/audit-trail.ts - NEW FILE NEEDED
export interface AuditEvent {
  action: string;
  resource: string;
  resourceId: string;
  userId: string;
  timestamp: Date;
  oldValues?: any;
  newValues?: any;
  ip: string;
  userAgent: string;
}

export class AuditTrail {
  static async logAction(event: AuditEvent): Promise<void> {
    await supabase.from('audit_log').insert({
      action: event.action,
      resource: event.resource,
      resource_id: event.resourceId,
      user_id: event.userId,
      timestamp: event.timestamp,
      old_values: event.oldValues,
      new_values: event.newValues,
      ip_address: event.ip,
      user_agent: event.userAgent
    });
  }
  
  // Wrapper for database operations
  static auditWrapper<T>(
    action: string,
    resource: string,
    userId: string,
    operation: () => Promise<T>
  ): Promise<T> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await operation();
        
        await this.logAction({
          action,
          resource,
          resourceId: result?.id || 'unknown',
          userId,
          timestamp: new Date(),
          newValues: result,
          ip: 'server',
          userAgent: 'system'
        });
        
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }
}
```

## 🛠️ Vulnerability Assessment

### Common Vulnerabilities & Fixes

1. **SQL Injection Prevention**
   ```javascript
   // WRONG - Vulnerable to SQL injection
   const query = `SELECT * FROM users WHERE email = '${email}'`;
   
   // CORRECT - Use parameterized queries
   const { data } = await supabase
     .from('users')
     .select('*')
     .eq('email', email); // Automatically sanitized
   ```

2. **XSS Prevention**
   ```javascript
   // lib/sanitization/xss-prevention.ts
   import DOMPurify from 'isomorphic-dompurify';
   
   export function sanitizeHTML(input: string): string {
     return DOMPurify.sanitize(input, {
       ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
       ALLOWED_ATTR: []
     });
   }
   
   export function escapeHTML(input: string): string {
     return input
       .replace(/&/g, '&amp;')
       .replace(/</g, '&lt;')
       .replace(/>/g, '&gt;')
       .replace(/"/g, '&quot;')
       .replace(/'/g, '&#x27;');
   }
   ```

3. **CSRF Protection**
   ```javascript
   // lib/csrf/csrf-protection.ts
   import { randomBytes } from 'crypto';
   
   export class CSRFProtection {
     static generateToken(): string {
       return randomBytes(32).toString('hex');
     }
     
     static validateToken(sessionToken: string, requestToken: string): boolean {
       return sessionToken === requestToken;
     }
   }
   
   // Usage in API routes
   export default async function handler(req: NextRequest) {
     if (req.method === 'POST') {
       const csrfToken = req.headers.get('x-csrf-token');
       const sessionToken = req.cookies.get('csrf-token')?.value;
       
       if (!CSRFProtection.validateToken(sessionToken!, csrfToken!)) {
         return NextResponse.json({ error: 'CSRF token mismatch' }, { status: 403 });
       }
     }
   }
   ```

## 📋 Compliance Requirements

### GDPR Compliance

```javascript
// lib/compliance/gdpr.ts - NEW FILE NEEDED
export class GDPRCompliance {
  // Right to be informed
  static getPrivacyNotice(): string {
    return `
      We collect and process your personal data for the following purposes:
      - Booking and managing driving lessons
      - Calendar integration and scheduling
      - Communication regarding your lessons
      - Legal compliance and safety requirements
      
      Your data is stored securely and will not be shared with third parties
      without your explicit consent.
    `;
  }
  
  // Right of access
  static async exportUserData(userId: string): Promise<any> {
    return PIIHandler.exportUserData(userId);
  }
  
  // Right to rectification
  static async updateUserData(userId: string, updates: any): Promise<void> {
    // Validate and sanitize updates
    const sanitizedUpdates = this.sanitizeUserUpdates(updates);
    
    await supabase
      .from('users')
      .update(sanitizedUpdates)
      .eq('id', userId);
  }
  
  // Right to erasure
  static async deleteUserData(userId: string): Promise<void> {
    await PIIHandler.deleteUserData(userId);
  }
  
  // Right to data portability
  static async exportDataPortable(userId: string): Promise<Buffer> {
    const userData = await this.exportUserData(userId);
    return Buffer.from(JSON.stringify(userData, null, 2));
  }
  
  // Right to object
  static async optOutProcessing(userId: string, processingType: string): Promise<void> {
    await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        [`opt_out_${processingType}`]: true
      });
  }
}
```

### Data Retention Policy

```javascript
// lib/compliance/data-retention.ts - NEW FILE NEEDED
export class DataRetentionPolicy {
  private static readonly RETENTION_PERIODS = {
    user_data: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
    booking_data: 3 * 365 * 24 * 60 * 60 * 1000, // 3 years
    audit_logs: 5 * 365 * 24 * 60 * 60 * 1000, // 5 years
    security_events: 2 * 365 * 24 * 60 * 60 * 1000, // 2 years
  };
  
  static async cleanupExpiredData(): Promise<void> {
    const now = new Date();
    
    // Clean up old bookings
    const bookingCutoff = new Date(now.getTime() - this.RETENTION_PERIODS.booking_data);
    await supabase
      .from('bookings')
      .delete()
      .lt('created_at', bookingCutoff.toISOString());
    
    // Clean up old audit logs
    const auditCutoff = new Date(now.getTime() - this.RETENTION_PERIODS.audit_logs);
    await supabase
      .from('audit_log')
      .delete()
      .lt('timestamp', auditCutoff.toISOString());
    
    // Clean up old security events
    const securityCutoff = new Date(now.getTime() - this.RETENTION_PERIODS.security_events);
    await supabase
      .from('security_events')
      .delete()
      .lt('timestamp', securityCutoff.toISOString());
  }
}
```

## 🚨 Incident Response Plan

### Security Incident Classification

```javascript
// lib/incident/incident-response.ts - NEW FILE NEEDED
export enum IncidentSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface SecurityIncident {
  id: string;
  type: string;
  severity: IncidentSeverity;
  description: string;
  affectedUsers: string[];
  detectedAt: Date;
  resolvedAt?: Date;
  actions: string[];
}

export class IncidentResponse {
  static async reportIncident(incident: SecurityIncident): Promise<void> {
    // Log incident
    await supabase.from('security_incidents').insert(incident);
    
    // Immediate actions based on severity
    switch (incident.severity) {
      case IncidentSeverity.CRITICAL:
        await this.criticalIncidentResponse(incident);
        break;
      case IncidentSeverity.HIGH:
        await this.highIncidentResponse(incident);
        break;
      default:
        await this.standardIncidentResponse(incident);
    }
  }
  
  private static async criticalIncidentResponse(incident: SecurityIncident): Promise<void> {
    // 1. Immediate containment
    await this.enableEmergencyMode();
    
    // 2. Notify security team immediately
    await this.notifySecurityTeam(incident, true);
    
    // 3. Revoke all active sessions if needed
    if (incident.type === 'data_breach') {
      await this.revokeAllSessions();
    }
  }
  
  private static async enableEmergencyMode(): Promise<void> {
    // Temporarily disable non-essential features
    // Increase logging verbosity
    // Enable additional monitoring
  }
}
```

## 📊 Security Metrics & KPIs

### Security Dashboard

```javascript
// lib/metrics/security-metrics.ts - NEW FILE NEEDED
export class SecurityMetrics {
  static async getSecurityDashboard(): Promise<any> {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    return {
      authentication: {
        successfulLogins: await this.countEvents('login_success', last24Hours),
        failedLogins: await this.countEvents('login_failure', last24Hours),
        rateLimitHits: await this.countEvents('rate_limit_exceeded', last24Hours),
      },
      security: {
        suspiciousActivities: await this.countEvents('suspicious_activity', last7Days),
        unauthorizedAccess: await this.countEvents('unauthorized_access', last7Days),
        securityIncidents: await this.getActiveIncidents(),
      },
      compliance: {
        gdprRequests: await this.countGDPRRequests(last7Days),
        dataRetentionCompliance: await this.checkDataRetentionCompliance(),
      },
      performance: {
        averageResponseTime: await this.getAverageResponseTime(),
        errorRate: await this.getErrorRate(),
      }
    };
  }
  
  private static async countEvents(type: string, since: Date): Promise<number> {
    const { count } = await supabase
      .from('security_events')
      .select('*', { count: 'exact' })
      .eq('type', type)
      .gte('timestamp', since.toISOString());
    
    return count || 0;
  }
}
```

## 🔧 Implementation Priority

### Phase 1: Critical Security (Immediate - Week 1)
1. ✅ Strong JWT secrets and token rotation
2. ✅ Rate limiting implementation
3. ✅ Input validation and sanitization
4. ✅ Security headers configuration
5. ✅ HTTPS enforcement

### Phase 2: Enhanced Security (Week 2-3)
1. 🔄 Multi-factor authentication
2. 🔄 Advanced logging and monitoring
3. 🔄 Audit trail implementation
4. 🔄 Data encryption at rest
5. 🔄 CSRF protection

### Phase 3: Compliance & Monitoring (Week 4-6)
1. 📋 GDPR compliance features
2. 📋 Data retention policies
3. 📋 Security incident response
4. 📋 Security metrics dashboard
5. 📋 Penetration testing

### Phase 4: Advanced Security (Ongoing)
1. 🚀 Behavioral analysis
2. 🚀 Advanced threat detection
3. 🚀 Zero-trust architecture
4. 🚀 Security automation
5. 🚀 Continuous security monitoring

## 📝 Security Checklist

### Pre-Production Security Audit

- [ ] **Authentication & Authorization**
  - [ ] Strong JWT secrets configured
  - [ ] Token expiration and rotation implemented
  - [ ] Multi-factor authentication available
  - [ ] Role-based access control verified
  - [ ] Session security hardened

- [ ] **API Security**
  - [ ] Rate limiting configured
  - [ ] Input validation implemented
  - [ ] SQL injection prevention verified
  - [ ] XSS protection enabled
  - [ ] CSRF protection implemented

- [ ] **Data Protection**
  - [ ] Encryption at rest configured
  - [ ] PII handling procedures implemented
  - [ ] Data anonymization capabilities
  - [ ] Secure data transmission (HTTPS)
  - [ ] Database security hardened

- [ ] **Network Security**
  - [ ] Security headers configured
  - [ ] CORS properly configured
  - [ ] SSL/TLS certificates valid
  - [ ] Firewall rules configured
  - [ ] VPN access for admin functions

- [ ] **Monitoring & Logging**
  - [ ] Security event logging implemented
  - [ ] Audit trail configured
  - [ ] Real-time monitoring enabled
  - [ ] Alerting system configured
  - [ ] Log retention policies set

- [ ] **Compliance**
  - [ ] GDPR compliance features implemented
  - [ ] Data retention policies configured
  - [ ] Privacy policy updated
  - [ ] Terms of service reviewed
  - [ ] Consent mechanisms implemented

- [ ] **Incident Response**
  - [ ] Incident response plan documented
  - [ ] Security team contacts updated
  - [ ] Emergency procedures tested
  - [ ] Backup and recovery tested
  - [ ] Communication plan prepared

---

**Security is an ongoing process, not a one-time implementation. Regular security audits, updates, and monitoring are essential for maintaining a secure system.**