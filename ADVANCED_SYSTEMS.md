# 🔧 Advanced Systems Documentation

> **Deep dive into specialized systems and services**

---

## 📅 Google Calendar Integration

### Overview
Comprehensive Google Calendar integration with OAuth 2.0, PKCE security, and incremental authorization.

### Architecture

```
User → OAuth Flow → Token Manager → Calendar Service → Google Calendar API
                         ↓
                   Supabase Storage
```

### Key Components

#### **1. ModernGoogleOAuthClient** (`lib/google-api/modern-oauth-client.ts`)

**Purpose**: Modern OAuth 2.0 client with 2025 security standards

**Features**:
- PKCE (Proof Key for Code Exchange) for enhanced security
- Incremental authorization (request scopes as needed)
- Secure state parameter with HMAC signature
- OpenID Connect integration
- Automatic token refresh
- Token encryption and secure storage

**Key Methods**:
```typescript
// Generate auth URL with PKCE
generateAuthUrl(userId: string, scopes?: string[]): Promise<{ authUrl: string; state: string }>

// Exchange code for tokens
exchangeCodeForTokens(code: string, state: string): Promise<TokenData>

// Refresh access token
refreshAccessToken(refreshToken: string): Promise<TokenData>

// Get authenticated client
getAuthenticatedClient(tokenData: TokenData): Promise<OAuth2Client>

// Incremental authorization
generateIncrementalAuthUrl(request: IncrementalAuthRequest): Promise<{ authUrl: string; state: string }>
```

**Scope Tiers**:
- **BASIC**: Profile, email, OpenID
- **CALENDAR_READONLY**: Read calendar events
- **CALENDAR_FULL**: Full calendar management
- **BUSINESS**: Business information and listings
- **DRIVE**: File management

#### **2. GoogleAPIScopeManager** (`lib/google-api/scope-manager.ts`)

**Purpose**: Intelligent scope management and recommendations

**Features**:
- Scope validation for operations
- Role-based scope recommendations
- Scope escalation validation
- User-friendly scope descriptions
- Category grouping

**Key Methods**:
```typescript
// Validate scopes for operation
validateScopesForOperation(operation: string, grantedScopes: string[]): ScopeValidationResult

// Recommend scopes based on context
recommendScopes(options: {
  userRole?: string;
  usageContext?: string;
  currentScopes?: string[];
  plannedOperations?: string[];
}): ScopeRecommendation

// Group scopes by category
groupScopesByCategory(scopes: string[]): Record<string, { scopes: string[]; category: any }>
```

#### **3. EnhancedCalendarService** (`lib/calendar/enhanced-calendar-service.ts`)

**Purpose**: High-level calendar operations with business logic

**Features**:
- Availability checking with working hours
- Booking creation and management
- Buffer time management
- Vacation day handling
- Admin event management
- Public event anonymization

**Key Methods**:
```typescript
// Get available time slots
getAvailableSlots(date: string, bufferMinutes?: number): Promise<TimeSlot[]>

// Create booking
createBooking(booking: BookingRequest): Promise<CalendarEvent>

// Get events in date range
getEvents(startDate: string, endDate: string): Promise<CalendarEvent[]>

// Get booking statistics
getBookingStats(startDate: string, endDate: string): Promise<BookingStats>
```

**Configuration**:
```typescript
interface BookingSettings {
  bufferTimeMinutes: number;        // Default: 30
  maxBookingsPerDay: number;        // Default: 8
  workingHours: { start: string; end: string };
  workingDays: number[];            // 0-6, Sunday = 0
  vacationDays: string[];           // ISO date strings
  lessonDurationMinutes: number;    // Default: 60
}
```

### Calendar API Routes

```
POST /api/calendar/connect       - Initiate OAuth connection
GET  /api/calendar/connection    - Check connection status
GET  /api/calendar/events        - List events
POST /api/calendar/book          - Create booking
DELETE /api/calendar/cancel      - Cancel booking
GET  /api/calendar/availability  - Get available slots
POST /api/calendar/sync          - Sync calendar
GET  /api/calendar/stats         - Get statistics
GET  /api/calendar/settings      - Get settings
PUT  /api/calendar/settings      - Update settings
```

### OAuth Flow

1. **Authorization Request**:
   - Generate PKCE parameters
   - Create secure state parameter
   - Redirect to Google OAuth
   
2. **Callback Handling**:
   - Validate state parameter
   - Exchange code for tokens using PKCE
   - Validate ID token
   - Store encrypted refresh token
   
3. **Token Management**:
   - Automatic token refresh
   - Secure token storage
   - Token revocation on logout

### Security Features

- **PKCE**: Prevents authorization code interception
- **State Parameter**: CSRF protection with HMAC signature
- **Token Encryption**: AES-256-GCM encryption for refresh tokens
- **Scope Validation**: Verify required scopes before operations
- **Rate Limiting**: Prevent API abuse
- **Audit Logging**: Track all OAuth operations

---

## 💳 Payment System

### Overview
Manual payment system with PayID, BPAY, and Tyro support.

### Components

#### **1. PaymentIdService** (`lib/payment-id-service.ts`)

**Purpose**: Generate and validate unique payment IDs

**Format**: `PAY_1_TIMESTAMP_RANDOMID_CHECKSUM`

**Features**:
- Cryptographically secure random IDs
- SHA-256 checksum validation
- Timestamp-based expiration (30 days)
- Payment reference generation

**Key Methods**:
```typescript
// Generate payment ID
generatePaymentId(userId: string, packageId: string, amount: number, gateway: string): string

// Validate payment ID
validatePaymentId(paymentId: string): PaymentIdValidationResult

// Generate payment reference
generatePaymentReference(gateway: string, paymentId: string): string

// Generate session ID
generateSessionId(): string
```

#### **2. FraudDetector** (`lib/fraud-detection.ts`)

**Purpose**: Detect and prevent fraudulent payments

**Features**:
- Rapid attempt detection
- Unusual amount detection
- IP reputation checking
- Velocity pattern analysis
- Geographic anomaly detection
- User behavior analysis

**Scoring System**:
- 0-74: Low risk (allow)
- 75-89: Medium risk (flag for review)
- 90-100: High risk (block)

**Key Methods**:
```typescript
// Analyze payment attempt
analyzePayment(attempt: PaymentAttempt): Promise<FraudScore>

// Log fraud attempt
logFraudAttempt(userId: string, score: number, reasons: string[], blocked: boolean): Promise<void>
```

**Fraud Indicators**:
- Multiple rapid attempts (30 points)
- Unusually high amount (20 points)
- Suspicious IP (20-40 points)
- Unusual velocity (15-25 points)
- New account (8-15 points)
- Geographic anomaly (20 points)

### Payment Flow

1. **Session Creation**:
   ```typescript
   POST /api/manual-payment
   Body: { packageId, userId, gateway }
   Response: { sessionId, amount, gateway, expiresAt }
   ```

2. **Payment Instructions**:
   ```typescript
   GET /api/manual-payment?session_id=...
   Response: { paymentDetails, instructions }
   ```

3. **Payment Confirmation**:
   ```typescript
   POST /api/manual-payment
   Body: { sessionId, paymentReference }
   Response: { success, quotaUpdated }
   ```

### Payment Gateways

#### **PayID** (Primary)
- **Identifier**: 0431512095
- **Fees**: 0.5% + 10¢
- **Processing**: Instant
- **Type**: Manual confirmation

#### **BPAY**
- **Biller Code**: Generated per transaction
- **Fees**: 0.6% + 25¢
- **Processing**: 1-2 business days
- **Type**: Manual confirmation

#### **Tyro**
- **Terminal**: EFTPOS terminal
- **Fees**: 1.8% + 30¢
- **Processing**: Instant
- **Type**: Manual confirmation

---

## 🔐 Security Systems

### Invitation System

#### **InvitationCrypto** (`lib/invitation-crypto.ts`)

**Purpose**: Secure invitation code generation and validation

**Features**:
- AES-256-GCM encryption
- Time-based expiration (1 year)
- Tamper-proof codes
- URL-safe encoding

**Code Format**: `DRV` + Base64URL(Encrypted Data)

**Key Methods**:
```typescript
// Generate encrypted invitation code
generateEncryptedInvitationCode(userId: string): string

// Decrypt and validate code
decryptInvitationCode(code: string): { userId: string; isValid: boolean; error?: string }

// Validate code format
isValidInvitationCodeFormat(code: string): boolean
```

### Phone Number Security

#### **Phone Validation** (`lib/phone.ts`)

**Purpose**: Secure phone number handling with 2025 standards

**Features**:
- Multi-country support (AU, US, GB)
- E.164 normalization
- Rate limiting
- PII masking
- Test bypass for development
- Audit logging

**Key Functions**:
```typescript
// Validate phone number
validatePhoneNumber(phoneNumber: string, country?: string): PhoneValidationResult

// Format for display
formatForDisplay(phoneNumber: string, options?: PhoneFormatOptions): string

// Mask for privacy
maskPhoneNumber(phoneNumber: string, visibleDigits?: number): string

// Secure validation with rate limiting
validatePhoneNumberSecure(phoneNumber: string, identifier: string, country?: string): PhoneValidationResult
```

**Security Features**:
- Rate limiting (configurable per window)
- Suspicious pattern detection
- Character whitelist validation
- Length validation
- Test bypass numbers for development

---

## 🎨 Theme System

### Overview
Comprehensive theme management with real-time preview and persistence.

### Architecture

```
ThemeContext → Theme Engine → CSS Variables → DOM
                    ↓
              Supabase Storage
```

### Components (40+ files in `lib/theme/`)

#### **Core Files**

1. **engine.ts** - Theme application engine
2. **persist.ts** - Theme persistence to database
3. **presets.ts** - Pre-built theme presets
4. **validation.ts** - Theme validation
5. **preview.ts** - Real-time preview system
6. **accessibility.ts** - Accessibility compliance
7. **performance-optimizer.ts** - Performance optimization

#### **Features**

**1. Real-time Preview**
- Live CSS variable injection
- Component-level preview
- Responsive preview modes
- Undo/redo support

**2. Theme Presets**
- Professional presets
- Custom preset creation
- Preset import/export
- Preset gallery

**3. Color Management**
- HSL-based color system
- Automatic contrast calculation
- Color harmony suggestions
- Accessibility validation

**4. Performance**
- CSS variable caching
- Debounced updates
- Lazy loading
- Bundle optimization

### Theme Configuration

```typescript
interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
    destructive: string;
    border: string;
    ring: string;
  };
  typography: {
    fontFamily: string;
    headingFontFamily: string;
    lineHeight: number;
    letterSpacing: number;
  };
  layout: {
    containerMaxWidth: string;
    borderRadius: number;
    spacing: number;
    headerHeight: number;
    footerHeight: number;
    sidebarWidth: number;
  };
  darkMode: boolean;
  customCss: string;
}
```

### Theme API

```
GET  /api/admin/theme          - Get current theme
POST /api/admin/theme          - Save theme
PUT  /api/admin/theme/apply    - Apply theme to live site
GET  /api/admin/theme/presets  - List presets
POST /api/admin/theme/export   - Export theme
POST /api/admin/theme/import   - Import theme
```

---

## 📊 GraphQL System

### Overview
Full-featured GraphQL API with Apollo Server 4.

### Features

- **Query Complexity Analysis**: Prevent expensive queries
- **Depth Limiting**: Max depth 10 (prod) / 15 (dev)
- **DataLoaders**: Batch and cache database queries
- **Subscriptions**: Real-time updates via WebSocket
- **Rate Limiting**: Per-operation rate limits
- **Authentication**: Clerk integration
- **Authorization**: Role-based access control

### Query Complexity

**Configuration**:
- Max complexity: 500 (prod) / 1000 (dev)
- Field cost: 1 (default)
- List multiplier: 10
- Nested object cost: 2

**Example**:
```graphql
query {
  users(limit: 100) {        # Cost: 100 * 10 = 1000 (exceeds limit)
    bookings {               # Cost: 100 * 10 * 10 = 10000
      package {              # Cost: 100 * 10 * 10 * 2 = 20000
        features             # Total: Too complex!
      }
    }
  }
}
```

### DataLoaders

**Purpose**: Solve N+1 query problem

**Loaders**:
- userLoader
- quotaLoader
- packageLoader
- reviewLoader
- bookingLoader
- transactionLoader
- userBookingsLoader
- userTransactionsLoader

**Performance**: Reduces queries by 10-100x

---

## 🔄 Real-time Collaboration

### Overview
Sophisticated real-time editing with presence tracking and conflict resolution.

### Components

1. **RealtimeClient** - WebSocket connection management
2. **PresenceTracker** - Track active editors
3. **EventRouter** - Route events to handlers
4. **ConflictResolver** - Handle edit conflicts

### Event Types

- `content_change` - Content updated
- `component_add` - Component added
- `component_move` - Component moved
- `component_delete` - Component deleted
- `page_create` - New page created
- `navigation_update` - Navigation changed
- `conflict_detected` - Edit conflict

### Conflict Resolution

**Strategies**:
- `accept_local` - Keep local changes
- `accept_remote` - Accept remote changes
- `merge` - Automatic merge
- `manual` - Manual resolution required

**Detection**:
- Version tracking
- Timestamp comparison
- Content hash comparison

---

## 📈 Performance Monitoring

### Sentry Integration

**Configuration**:
- DSN: Environment variable
- Sample rate: 100% (adjust in production)
- Traces: Enabled
- Logs: Enabled

**Features**:
- Error tracking
- Performance monitoring
- User context
- Breadcrumbs
- Source maps

### Web Vitals

**Metrics Tracked**:
- LCP (Largest Contentful Paint)
- FID (First Input Delay)
- CLS (Cumulative Layout Shift)
- TTFB (Time to First Byte)

**Component**: `components/seo/WebVitals.tsx`

---

## 🧪 Testing Infrastructure

### Jest Configuration

**Coverage Thresholds**:
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

**Test Patterns**:
- Unit tests: `__tests__/**/*.test.ts`
- Integration tests: `**/*.spec.ts`

### Playwright E2E

**Browsers**:
- Chromium
- Firefox
- WebKit

**Configuration**: `playwright.config.ts`

---

This documentation covers the advanced systems in your application. Reference specific sections when working with these complex features.
