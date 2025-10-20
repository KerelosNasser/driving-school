# Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the driving school calendar system to production. Follow these steps carefully to ensure a smooth deployment.

## Prerequisites

### Required Accounts & Services
- [ ] Vercel account (recommended) or alternative hosting platform
- [ ] Supabase account for database
- [ ] Google Cloud Console project for Calendar API
- [ ] Redis Cloud account (for caching)
- [ ] Domain name and DNS access

### Required Tools
- [ ] Node.js 18+ installed
- [ ] Git installed
- [ ] Vercel CLI installed (`npm i -g vercel`)
- [ ] Supabase CLI installed

## Step 1: Environment Setup

### 1.1 Create Production Environment File

Create `.env.production` file:

```bash
# Database
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
DIRECT_URL="postgresql://username:password@host:port/database?sslmode=require"

# Authentication
NEXTAUTH_SECRET="your-super-secure-random-string-min-32-chars"
NEXTAUTH_URL="https://yourdomain.com"

# Google Calendar API
GOOGLE_CLIENT_ID="your-production-google-client-id"
GOOGLE_CLIENT_SECRET="your-production-google-client-secret"

# Redis Cache
REDIS_URL="redis://username:password@host:port"

# Application Settings
NODE_ENV="production"
APP_URL="https://yourdomain.com"

# Monitoring (Optional)
SENTRY_DSN="your-sentry-dsn"
ANALYTICS_ID="your-analytics-id"
```

### 1.2 Secure Environment Variables

**Never commit production secrets to version control!**

```bash
# Add to .gitignore
echo ".env.production" >> .gitignore
echo ".env.local" >> .gitignore
```

## Step 2: Database Setup

### 2.1 Create Production Database

#### Using Supabase (Recommended)

1. **Create New Project**
   ```bash
   # Login to Supabase
   supabase login
   
   # Create new project
   supabase projects create driving-school-prod
   ```

2. **Get Database URL**
   - Go to Supabase Dashboard → Settings → Database
   - Copy the connection string
   - Update `DATABASE_URL` in your environment

### 2.2 Run Database Migrations

```bash
# Apply schema migrations
supabase db push

# Or manually run SQL files
psql $DATABASE_URL -f scripts/create-scheduling-constraints-table.sql
```

### 2.3 Set Up Row Level Security

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduling_constraints ENABLE ROW LEVEL SECURITY;

-- Create policies (run the RLS policies from your schema files)
```

### 2.4 Create Database Indexes

```sql
-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON bookings(start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
```

## Step 3: Google Calendar API Setup

### 3.1 Create Production OAuth Client

1. **Go to Google Cloud Console**
   - Visit https://console.cloud.google.com
   - Select your project or create a new one

2. **Enable Calendar API**
   ```bash
   # Enable the API
   gcloud services enable calendar-json.googleapis.com
   ```

3. **Create OAuth 2.0 Credentials**
   - Go to APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Name: "Driving School Production"

4. **Configure Authorized Redirect URIs**
   ```
   https://yourdomain.com/api/auth/callback/google
   https://yourdomain.com/api/calendar/oauth/callback
   ```

5. **Update Environment Variables**
   - Copy Client ID and Client Secret
   - Update `.env.production`

### 3.2 Configure OAuth Consent Screen

1. **Set Up Consent Screen**
   - Go to APIs & Services → OAuth consent screen
   - Choose "External" user type
   - Fill in application details:
     - App name: "Your Driving School"
     - User support email: your-email@domain.com
     - Developer contact: your-email@domain.com

2. **Add Scopes**
   ```
   https://www.googleapis.com/auth/calendar.readonly
   https://www.googleapis.com/auth/calendar.events
   ```

3. **Add Test Users** (for initial testing)
   - Add your email and test user emails

## Step 4: Redis Cache Setup

### 4.1 Create Redis Instance

#### Using Redis Cloud (Recommended)

1. **Create Account**
   - Visit https://redis.com/try-free/
   - Create free account

2. **Create Database**
   - Create new subscription
   - Choose cloud provider and region
   - Select free tier

3. **Get Connection Details**
   - Copy Redis URL
   - Update `REDIS_URL` in environment

#### Alternative: Self-hosted Redis

```bash
# Using Docker
docker run -d \
  --name redis-prod \
  -p 6379:6379 \
  --restart unless-stopped \
  redis:alpine redis-server --requirepass yourpassword
```

## Step 5: Application Build & Test

### 5.1 Install Dependencies

```bash
# Install production dependencies
npm ci --only=production

# Or install all and build
npm install
```

### 5.2 Build Application

```bash
# Create production build
npm run build

# Test the build locally
npm start
```

### 5.3 Run Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e
```

## Step 6: Deploy to Vercel

### 6.1 Install Vercel CLI

```bash
npm i -g vercel
```

### 6.2 Login and Link Project

```bash
# Login to Vercel
vercel login

# Link project (run in project directory)
vercel link
```

### 6.3 Configure Environment Variables

```bash
# Set environment variables
vercel env add NEXTAUTH_SECRET production
vercel env add DATABASE_URL production
vercel env add GOOGLE_CLIENT_ID production
vercel env add GOOGLE_CLIENT_SECRET production
vercel env add REDIS_URL production
# ... add all other environment variables
```

### 6.4 Deploy to Production

```bash
# Deploy to production
vercel --prod

# Or use the deploy command
npm run deploy
```

### 6.5 Configure Custom Domain

```bash
# Add custom domain
vercel domains add yourdomain.com

# Configure DNS
# Add CNAME record: www -> cname.vercel-dns.com
# Add A record: @ -> 76.76.19.61
```

## Step 7: Post-Deployment Configuration

### 7.1 Update OAuth Redirect URIs

Update Google OAuth settings with your production domain:
```
https://yourdomain.com/api/auth/callback/google
https://yourdomain.com/api/calendar/oauth/callback
```

### 7.2 Configure CORS

Update your API routes to allow your production domain:

```javascript
// In your API routes
const allowedOrigins = [
  'https://yourdomain.com',
  'https://www.yourdomain.com'
];
```

### 7.3 Set Up SSL Certificate

Vercel automatically provides SSL certificates. Verify:
- Visit https://yourdomain.com
- Check for valid SSL certificate
- Ensure HTTP redirects to HTTPS

## Step 8: Monitoring & Logging

### 8.1 Set Up Error Monitoring

#### Using Sentry (Recommended)

```bash
# Install Sentry
npm install @sentry/nextjs

# Configure Sentry
npx @sentry/wizard -i nextjs
```

Add to `next.config.js`:
```javascript
const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig({
  // Your existing config
}, {
  silent: true,
  org: "your-org",
  project: "driving-school",
});
```

### 8.2 Set Up Performance Monitoring

Add to `pages/_app.js`:
```javascript
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    // Track page views
    const handleRouteChange = (url) => {
      // Analytics tracking
      gtag('config', 'GA_MEASUREMENT_ID', {
        page_path: url,
      });
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  return <Component {...pageProps} />;
}
```

### 8.3 Set Up Health Checks

Create `pages/api/health.js`:
```javascript
export default async function handler(req, res) {
  try {
    // Check database connection
    // Check Redis connection
    // Check external APIs
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
}
```

## Step 9: Security Hardening

### 9.1 Configure Security Headers

Add to `next.config.js`:
```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
          }
        ]
      }
    ];
  }
};
```

### 9.2 Set Up Rate Limiting

Create middleware for rate limiting:
```javascript
// middleware.js
import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '15 m'),
});

export async function middleware(request) {
  const ip = request.ip ?? '127.0.0.1';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return new NextResponse('Rate limit exceeded', { status: 429 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

## Step 10: Backup & Recovery

### 10.1 Set Up Database Backups

#### Supabase Automatic Backups
- Supabase Pro plan includes automatic daily backups
- Configure backup retention period
- Test backup restoration process

#### Manual Backup Script
```bash
#!/bin/bash
# backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DATE}.sql"

pg_dump $DATABASE_URL > $BACKUP_FILE
gzip $BACKUP_FILE

# Upload to cloud storage
aws s3 cp ${BACKUP_FILE}.gz s3://your-backup-bucket/
```

### 10.2 Set Up Application Backups

```bash
#!/bin/bash
# backup-app.sh

# Create application backup
tar -czf app_backup_$(date +%Y%m%d).tar.gz \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.git \
  .

# Upload to storage
aws s3 cp app_backup_*.tar.gz s3://your-backup-bucket/app/
```

## Step 11: Performance Optimization

### 11.1 Enable Caching

Configure caching in `next.config.js`:
```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/api/calendar/events',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=600'
          }
        ]
      }
    ];
  }
};
```

### 11.2 Optimize Images

```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['yourdomain.com'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  }
};
```

### 11.3 Enable Compression

Vercel automatically enables compression, but verify:
```javascript
// Check compression in browser dev tools
// Ensure gzip/brotli is enabled
```

## Step 12: Testing Production Deployment

### 12.1 Smoke Tests

```bash
# Test critical endpoints
curl -f https://yourdomain.com/api/health
curl -f https://yourdomain.com/api/auth/session
curl -f https://yourdomain.com/
```

### 12.2 End-to-End Testing

1. **User Registration/Login**
   - Create new account
   - Login with existing account
   - Test password reset

2. **Calendar Integration**
   - Connect Google Calendar
   - Test OAuth flow
   - Verify calendar access

3. **Booking Flow**
   - View available slots
   - Create booking
   - Modify booking
   - Cancel booking

4. **Admin Functions**
   - Access admin panel
   - Modify scheduling constraints
   - View booking reports

### 12.3 Performance Testing

```bash
# Install artillery for load testing
npm install -g artillery

# Create test script (artillery-test.yml)
# Run load test
artillery run artillery-test.yml
```

## Step 13: Go-Live Checklist

### 13.1 Final Verification

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificate valid
- [ ] OAuth configuration correct
- [ ] Rate limiting enabled
- [ ] Monitoring configured
- [ ] Backups scheduled
- [ ] Error tracking active
- [ ] Performance monitoring enabled
- [ ] Security headers configured

### 13.2 Communication Plan

1. **Notify Stakeholders**
   - Send go-live notification
   - Provide support contact information
   - Share monitoring dashboard access

2. **User Communication**
   - Send announcement email
   - Update website/app notifications
   - Prepare support documentation

### 13.3 Post-Launch Monitoring

**First 24 Hours:**
- Monitor error rates every hour
- Check performance metrics
- Respond to user feedback
- Monitor server resources

**First Week:**
- Daily performance reviews
- User feedback analysis
- Bug fix deployments
- Performance optimizations

## Rollback Procedures

### Emergency Rollback

```bash
# Quick rollback to previous version
vercel rollback

# Or rollback to specific deployment
vercel rollback [deployment-url]
```

### Database Rollback

```bash
# Restore from backup
pg_restore -d $DATABASE_URL backup_file.sql

# Or use Supabase dashboard to restore from backup
```

### Gradual Rollback

1. **Route Traffic Gradually**
   - Use Vercel's traffic splitting
   - Monitor error rates
   - Gradually shift traffic back

2. **Feature Flags**
   - Disable problematic features
   - Keep core functionality active
   - Fix issues and re-enable

## Troubleshooting

### Common Issues

1. **OAuth Redirect Mismatch**
   ```
   Error: redirect_uri_mismatch
   Solution: Update Google OAuth settings with correct production URLs
   ```

2. **Database Connection Issues**
   ```
   Error: Connection timeout
   Solution: Check DATABASE_URL, verify SSL settings, check firewall rules
   ```

3. **Environment Variable Issues**
   ```
   Error: Missing required environment variable
   Solution: Verify all variables are set in Vercel dashboard
   ```

4. **Rate Limiting Issues**
   ```
   Error: Too many requests
   Solution: Adjust rate limiting rules, implement user-specific limits
   ```

### Debug Commands

```bash
# Check deployment logs
vercel logs

# Check function logs
vercel logs --follow

# Check build logs
vercel inspect [deployment-url]
```

## Support & Maintenance

### Regular Maintenance Tasks

**Daily:**
- Check error logs
- Monitor performance metrics
- Verify backup completion

**Weekly:**
- Review user feedback
- Update dependencies
- Security patch updates

**Monthly:**
- Performance optimization review
- Security audit
- Capacity planning review

### Emergency Contacts

- **Technical Lead**: [Name] - [Email] - [Phone]
- **DevOps**: [Name] - [Email] - [Phone]
- **Business Owner**: [Name] - [Email] - [Phone]

### Documentation Updates

Keep this deployment guide updated with:
- New environment variables
- Configuration changes
- Lessons learned from deployments
- Updated troubleshooting steps

---

**Deployment Checklist Complete!** 🚀

Remember to follow the [Production Checklist](./PRODUCTION_CHECKLIST.md) for comprehensive production readiness verification.