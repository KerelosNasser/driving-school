# Quick Start Guide: Calendar System Implementation

## 🚀 Get Started in 30 Minutes

This guide helps you implement the most critical improvements to your driving school calendar system immediately. Follow these steps to enhance security and functionality quickly.

## ⚡ Immediate Actions (Next 30 Minutes)

### Step 1: Secure Your Environment (5 minutes)

```bash
# 1. Generate secure JWT secret
openssl rand -base64 32

# 2. Update your .env.local file
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env.local
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env.local

# 3. Add security headers to next.config.js
```

**Update `next.config.js`:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

### Step 2: Add Input Validation (10 minutes)

```bash
# Install validation library
npm install zod
```

**Create `lib/validation/booking-schema.ts`:**
```typescript
import { z } from 'zod'

export const bookingSchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  instructorId: z.string().uuid(),
  lessonType: z.enum(['standard', 'intensive', 'test_preparation']),
  notes: z.string().max(500).optional(),
})

export const validateBooking = (data: unknown) => {
  return bookingSchema.safeParse(data)
}
```

**Update your booking API (`app/api/calendar/book/route.ts`):**
```typescript
import { validateBooking } from '@/lib/validation/booking-schema'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate input
    const validation = validateBooking(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid booking data', details: validation.error.issues },
        { status: 400 }
      )
    }
    
    const bookingData = validation.data
    // Continue with existing booking logic...
    
  } catch (error) {
    console.error('Booking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Step 3: Implement Rate Limiting (15 minutes)

```bash
# Install rate limiting dependencies
npm install @upstash/ratelimit @upstash/redis
```

**Create `lib/rate-limit.ts`:**
```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Create Redis instance
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Create rate limiter
export const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
  analytics: true,
})

// Rate limit for booking endpoints
export const bookingRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 bookings per minute
  analytics: true,
})
```

**Create `middleware.ts` in your project root:**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { rateLimiter, bookingRateLimit } from './lib/rate-limit'

export async function middleware(request: NextRequest) {
  // Get client IP
  const ip = request.ip ?? '127.0.0.1'
  
  // Apply different rate limits based on path
  const isBookingEndpoint = request.nextUrl.pathname.startsWith('/api/calendar/book')
  const limiter = isBookingEndpoint ? bookingRateLimit : rateLimiter
  
  // Check rate limit
  const { success, limit, reset, remaining } = await limiter.limit(ip)
  
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': new Date(reset).toISOString(),
        }
      }
    )
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/calendar/:path*',
    '/api/auth/:path*',
  ],
}
```

## 🔧 Next Steps (Next 2 Hours)

### Step 4: Deploy Scheduling Constraints Database

**Run the SQL script:**
```sql
-- Copy and run the content from scripts/create-scheduling-constraints-table.sql
-- This creates the scheduling_constraints table with proper RLS policies
```

### Step 5: Implement Basic Caching

**Create `lib/cache.ts`:**
```typescript
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>()
  
  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    })
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }
  
  delete(key: string): void {
    this.cache.delete(key)
  }
  
  clear(): void {
    this.cache.clear()
  }
}

export const cache = new SimpleCache()
```

### Step 6: Add Error Logging

**Create `lib/logger.ts`:**
```typescript
interface LogEntry {
  level: 'info' | 'warn' | 'error'
  message: string
  timestamp: string
  context?: Record<string, any>
}

class Logger {
  private log(level: LogEntry['level'], message: string, context?: Record<string, any>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    }
    
    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.log(JSON.stringify(entry, null, 2))
    }
    
    // In production, send to your logging service
    // Example: send to Sentry, DataDog, etc.
  }
  
  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context)
  }
  
  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context)
  }
  
  error(message: string, context?: Record<string, any>) {
    this.log('error', message, context)
  }
}

export const logger = new Logger()
```

## 🎯 Priority Implementation Order

### Week 1: Critical Security
1. ✅ **JWT Secret Security** (Step 1)
2. ✅ **Input Validation** (Step 2)
3. ✅ **Rate Limiting** (Step 3)
4. **HTTPS Enforcement**
5. **Security Headers** (Step 1)

### Week 2: Core Functionality
1. **Scheduling Constraints** (Step 4)
2. **Enhanced Calendar Service**
3. **Error Handling System**
4. **Basic Caching** (Step 5)

### Week 3: Advanced Features
1. **Availability Calculator**
2. **Admin Interface**
3. **Performance Monitoring**
4. **Comprehensive Logging** (Step 6)

## 🔍 Testing Your Implementation

### Test Security Headers
```bash
# Test security headers
curl -I https://your-domain.com

# Should see:
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Test Rate Limiting
```bash
# Test rate limiting (should get 429 after 10 requests)
for i in {1..15}; do
  curl -w "%{http_code}\n" -o /dev/null -s https://your-domain.com/api/calendar/events
done
```

### Test Input Validation
```bash
# Test with invalid data (should get 400)
curl -X POST https://your-domain.com/api/calendar/book \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'
```

## 🚨 Environment Variables Checklist

Add these to your `.env.local`:

```bash
# Security
NEXTAUTH_SECRET=your-secure-secret-here
JWT_SECRET=your-jwt-secret-here

# Rate Limiting (if using Upstash)
UPSTASH_REDIS_REST_URL=your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Database
DATABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-key

# Google Calendar
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Monitoring (optional)
SENTRY_DSN=your-sentry-dsn
```

## 📊 Quick Health Check

After implementing the above steps, verify your system:

### 1. Security Check
- [ ] JWT secrets are secure (32+ characters)
- [ ] Security headers are present
- [ ] Rate limiting is working
- [ ] Input validation is active

### 2. Functionality Check
- [ ] Calendar booking still works
- [ ] Google Calendar integration works
- [ ] Admin interface is accessible
- [ ] Error handling is working

### 3. Performance Check
- [ ] Page load times < 3 seconds
- [ ] API responses < 2 seconds
- [ ] No console errors
- [ ] Caching is working

## 🆘 Troubleshooting

### Common Issues

#### Rate Limiting Not Working
```bash
# Check Redis connection
curl -X POST https://your-domain.com/api/test-redis
```

#### Validation Errors
```javascript
// Check validation schema
console.log(bookingSchema.parse(testData))
```

#### Security Headers Missing
```javascript
// Check next.config.js syntax
npm run build
```

### Getting Help

1. **Check the logs**: Look for error messages in your console/logs
2. **Verify environment variables**: Ensure all required variables are set
3. **Test in isolation**: Test each feature individually
4. **Check network**: Verify external service connections

## 📚 Next Steps

After completing this quick start:

1. **Review the full Implementation Roadmap** for comprehensive improvements
2. **Set up monitoring** using the guidelines in DEPLOYMENT_GUIDE.md
3. **Implement additional security measures** from SECURITY_RECOMMENDATIONS.md
4. **Plan your production deployment** using PRODUCTION_CHECKLIST.md

## 🎉 Success Metrics

You'll know you're successful when:

- ✅ No security vulnerabilities in basic scans
- ✅ Rate limiting prevents abuse
- ✅ Input validation catches malformed data
- ✅ System performance remains stable
- ✅ All existing functionality still works

**Congratulations! You've implemented the most critical improvements to your calendar system. Continue with the full roadmap for comprehensive enhancements.**