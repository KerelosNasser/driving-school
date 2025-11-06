# EG Driving School - Complete Application Context

## 📋 Project Overview

**EG Driving School** is a comprehensive, full-stack web application for managing a professional driving school business in Brisbane, Australia. Built with modern technologies, it provides end-to-end functionality from customer-facing features to administrative management.

### Core Purpose
- Streamline driving school operations
- Provide exceptional user experience for students
- Enable efficient administrative management
- Automate booking, payment, and communication workflows
- Deliver AI-powered customer support

---

## 🏗️ Technical Architecture

### Frontend Stack
- **Framework**: Next.js 15.5.3 (App Router with React Server Components)
- **React**: 19.1.0 with modern hooks and patterns
- **TypeScript**: Full type safety throughout
- **Styling**: Tailwind CSS 4.0 with custom design system
- **UI Components**: shadcn/ui built on Radix UI primitives
- **Animations**: Framer Motion for smooth interactions
- **Icons**: Lucide React
- **State Management**: React Context API (EditModeContext, GlobalContentContext, ThemeContext)

### Backend Stack
- **Runtime**: Next.js API Routes (serverless functions)
- **Database**: Supabase (PostgreSQL) with real-time capabilities
- **Authentication**: Clerk for secure user management
- **ORM**: Supabase client with type-safe queries
- **GraphQL**: Apollo Server with custom resolvers and schema

### Third-Party Integrations
- **Payments**: PayID (primary manual payment method)
- **Email**: Resend for transactional emails
- **Maps**: Leaflet.js for interactive mapping
- **AI**: Multiple providers (Hyperbolic, OpenRouter, Groq) for chatbot
- **Calendar**: FullCalendar for scheduling interface
- **Monitoring**: Sentry for error tracking and performance
- **Forms**: Google Forms integration

---

## 📁 Project Structure

### Key Directories

```
driving-school/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes (sign-in, sign-up, complete-profile)
│   ├── admin/                    # Admin dashboard with multiple tabs
│   ├── api/                      # API routes for all backend operations
│   ├── packages/                 # Package listing page
│   ├── reviews/                  # Reviews display and submission
│   ├── contact/                  # Contact page
│   ├── manual-payment/           # Manual payment processing page
│   └── page.tsx                  # Homepage
│
├── components/                   # Reusable React components
│   ├── admin/                    # Admin-specific components
│   ├── booking/                  # Booking modal and forms
│   ├── chatbot/                  # AI chatbot interface
│   ├── drag-drop/                # Drag-and-drop page builder
│   ├── home/                     # Homepage sections (hero, features, gallery, etc.)
│   ├── maps/                     # Leaflet map components
│   ├── payment/                  # Payment UI components
│   ├── ui/                       # shadcn/ui base components
│   └── ...                       # Other component categories
│
├── lib/                          # Utility libraries and services
│   ├── api/                      # API utilities
│   ├── auth/                     # Authentication helpers
│   ├── calendar/                 # Calendar service integration
│   ├── components/               # Component registry and positioning
│   ├── conflict-resolution/      # Concurrent editing conflict resolution
│   ├── database/                 # Database utilities and migrations
│   ├── drag-drop/                # Drag-and-drop system
│   ├── graphql/                  # GraphQL schema, resolvers, dataloaders
│   ├── permissions/              # Role-based access control
│   ├── realtime/                 # Real-time event system
│   ├── theme/                    # Theme management system
│   ├── validation/               # Input validation and sanitization
│   ├── supabase.ts               # Supabase client
│   ├── types.ts                  # TypeScript type definitions
│   └── utils.ts                  # General utilities
│
├── contexts/                     # React Context providers
│   ├── editModeContext.tsx       # Edit mode state
│   ├── globalContentContext.tsx  # Global content management
│   └── ThemeContext.tsx          # Theme customization
│
├── hooks/                        # Custom React hooks
│   ├── useBookings.ts
│   ├── usePages.ts
│   ├── useProfileCompletion.ts
│   └── useRealTimeNotifications.ts
│
├── sql/                          # Database schema and migrations
│   └── create_calendar_tables.sql
│
└── public/                       # Static assets
    └── leaflet/                  # Map assets
```

---

## 🗄️ Database Schema

### Core Tables

#### **users**
- `id` (UUID, PK)
- `email` (Unique, Not Null)
- `full_name`
- `phone`
- `clerk_id` (Unique, Not Null) - Links to Clerk authentication
- `role` (student | instructor | admin)
- `created_at`, `updated_at`

#### **packages**
- `id` (UUID, PK)
- `name` (Not Null)
- `description` (Not Null)
- `price` (Decimal)
- `hours` (Integer)
- `features` (JSONB array)
- `popular` (Boolean)
- `payment_id` (Optional)
- `created_at`

#### **bookings**
- `id` (UUID, PK)
- `user_id` (FK → users)
- `package_id` (FK → packages)
- `instructor_id` (FK → users)
- `date`, `start_time`, `end_time`
- `status` (pending | confirmed | completed | cancelled | rejected)
- `notes`
- `google_calendar_event_id`
- `created_at`, `updated_at`

#### **reviews**
- `id` (UUID, PK)
- `user_id` (FK → users)
- `rating` (Integer, 1-5)
- `comment` (Not Null)
- `approved` (Boolean)
- `user_name` (Not Null)
- `user_image`
- `created_at`

#### **manual_payment_sessions**
- `id` (UUID, PK)
- `session_id` (Unique)
- `user_id` (FK → users)
- `package_id` (FK → packages)
- `amount` (Decimal)
- `currency` (Default: AUD)
- `gateway` (payid)
- `status` (pending | completed | expired)
- `payment_reference`
- `metadata` (JSONB)
- `expires_at`, `completed_at`
- `created_at`

#### **site_content**
- `id` (UUID, PK)
- `content_key` (Unique identifier)
- `content_type` (text | image | json | boolean)
- `content_value` (Text content)
- `content_json` (JSONB for structured data)
- `page_section` (Which page/section)
- `file_path`, `file_url`, `file_name` (For images)
- `alt_text`, `title`, `description`
- `is_active`, `is_draft`
- `display_order`
- `created_at`, `updated_at`

#### **content_versions**
- Version history for content changes
- Supports rollback functionality

#### **user_quotas**
- Tracks lesson hours purchased and used
- `user_id`, `total_hours`, `used_hours`, `remaining_hours`

#### **quota_transactions**
- Transaction log for quota changes
- `user_id`, `hours_change`, `transaction_type`, `description`

---

## 🔐 Authentication & Authorization

### Clerk Integration
- **Sign In/Up**: `/sign-in`, `/sign-up`
- **Profile Completion**: `/complete-profile` (post-signup flow)
- **Middleware**: `middleware.ts` protects routes
- **User Sync**: Automatic synchronization between Clerk and Supabase

### Role-Based Access Control (RBAC)
- **Student**: Can book lessons, view packages, submit reviews
- **Instructor**: Can view assigned bookings
- **Admin**: Full access to dashboard, content management, user management

### Protected Routes
- Admin dashboard requires admin role
- API routes use Clerk auth middleware
- Permission gates in components (`PermissionGate.tsx`)

---

## 🎨 Key Features

### 1. **Homepage** (`app/page.tsx`)
- **Hero Section**: Compelling CTA with animations
- **Features**: 8 customizable feature highlights
- **Packages Preview**: Top 3 packages with pricing
- **Gallery**: Image showcase with optimized loading
- **Instructor Bio**: Professional profile with credentials
- **Service Area Map**: Interactive Leaflet map
- **Reviews Preview**: Customer testimonials
- **AI Chatbot**: Floating chat widget with 5-second delay

### 2. **Package Management**
- **Display**: Dynamic package cards with features
- **Admin CRUD**: Create, edit, delete packages
- **Pricing**: Flexible pricing with hours included
- **Popular Badge**: Highlight recommended packages
- **Payment Integration**: Direct checkout flow

### 3. **Booking System**
- **Multi-step Process**: Package selection → Date/Time → Confirmation
- **Calendar Integration**: FullCalendar for availability
- **Google Calendar Sync**: Automatic event creation
- **Status Management**: pending → confirmed → completed
- **Email Notifications**: Automated confirmations

### 4. **Payment Processing**
- **Primary Method**: PayID (0431512095)
- **Manual Payment Flow**:
  1. Create payment session
  2. Display payment instructions
  3. User completes bank transfer
  4. Admin confirms payment
  5. Quota updated automatically
- **Session Management**: Expiring sessions (24 hours)
- **Payment Tracking**: Reference numbers and status

### 5. **AI Chatbot** (`components/chatbot/AIChatbot.tsx`)
- **Multi-Provider Fallback**: Hyperbolic → OpenRouter → Groq
- **Context-Aware**: Accesses live database data
- **Knowledge Base**: Comprehensive driving school information
- **User Context**: Personalized responses based on bookings
- **Conversation History**: Persistent chat in localStorage
- **Intelligent Fallback**: Rule-based responses if AI fails

### 6. **Admin Dashboard** (`app/admin/page.tsx`)
Comprehensive tabs for management:

#### **Overview Tab**
- Key metrics (total users, bookings, revenue)
- Charts and analytics (Recharts)
- Recent activity feed

#### **Bookings Tab**
- View all bookings with filters
- Update status (confirm, cancel, complete)
- Add notes and manage scheduling
- Email notifications to customers

#### **Users Tab**
- Merged view of Clerk + Supabase users
- Sync status indicators
- Contact information with formatted phone numbers
- User activity history

#### **Packages Tab**
- Create/edit/delete packages
- Set popular badges
- Manage pricing and features

#### **Reviews Tab**
- Approve/reject customer reviews
- Moderate content
- Display on public pages

#### **Calendar Tab**
- Visual booking schedule
- FullCalendar integration
- Drag-and-drop rescheduling

#### **Content Tab**
- Edit site content (text, images, JSON)
- Version control with rollback
- Draft/publish workflow

#### **Theme Tab**
- Real-time theme customization
- Color picker for brand colors
- Preview changes live
- Export/import themes

#### **Maps Tab**
- Service area visualization
- Interactive Leaflet maps
- Booking location markers

#### **SEO Tab**
- Meta tags management
- Structured data (Schema.org)
- Sitemap generation

### 7. **Content Management System**
- **Editable Components**: In-place editing with `EditableText`
- **Drag-and-Drop Builder**: Android-style page editor
- **Component Library**: Reusable UI components
- **Version Control**: Content history and rollback
- **Conflict Resolution**: Concurrent editing support
- **Real-time Sync**: Supabase real-time updates

### 8. **Real-time Features**
- **Presence Indicators**: Show who's online
- **Live Notifications**: Booking updates, new reviews
- **Collaborative Editing**: Multiple admins can edit simultaneously
- **Conflict Detection**: Automatic conflict resolution

---

## 🔄 Application Workflows

### Customer Journey
1. **Discovery**: Browse homepage, view packages
2. **Engagement**: Chat with AI bot for questions
3. **Selection**: Choose driving lesson package
4. **Booking**: Multi-step booking with calendar
5. **Payment**: PayID bank transfer with instructions
6. **Confirmation**: Email confirmation + calendar invite
7. **Service**: Attend driving lessons
8. **Follow-up**: Review reminder emails

### Admin Workflow
1. **Dashboard**: Monitor metrics and activity
2. **Booking Management**: Confirm/reschedule bookings
3. **Payment Confirmation**: Verify manual payments
4. **Customer Communication**: Send updates via email
5. **Content Updates**: Edit site content in real-time
6. **Review Moderation**: Approve testimonials
7. **Analytics**: Track business performance

### Technical Workflow
1. **Request**: Next.js API routes handle requests
2. **Auth**: Clerk middleware validates sessions
3. **Database**: Supabase processes queries
4. **Payment**: Manual payment session creation
5. **Email**: Resend sends transactional emails
6. **AI**: Multi-provider chatbot processing
7. **Monitoring**: Sentry tracks errors

---

## 🛠️ API Endpoints

### Public Endpoints
- `GET /api/packages` - Fetch all packages (cached)
- `POST /api/chatbot` - AI chatbot interactions
- `GET /api/manual-payment?session_id=...` - Get payment details
- `POST /api/manual-payment` - Confirm payment

### Protected Endpoints (Admin)
- `POST /api/packages` - Create package
- `PUT /api/packages/[id]` - Update package
- `DELETE /api/packages/[id]` - Delete package
- `POST /api/send-booking-email` - Send notifications
- `POST /api/send-review-reminder` - Send reminders
- `POST /api/admin/*` - Various admin operations

### GraphQL Endpoint
- `POST /api/graphql` - GraphQL queries and mutations
- Schema includes: Users, Packages, Bookings, Reviews
- DataLoader for optimized queries
- Query complexity limits

---

## 🎨 Design System

### Color Palette
- **Primary**: Yellow (#EDE513FF) - Brand color
- **Secondary**: White with dark text
- **Accent**: Professional tones for CTAs
- **Status Colors**: Success (green), Warning (yellow), Error (red)

### Typography
- **Font Family**: Geist Sans (primary), Geist Mono (code)
- **Headings**: Bold, large sizes with proper hierarchy
- **Body**: Readable 16px base with 1.5 line height

### Components
- **Buttons**: Primary, secondary, outline, ghost variants
- **Cards**: Elevated with shadows, rounded corners
- **Forms**: Labeled inputs with validation states
- **Modals**: Centered dialogs with backdrop
- **Toasts**: Sonner for notifications (top-right)

### Responsive Breakpoints
- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px - 1440px
- **Large**: 1440px+

---

## 🔒 Security Features

### Authentication
- Clerk-based secure authentication
- Email verification required
- Password reset functionality
- Session management with JWT

### Authorization
- Role-based access control (RBAC)
- Permission gates on components
- API route protection with middleware

### Data Protection
- Input validation with Zod schemas
- SQL injection prevention (Supabase parameterized queries)
- XSS protection (React escaping)
- CSRF protection (Next.js built-in)

### Security Headers
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security`
- `Content-Security-Policy`
- `Referrer-Policy`

### Rate Limiting
- API endpoint protection
- Centralized state management
- Request throttling

---

## 📧 Email System

### Resend Integration
- **Booking Confirmations**: Sent on booking creation
- **Status Updates**: Sent when booking status changes
- **Review Reminders**: Sent after lesson completion
- **Admin Notifications**: Sent on new bookings

### Email Templates
- Professional HTML templates
- Responsive design
- Brand colors and logo
- Clear CTAs

---

## 🗺️ Maps & Location

### Leaflet.js Integration
- **Service Area Map**: Display coverage area
- **Admin Map**: Show booking locations
- **Custom Markers**: Branded map pins
- **Interactive**: Zoom, pan, click events

### Geocoding
- Address validation
- Coordinate conversion
- Location autocomplete

---

## 📊 Analytics & Monitoring

### Sentry Integration
- **Error Tracking**: Real-time error reporting
- **Performance Monitoring**: Web Vitals tracking
- **User Context**: Attach user info to errors
- **Source Maps**: Deployed for debugging

### Web Vitals
- **LCP**: Largest Contentful Paint
- **FID**: First Input Delay
- **CLS**: Cumulative Layout Shift
- **TTFB**: Time to First Byte

### Custom Analytics
- Booking conversion rates
- Package popularity
- User engagement metrics
- Revenue tracking

---

## 🧪 Testing & Quality

### Type Safety
- Full TypeScript coverage
- Strict mode enabled
- Type definitions for all APIs

### Code Quality
- ESLint with Next.js config
- Consistent code formatting
- Import organization

### Error Handling
- Error boundaries for React components
- Try-catch in API routes
- Graceful degradation
- User-friendly error messages

---

## 🚀 Deployment

### Vercel (Recommended)
- Automatic deployments from Git
- Preview deployments for PRs
- Environment variables configured
- Edge functions for API routes

### Environment Variables
```
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Providers
HYPERBOLIC_API_KEY=
OPENROUTER_API_KEY=
GROQ_API_KEY=

# Email
RESEND_API_KEY=

# Payment
NEXT_PUBLIC_PAYID_IDENTIFIER=0431512095

# Monitoring
SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# Site
NEXT_PUBLIC_SITE_URL=
```

---

## 🔮 Future Enhancements

### Planned Features
- **Mobile App**: React Native companion
- **Advanced Analytics**: Business intelligence dashboard
- **Multi-language**: i18n support
- **PWA**: Progressive Web App capabilities
- **Voice AI**: Voice-enabled chatbot
- **Automated Testing**: Comprehensive test suite
- **Stripe Integration**: Automated card payments
- **SMS Notifications**: Twilio integration
- **Video Lessons**: Embedded training videos
- **Student Portal**: Progress tracking dashboard

---

## 🔧 Backend Configuration Deep Dive

### Supabase Configuration

#### Client-Side Supabase (`lib/supabase.ts`)
- **Purpose**: Client-side database operations
- **Authentication**: Uses anon key (Row Level Security enforced)
- **Environment Variables**:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Type Definitions**: Includes User, Package, Booking, Review types
- **Database Schema**: Embedded SQL for table creation

#### Server-Side Supabase (`lib/supabase/server.ts`)
- **Purpose**: Server-side operations with cookie management
- **SSR Support**: Uses `@supabase/ssr` for Next.js App Router
- **Cookie Handling**: Automatic cookie get/set/remove for sessions
- **Security**: Handles Server Component limitations gracefully

#### Admin Supabase Client (`lib/api/utils.ts`)
- **Purpose**: Admin operations bypassing RLS
- **Authentication**: Uses service role key
- **Environment Variable**: `SUPABASE_SERVICE_ROLE_KEY`
- **Use Cases**: Admin dashboard, system operations, user creation

### API Architecture

#### Centralized State Management (`lib/api-middleware.ts`)
- **Purpose**: Unified request queue processing
- **Features**:
  - Request prioritization (high, medium, low)
  - Automatic retry logic (configurable max retries)
  - Request timeout handling (30s default)
  - Development mode bypass for easier debugging
- **Usage**: Wraps all API route handlers
- **Metrics**: Tracks total requests, success/failure rates, response times

#### API State Manager (`lib/api-state-manager.ts`)
- **Queue System**: FIFO queue with priority support
- **Concurrency Control**: Prevents race conditions
- **Freeze/Unfreeze**: Emergency API shutdown capability
- **Metrics Collection**:
  - Total requests processed
  - Success/failure counts
  - Average response time
  - Queue length monitoring
  - Last processed timestamp

#### Rate Limiting (`lib/rate-limit.ts`)
- **Payment Endpoints**: 5 requests per 15 minutes per IP
- **Webhook Endpoints**: 100 requests per minute
- **Implementation**: In-memory rate limiter with automatic cleanup
- **Key Generation**: IP-based or signature-based
- **Response Headers**: Includes remaining requests and reset time

### GraphQL Backend

#### Apollo Server Configuration (`lib/graphql/server.ts`)
- **Version**: Apollo Server 4 (2025 best practices)
- **Features**:
  - Query depth limiting (10 in prod, 15 in dev)
  - Query complexity analysis (500 max in prod, 1000 in dev)
  - CSRF prevention
  - Bounded cache
  - WebSocket support for subscriptions
- **Security**:
  - Introspection disabled in production
  - Stack traces hidden in production
  - Rate limiting per operation type
  - Security headers on all responses
- **Monitoring**:
  - Slow query logging (>1s warning, >5s critical)
  - Operation metrics tracking
  - Complexity metrics over time
  - Error categorization by type

#### GraphQL Schema (`lib/graphql/schema.ts`)
- **Scalar Types**: DateTime, JSON, UUID
- **Enums**: ExperienceLevel, ReferralStatus, RewardType, NotificationStatus, BookingStatus, TransactionType
- **Core Types**: User, UserQuota, Package, Referral, ReferralReward, Review, Booking, QuotaTransaction, UserNotification
- **Input Types**: Create/Update inputs for all entities
- **Pagination**: Standardized pagination with limit/offset
- **Filtering**: Search, date range, status filters
- **Subscriptions**: Real-time notifications, booking updates, quota changes

#### GraphQL Resolvers (`lib/graphql/resolvers.ts`)
- **Authentication**: Clerk integration with automatic user provisioning
- **Authorization**: Role-based access control (admin checks)
- **User Sync**: Automatic Clerk → Supabase user creation
- **Queries**:
  - User queries (me, user, users with pagination)
  - Package queries (active packages, all packages)
  - Review queries (approved reviews, all reviews)
  - Booking queries (my bookings, all bookings)
  - Quota queries (my quota, quota stats)
  - Referral queries (my referrals, my rewards)
  - Notification queries (my notifications, unread count)
  - Admin queries (system stats)
- **Mutations**:
  - User mutations (update profile)
  - Package mutations (create, update, delete - admin only)
  - Booking mutations (create, update, cancel)
  - Review mutations (create, approve - admin only)
  - Quota mutations (purchase, consume, refund)
  - Notification mutations (mark read, delete)
- **Subscriptions**:
  - notificationAdded (user-specific)
  - bookingStatusChanged (user-specific)
  - quotaUpdated (user-specific)
- **PubSub**: GraphQL subscriptions for real-time updates

#### DataLoaders (`lib/graphql/dataloaders.ts`)
- **Purpose**: Batch and cache database queries (N+1 problem solution)
- **Loaders**:
  - userLoader (batch load users by ID)
  - quotaLoader (batch load user quotas)
  - packageLoader (batch load packages)
  - reviewLoader (batch load reviews)
  - bookingLoader (batch load bookings)
  - transactionLoader (batch load quota transactions)
  - userBookingsLoader (batch load user's bookings)
  - userTransactionsLoader (batch load user's transactions)
- **Configuration**:
  - Max batch size: 50-100 per loader
  - Caching enabled with Map
  - Custom cache key functions
- **Performance**: Reduces database queries by 10-100x

#### Validators (`lib/graphql/validators.ts`)
- **Zod Schemas**: Type-safe validation for all inputs
- **Validation Functions**:
  - validateCreateUser, validateUpdateUser
  - validateCreatePackage, validateUpdatePackage
  - validateBooking, validateUpdateBooking
  - validateReview
  - validateQuotaTransaction
  - validatePagination, validateFilter
- **Business Logic Validators**:
  - validateBookingConflict (check time slot availability)
  - validateQuotaAvailability (check sufficient hours)
  - validateInvitationCode (check code validity)
  - validateRateLimit (check rate limit compliance)
- **Error Handling**: Returns structured ValidationResult with errors array

### Content Management System

#### Content Loading (`lib/content.ts`)
- **Server-Side**: `getPageContent(pageName)` fetches from API
- **Client-Side**: `ContentService` singleton for admin operations
- **Content Types**: text, json, file
- **Helper Functions**:
  - `getContentValue()` - Get text with fallback
  - `getContentJson()` - Get JSON with fallback
  - `getContentFile()` - Get file URL with alt text
  - `getImageData()` - Get image data with fallbacks
  - `validateGalleryImages()` - Validate image arrays
- **Fallback System**: Graceful degradation if DB unavailable
- **Version Control**: Content history and rollback support
- **Operations**:
  - updateContent (PUT)
  - createContent (POST)
  - deleteContent (DELETE)
  - uploadImage (POST with FormData)

### Database Migrations

#### Scheduling Constraints (`lib/database/migrations/001_scheduling_constraints.sql`)
- **Tables Created**:
  - `scheduling_constraints` - Instructor breaks, holidays, unavailability
  - `booking_rules` - System-wide booking rules (min/max advance, duration, buffer)
  - `working_hours` - Instructor working hours by day of week
- **Features**:
  - Recurring constraints support (daily, weekly, monthly)
  - Time range validation
  - Row Level Security (RLS) policies
  - Automatic updated_at triggers
- **Functions**:
  - `check_time_slot_availability()` - Comprehensive availability check
  - Validates working hours, constraints, existing bookings, and rules
- **Default Rules**:
  - Min advance booking: 60 minutes
  - Max advance booking: 1 week
  - Min lesson duration: 30 minutes
  - Max lesson duration: 4 hours
  - Buffer time: 15 minutes

### API Routes Deep Dive

#### Packages API (`app/api/packages/route.ts`)
- **GET**: Fetch all packages with 5-minute cache
- **POST**: Create new package (admin only - temporarily disabled for testing)
- **Caching**: In-memory cache with TTL
- **Validation**: Enhanced validation for price, hours, features
- **Error Handling**: Graceful handling of missing tables
- **State Management**: Uses centralized middleware

#### Chatbot API (`app/api/chatbot/route.ts`)
- **AI Providers**: Multi-provider fallback system
  1. Hyperbolic (Llama-3.2-3B-Instruct)
  2. OpenRouter (Llama-3.2-3B-Instruct Free)
  3. Groq (Llama-3.1-8B-Instant)
- **Context**: Comprehensive driving school knowledge base
- **User Context**: Personalized responses based on bookings
- **Live Data**: Accesses packages, reviews, bookings from database
- **Fallback**: Intelligent rule-based responses if all AI fails
- **Knowledge Base**: Packages, services, areas, contact, policies
- **Response Limit**: 250 words max

#### Manual Payment API (`app/api/manual-payment/route.ts`)
- **GET**: Fetch payment session details
- **POST**: Confirm payment with reference number
- **Session Management**: 24-hour expiration
- **Payment Gateway**: PayID (0431512095)
- **Quota Update**: Automatic quota addition on confirmation
- **Security**: Session validation and expiration checks

#### Quota API (`app/api/quota/route.ts`)
- **GET**: Fetch user's current quota
- **POST**: Add hours to quota (package purchases)
- **Transaction Types**: purchase, refund, adjustment, free_credit
- **Transaction Logging**: All quota changes logged
- **User Provisioning**: Automatic user creation if not exists
- **Calculations**: Remaining hours = total - used

#### User Initialization API (`app/api/init-user/route.ts`)
- **Purpose**: Sync Clerk users to Supabase
- **Trigger**: Called on first user action
- **Data Sync**: Email, full name, phone from Clerk
- **Idempotent**: Safe to call multiple times
- **Error Handling**: Detailed error messages for debugging

### Webhook Configuration

#### Clerk Webhooks (`app/api/webhooks/clerk/`)
- **Events**: user.created, user.updated, user.deleted
- **Purpose**: Keep Supabase in sync with Clerk
- **Verification**: Webhook signature validation
- **Operations**: Create/update/delete users in Supabase

### Error Handling & Monitoring

#### API Error Handling (`lib/api/utils.ts`)
- **APIError Class**: Custom error with status codes
- **Error Types**: Validation, Authentication, Server errors
- **Response Helpers**:
  - `successResponse()` - Standardized success format
  - `errorResponse()` - Standardized error format
- **Zod Integration**: Automatic validation error formatting
- **Logging**: Console errors with context

#### Health Checks
- **GraphQL Health**: `healthCheck()` function checks DB connection
- **API Health**: Centralized health check endpoint
- **Metrics**: Memory usage, uptime, request counts
- **Status**: healthy/unhealthy with detailed diagnostics

### Security Impion

#### Authentication Flow
1. User signs in via Clerk
2. Clerk middleware validates session
3. API routes extract userId from Clerk
rk_id
5. Operations performed with ntext

#### Authorization Layers
1. **Clerk Middleware**: Route-level protection
2. **API Route Auth**: `requireAuth()` helper
3. **GraphQL Resolvers**: `getAuthentick
ions
5. **RLS Policies**: Databasety

#### Input Validation
- **Zod Schemas**: All inputs validated
- **Sanitization**: Content sanitization for XSSention
- **Type Safety**: TypeScript strict mode



- **Payment Endpoints**: St
0/min)
- **GraphQL**:ing
- **Webhooks**: High limits0/min)

---

oteslopment N📝 Deve## 10 ( rate limitation Per-oper limits (10 Moderatel API**:- **Genera5/15min)ict limits (rrategyimiting St Rate L####abase via Superiesed quameteriz: Parion****SQL Inject-  prevw securi-level roerat opr adminAdmin()` fo `require**:hecksmin C*Ad4. *er()` checatedUsuser cocle via pabase user Suapped to4. User mlementat

### Key Patterns
- **Server Components**: Default for data fetching
- **Client Components**: For interactivity (`'use client'`)
- **API Routes**: Serverless functions in `app/api/`
- **Middleware**: Authentication and security
- **Context Providers**: Global state management

### Performance Optimizations
- **Image Optimization**: Next.js Image component
- **Code Splitting**: Automatic route-based splitting
- **Caching**: API response caching (5 min TTL)
- **Lazy Loading**: Components and images
- **Bundle Optimization**: Tree shaking

### Common Issues & Solutions
1. **User Not Found**: Automatic Clerk-Supabase sync
2. **Payment Confirmation**: Manual admin verification
3. **Concurrent Edits**: Conflict resolution system
4. **AI Fallback**: Multiple provider redundancy
5. **Rate Limiting**: Centralized state management

---

## 📞 Support & Maintenance

### Monitoring
- Sentry for error tracking
- Supabase dashboard for database
- Clerk dashboard for auth
- Vercel analytics for performance

### Logging
- Console logs in development
- Structured logging in production
- Error context with Sentry

### Backup & Recovery
- Supabase automatic backups
- Content version history
- Database migration scripts

---

## 🎯 Business Context

### Target Market
- **Location**: Brisbane, Australia
- **Audience**: Learner drivers (16-25 primary, all ages)
- **Service**: Professional driving instruction
- **Differentiator**: AI support, flexible booking, professional instructors

### Value Proposition
- Structured learning progression
- Professional dual-control vehicles
- Higher test pass rates (85% vs 60%)
- Flexible scheduling
- Comprehensive packages
- Excellent customer support

### Revenue Model
- Package sales (Starter, Standard, Premium)
- Additional lesson hours
- Test preparation services
- Refresher courses

---

## 📚 Key Files Reference

### Configuration
- `next.config.ts` - Next.js configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `middleware.ts` - Clerk authentication middleware

### Core Application
- `app/layout.tsx` - Root layout with providers
- `app/page.tsx` - Homepage
- `app/admin/page.tsx` - Admin dashboard
- `lib/types.ts` - TypeScript type definitions
- `lib/supabase.ts` - Supabase client

### Key Components
- `components/chatbot/AIChatbot.tsx` - AI chatbot
- `components/home/*` - Homepage sections
- `components/admin/*` - Admin dashboard components
- `components/ui/*` - Base UI components

### API Routes
- `app/api/packages/route.ts` - Package CRUD
- `app/api/chatbot/route.ts` - AI chatbot endpoint
- `app/api/manual-payment/route.ts` - Payment processing

---

This context document provides a comprehensive overview of the EG Driving School application architecture, features, and implementation details. Use it as a reference for understanding the codebase, making changes, or onboarding new developers.


---

## 🔧 Backend Configuration Deep Dive

### Supabase Configuration

#### Client-Side Supabase (`lib/supabase.ts`)
- **Purpose**: Client-side database operations
- **Authentication**: Uses anon key (Row Level Security enforced)
- **Environment Variables**:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Type Definitions**: Includes User, Package, Booking, Review types
- **Database Schema**: Embedded SQL for table creation

#### Server-Side Supabase (`lib/supabase/server.ts`)
- **Purpose**: Server-side operations with cookie management
- **SSR Support**: Uses `@supabase/ssr` for Next.js App Router
- **Cookie Handling**: Automatic cookie get/set/remove for sessions
- **Security**: Handles Server Component limitations gracefully

#### Admin Supabase Client (`lib/api/utils.ts`)
- **Purpose**: Admin operations bypassing RLS
- **Authentication**: Uses service role key
- **Environment Variable**: `SUPABASE_SERVICE_ROLE_KEY`
- **Use Cases**: Admin dashboard, system operations, user creation

### API Architecture

#### Centralized State Management (`lib/api-middleware.ts`)
- **Purpose**: Unified request queue processing
- **Features**:
  - Request prioritization (high, medium, low)
  - Automatic retry logic (configurable max retries)
  - Request timeout handling (30s default)
  - Development mode bypass for easier debugging
- **Usage**: Wraps all API route handlers
- **Metrics**: Tracks total requests, success/failure rates, response times

#### API State Manager (`lib/api-state-manager.ts`)
- **Queue System**: FIFO queue with priority support
- **Concurrency Control**: Prevents race conditions
- **Freeze/Unfreeze**: Emergency API shutdown capability
- **Metrics Collection**:
  - Total requests processed
  - Success/failure counts
  - Average response time
  - Queue length monitoring
  - Last processed timestamp

#### Rate Limiting (`lib/rate-limit.ts`)
- **Payment Endpoints**: 5 requests per 15 minutes per IP
- **Webhook Endpoints**: 100 requests per minute
- **Implementation**: In-memory rate limiter with automatic cleanup
- **Key Generation**: IP-based or signature-based
- **Response Headers**: Includes remaining requests and reset time

### GraphQL Backend

#### Apollo Server Configuration (`lib/graphql/server.ts`)
- **Version**: Apollo Server 4 (2025 best practices)
- **Features**:
  - Query depth limiting (10 in prod, 15 in dev)
  - Query complexity analysis (500 max in prod, 1000 in dev)
  - CSRF prevention
  - Bounded cache
  - WebSocket support for subscriptions
- **Security**:
  - Introspection disabled in production
  - Stack traces hidden in production
  - Rate limiting per operation type
  - Security headers on all responses
- **Monitoring**:
  - Slow query logging (>1s warning, >5s critical)
  - Operation metrics tracking
  - Complexity metrics over time
  - Error categorization by type

#### GraphQL Schema (`lib/graphql/schema.ts`)
- **Scalar Types**: DateTime, JSON, UUID
- **Enums**: ExperienceLevel, ReferralStatus, RewardType, NotificationStatus, BookingStatus, TransactionType
- **Core Types**: User, UserQuota, Package, Referral, ReferralReward, Review, Booking, QuotaTransaction, UserNotification
- **Input Types**: Create/Update inputs for all entities
- **Pagination**: Standardized pagination with limit/offset
- **Filtering**: Search, date range, status filters
- **Subscriptions**: Real-time notifications, booking updates, quota changes

#### GraphQL Resolvers (`lib/graphql/resolvers.ts`)
- **Authentication**: Clerk integration with automatic user provisioning
- **Authorization**: Role-based access control (admin checks)
- **User Sync**: Automatic Clerk → Supabase user creation
- **Queries**:
  - User queries (me, user, users with pagination)
  - Package queries (active packages, all packages)
  - Review queries (approved reviews, all reviews)
  - Booking queries (my bookings, all bookings)
  - Quota queries (my quota, quota stats)
  - Referral queries (my referrals, my rewards)
  - Notification queries (my notifications, unread count)
  - Admin queries (system stats)
- **Mutations**:
  - User mutations (update profile)
  - Package mutations (create, update, delete - admin only)
  - Booking mutations (create, update, cancel)
  - Review mutations (create, approve - admin only)
  - Quota mutations (purchase, consume, refund)
  - Notification mutations (mark read, delete)
- **Subscriptions**:
  - notificationAdded (user-specific)
  - bookingStatusChanged (user-specific)
  - quotaUpdated (user-specific)
- **PubSub**: GraphQL subscriptions for real-time updates

#### DataLoaders (`lib/graphql/dataloaders.ts`)
- **Purpose**: Batch and cache database queries (N+1 problem solution)
- **Loaders**:
  - userLoader (batch load users by ID)
  - quotaLoader (batch load user quotas)
  - packageLoader (batch load packages)
  - reviewLoader (batch load reviews)
  - bookingLoader (batch load bookings)
  - transactionLoader (batch load quota transactions)
  - userBookingsLoader (batch load user's bookings)
  - userTransactionsLoader (batch load user's transactions)
- **Configuration**:
  - Max batch size: 50-100 per loader
  - Caching enabled with Map
  - Custom cache key functions
- **Performance**: Reduces database queries by 10-100x

#### Validators (`lib/graphql/validators.ts`)
- **Zod Schemas**: Type-safe validation for all inputs
- **Validation Functions**:
  - validateCreateUser, validateUpdateUser
  - validateCreatePackage, validateUpdatePackage
  - validateBooking, validateUpdateBooking
  - validateReview
  - validateQuotaTransaction
  - validatePagination, validateFilter
- **Business Logic Validators**:
  - validateBookingConflict (check time slot availability)
  - validateQuotaAvailability (check sufficient hours)
  - validateInvitationCode (check code validity)
  - validateRateLimit (check rate limit compliance)
- **Error Handling**: Returns structured ValidationResult with errors array

### Content Management System

#### Content Loading (`lib/content.ts`)
- **Server-Side**: `getPageContent(pageName)` fetches from API
- **Client-Side**: `ContentService` singleton for admin operations
- **Content Types**: text, json, file
- **Helper Functions**:
  - `getContentValue()` - Get text with fallback
  - `getContentJson()` - Get JSON with fallback
  - `getContentFile()` - Get file URL with alt text
  - `getImageData()` - Get image data with fallbacks
  - `validateGalleryImages()` - Validate image arrays
- **Fallback System**: Graceful degradation if DB unavailable
- **Version Control**: Content history and rollback support
- **Operations**:
  - updateContent (PUT)
  - createContent (POST)
  - deleteContent (DELETE)
  - uploadImage (POST with FormData)

### Database Migrations

#### Scheduling Constraints (`lib/database/migrations/001_scheduling_constraints.sql`)
- **Tables Created**:
  - `scheduling_constraints` - Instructor breaks, holidays, unavailability
  - `booking_rules` - System-wide booking rules (min/max advance, duration, buffer)
  - `working_hours` - Instructor working hours by day of week
- **Features**:
  - Recurring constraints support (daily, weekly, monthly)
  - Time range validation
  - Row Level Security (RLS) policies
  - Automatic updated_at triggers
- **Functions**:
  - `check_time_slot_availability()` - Comprehensive availability check
  - Validates working hours, constraints, existing bookings, and rules
- **Default Rules**:
  - Min advance booking: 60 minutes
  - Max advance booking: 1 week
  - Min lesson duration: 30 minutes
  - Max lesson duration: 4 hours
  - Buffer time: 15 minutes

### API Routes Deep Dive

#### Packages API (`app/api/packages/route.ts`)
- **GET**: Fetch all packages with 5-minute cache
- **POST**: Create new package (admin only - temporarily disabled for testing)
- **Caching**: In-memory cache with TTL
- **Validation**: Enhanced validation for price, hours, features
- **Error Handling**: Graceful handling of missing tables
- **State Management**: Uses centralized middleware

#### Chatbot API (`app/api/chatbot/route.ts`)
- **AI Providers**: Multi-provider fallback system
  1. Hyperbolic (Llama-3.2-3B-Instruct)
  2. OpenRouter (Llama-3.2-3B-Instruct Free)
  3. Groq (Llama-3.1-8B-Instant)
- **Context**: Comprehensive driving school knowledge base
- **User Context**: Personalized responses based on bookings
- **Live Data**: Accesses packages, reviews, bookings from database
- **Fallback**: Intelligent rule-based responses if all AI fails
- **Knowledge Base**: Packages, services, areas, contact, policies
- **Response Limit**: 250 words max

#### Manual Payment API (`app/api/manual-payment/route.ts`)
- **GET**: Fetch payment session details
- **POST**: Confirm payment with reference number
- **Session Management**: 24-hour expiration
- **Payment Gateway**: PayID (0431512095)
- **Quota Update**: Automatic quota addition on confirmation
- **Security**: Session validation and expiration checks

#### Quota API (`app/api/quota/route.ts`)
- **GET**: Fetch user's current quota
- **POST**: Add hours to quota (package purchases)
- **Transaction Types**: purchase, refund, adjustment, free_credit
- **Transaction Logging**: All quota changes logged
- **User Provisioning**: Automatic user creation if not exists
- **Calculations**: Remaining hours = total - used

#### User Initialization API (`app/api/init-user/route.ts`)
- **Purpose**: Sync Clerk users to Supabase
- **Trigger**: Called on first user action
- **Data Sync**: Email, full name, phone from Clerk
- **Idempotent**: Safe to call multiple times
- **Error Handling**: Detailed error messages for debugging

### Webhook Configuration

#### Clerk Webhooks (`app/api/webhooks/clerk/`)
- **Events**: user.created, user.updated, user.deleted
- **Purpose**: Keep Supabase in sync with Clerk
- **Verification**: Webhook signature validation
- **Operations**: Create/update/delete users in Supabase

### Error Handling & Monitoring

#### API Error Handling (`lib/api/utils.ts`)
- **APIError Class**: Custom error with status codes
- **Error Types**: Validation, Authentication, Server errors
- **Response Helpers**:
  - `successResponse()` - Standardized success format
  - `errorResponse()` - Standardized error format
- **Zod Integration**: Automatic validation error formatting
- **Logging**: Console errors with context

#### Health Checks
- **GraphQL Health**: `healthCheck()` function checks DB connection
- **API Health**: Centralized health check endpoint
- **Metrics**: Memory usage, uptime, request counts
- **Status**: healthy/unhealthy with detailed diagnostics

### Security Implementation

#### Authentication Flow
1. User signs in via Clerk
2. Clerk middleware validates session
3. API routes extract userId from Clerk
4. User mapped to Supabase user via clerk_id
5. Operations performed with user context

#### Authorization Layers
1. **Clerk Middleware**: Route-level protection
2. **API Route Auth**: `requireAuth()` helper
3. **GraphQL Resolvers**: `getAuthenticatedUser()` check
4. **Admin Checks**: `requireAdmin()` for admin operations
5. **RLS Policies**: Database-level row security

#### Input Validation
- **Zod Schemas**: All inputs validated
- **Sanitization**: Content sanitization for XSS prevention
- **Type Safety**: TypeScript strict mode
- **SQL Injection**: Parameterized queries via Supabase

#### Rate Limiting Strategy
- **Payment Endpoints**: Strict limits (5/15min)
- **General API**: Moderate limits (100/min)
- **GraphQL**: Per-operation rate limiting
- **Webhooks**: High limits (100/min)

### Performance Optimizations

#### Caching Strategy
- **API Response Caching**: 5-minute TTL for packages
- **GraphQL DataLoader**: Batch and cache database queries
- **In-Memory Cache**: Rate limiter and request tracking
- **Browser Caching**: Static assets with long cache headers

#### Database Optimization
- **Indexes**: Strategic indexes on frequently queried columns
- **DataLoaders**: Prevent N+1 query problems
- **Pagination**: Limit/offset pagination for large datasets
- **Connection Pooling**: Supabase handles connection pooling

#### Query Optimization
- **GraphQL Complexity**: Prevents expensive queries
- **Depth Limiting**: Prevents deeply nested queries
- **Field Selection**: Only fetch requested fields
- **Batch Operations**: DataLoader batches multiple queries

---

## 🎯 Backend Best Practices Implemented

### 2025 Modern Patterns
- **Server Components**: Default for data fetching
- **API Routes**: Serverless functions with edge runtime support
- **Type Safety**: Full TypeScript coverage with strict mode
- **Error Boundaries**: Graceful error handling at all levels
- **Validation**: Zod schemas for runtime type checking
- **Security Headers**: CSP, HSTS, X-Frame-Options, etc.

### Scalability Considerations
- **Stateless API**: No server-side session storage
- **Horizontal Scaling**: Serverless functions scale automatically
- **Database Pooling**: Supabase manages connections
- **Caching**: Multiple caching layers reduce load
- **Rate Limiting**: Prevents abuse and ensures fair usage

### Monitoring & Observability
- **Sentry Integration**: Error tracking and performance monitoring
- **Custom Metrics**: API metrics, GraphQL metrics, complexity tracking
- **Logging**: Structured logging with context
- **Health Checks**: Automated health monitoring
- **Slow Query Detection**: Automatic logging of slow operations

---

This comprehensive backend configuration ensures the EG Driving School application is secure, performant, scalable, and maintainable. All backend operations follow modern best practices and are designed for production deployment.
