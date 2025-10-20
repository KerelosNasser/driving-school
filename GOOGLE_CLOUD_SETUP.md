# Google Cloud Setup Guide for Calendar System

## 🚀 Complete Google Cloud Configuration

This guide provides the exact Google Cloud Console setup required for your driving school calendar system to work in production without issues.

## 📋 Required Google Cloud Scopes & Permissions

### Essential Calendar API Scopes
```
https://www.googleapis.com/auth/calendar.readonly
https://www.googleapis.com/auth/calendar.events
https://www.googleapis.com/auth/calendar.settings.readonly
```

### Optional Enhanced Scopes (for advanced features)
```
https://www.googleapis.com/auth/calendar.calendars.readonly
https://www.googleapis.com/auth/calendar.acls.readonly
```

## 🔧 Step-by-Step Google Cloud Setup

### Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com
   - Click "Select a project" → "New Project"

2. **Project Configuration**
   ```
   Project Name: driving-school-calendar-prod
   Project ID: driving-school-calendar-[unique-id]
   Organization: Your Organization (if applicable)
   ```

3. **Enable Billing** (Required for production)
   - Go to Billing → Link a billing account
   - Even free tier requires billing account for API access

### Step 2: Enable Required APIs

```bash
# Using gcloud CLI (recommended)
gcloud config set project driving-school-calendar-[your-id]

# Enable Calendar API
gcloud services enable calendar-json.googleapis.com

# Enable additional APIs for monitoring
gcloud services enable cloudresourcemanager.googleapis.com
gcloud services enable serviceusage.googleapis.com
```

**Or via Console:**
- Go to APIs & Services → Library
- Search and enable:
  - ✅ Google Calendar API
  - ✅ Cloud Resource Manager API
  - ✅ Service Usage API

### Step 3: Configure OAuth Consent Screen

1. **Go to APIs & Services → OAuth consent screen**

2. **User Type Selection**
   - Choose **"External"** for public driving school
   - Choose **"Internal"** only if using Google Workspace

3. **App Information**
   ```
   App name: [Your Driving School Name] - Calendar System
   User support email: support@yourdrivingschool.com
   App logo: Upload your driving school logo (120x120px)
   App domain: https://yourdomain.com
   ```

4. **Developer Contact Information**
   ```
   Email addresses: 
   - admin@yourdrivingschool.com
   - tech@yourdrivingschool.com
   ```

5. **Authorized Domains**
   ```
   yourdomain.com
   www.yourdomain.com
   ```

### Step 4: Add OAuth Scopes

1. **Click "Add or Remove Scopes"**

2. **Add These Scopes:**
   ```
   ../auth/userinfo.email
   ../auth/userinfo.profile
   https://www.googleapis.com/auth/calendar.readonly
   https://www.googleapis.com/auth/calendar.events
   ```

3. **Scope Justification** (Required for sensitive scopes)
   ```
   Calendar Events: Required to create and manage driving lesson bookings
   Calendar Readonly: Required to check instructor availability and prevent conflicts
   ```

### Step 5: Create OAuth 2.0 Credentials

1. **Go to APIs & Services → Credentials**

2. **Create Credentials → OAuth 2.0 Client ID**

3. **Application Type Configuration**
   ```
   Application type: Web application
   Name: Driving School Calendar - Production
   ```

4. **Authorized JavaScript Origins**
   ```
   https://yourdomain.com
   https://www.yourdomain.com
   ```

5. **Authorized Redirect URIs**
   ```
   https://yourdomain.com/api/auth/callback/google
   https://yourdomain.com/api/calendar/oauth/callback
   https://yourdomain.com/api/calendar/oauth/success
   ```

### Step 6: Download and Secure Credentials

1. **Download JSON File**
   - Click download button next to your OAuth client
   - **NEVER commit this file to version control**

2. **Extract Required Values**
   ```json
   {
     "client_id": "your-client-id.googleusercontent.com",
     "client_secret": "your-client-secret"
   }
   ```

3. **Add to Environment Variables**
   ```bash
   GOOGLE_CLIENT_ID="your-client-id.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="your-client-secret"
   ```

## 🔒 Security & Compliance Setup

### API Key Restrictions (if using API keys)

1. **Create API Key**
   - Go to Credentials → Create Credentials → API Key

2. **Restrict API Key**
   ```
   Application restrictions:
   - HTTP referrers: https://yourdomain.com/*
   
   API restrictions:
   - Google Calendar API only
   ```

### Quota Management

1. **Go to APIs & Services → Quotas**

2. **Calendar API Quotas to Monitor**
   ```
   Queries per day: 1,000,000 (default)
   Queries per 100 seconds per user: 20,000
   Queries per 100 seconds: 250,000
   ```

3. **Request Quota Increase** (if needed)
   - For high-volume driving schools
   - Provide business justification

## 🚦 Production Readiness Checklist

### Pre-Launch Verification

- [ ] **OAuth Consent Screen**
  - [ ] App name and logo configured
  - [ ] Privacy policy URL added
  - [ ] Terms of service URL added
  - [ ] All required scopes added

- [ ] **Credentials Configuration**
  - [ ] Production redirect URIs configured
  - [ ] Client ID and secret secured
  - [ ] API keys restricted properly

- [ ] **API Quotas**
  - [ ] Current usage monitored
  - [ ] Quota alerts configured
  - [ ] Increase requested if needed

- [ ] **Security**
  - [ ] Credentials not in version control
  - [ ] Environment variables secured
  - [ ] HTTPS enforced on all endpoints

### Testing Checklist

```bash
# Test OAuth flow
curl -X GET "https://yourdomain.com/api/calendar/oauth/init"

# Test calendar access
curl -X GET "https://yourdomain.com/api/calendar/availability" \
  -H "Authorization: Bearer your-test-token"

# Test booking creation
curl -X POST "https://yourdomain.com/api/calendar/book" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-test-token" \
  -d '{"startTime":"2024-01-15T10:00:00Z","endTime":"2024-01-15T11:00:00Z"}'
```

## 🔍 Monitoring & Maintenance

### Google Cloud Monitoring

1. **Enable Cloud Monitoring**
   ```bash
   gcloud services enable monitoring.googleapis.com
   ```

2. **Set Up Alerts**
   - API quota usage > 80%
   - Error rate > 5%
   - Response time > 2 seconds

### Regular Maintenance Tasks

- [ ] **Monthly**: Review API usage and costs
- [ ] **Quarterly**: Update OAuth consent screen if needed
- [ ] **Annually**: Rotate client secrets
- [ ] **As needed**: Update redirect URIs for new domains

## 🚨 Troubleshooting Common Issues

### OAuth Errors

**Error: `redirect_uri_mismatch`**
```
Solution: Ensure redirect URI in code matches exactly what's configured in Google Cloud Console
Check: https://console.cloud.google.com/apis/credentials
```

**Error: `access_denied`**
```
Solution: User declined consent or app not verified
Check: OAuth consent screen configuration and verification status
```

### API Errors

**Error: `quotaExceeded`**
```
Solution: Request quota increase or implement better caching
Check: APIs & Services → Quotas
```

**Error: `forbidden`**
```
Solution: Check API is enabled and credentials are correct
Check: APIs & Services → Enabled APIs
```

## 📞 Support Resources

- **Google Cloud Support**: https://cloud.google.com/support
- **Calendar API Documentation**: https://developers.google.com/calendar
- **OAuth 2.0 Guide**: https://developers.google.com/identity/protocols/oauth2
- **Quota Management**: https://cloud.google.com/docs/quota

## 💰 Cost Estimation

### Free Tier Limits
- Calendar API: 1,000,000 requests/day (free)
- OAuth operations: No additional cost

### Paid Usage (if exceeding free tier)
- Additional Calendar API requests: $0.25 per 1,000 requests
- Typical driving school usage: $5-20/month

### Cost Optimization Tips
- Implement caching to reduce API calls
- Use batch requests when possible
- Monitor usage with Cloud Monitoring alerts