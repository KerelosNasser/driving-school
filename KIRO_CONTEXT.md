# 🚗 EG Driving School - Complete Application Context for Kiro AI

> **Last Updated**: 2025-01-06  
> **Version**: 2.0  
> **Purpose**: Comprehensive reference for AI-assisted development

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Database Schema](#database-schema)
5. [API Routes](#api-routes)
6. [Components](#components)
7. [Hooks & Contexts](#hooks--contexts)
8. [Backend Services](#backend-services)
9. [Security & Authentication](#security--authentication)
10. [Real-time Features](#real-time-features)
11. [Testing & Quality](#testing--quality)
12. [Deployment](#deployment)
13. [Development Workflows](#development-workflows)

---

## 🎯 Project Overview

**EG Driving School** is a comprehensive, full-stack web application for managing a professional driving school business in Brisbane, Australia.

### Core Purpose
- Streamline driving school operations
- Provide exceptional user experience for students
- Enable efficient administrative management
- Automate booking, payment, and communication workflows
- Deliver AI-powered customer support

### Key Statistics
- **Lines of Code**: ~50,000+
- **Components**: 100+
- **API Endpoints**: 40+
- **Database Tables**: 20+
- **Third-Party Integrations**: 8+

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 15.5.3 (App Router with React Server Components)
- **React**: 19.1.0 with modern hooks and patterns
- **TypeScript**: 5.x with strict mode enabled
- **Styling**: Tailwind CSS 4.0 with custom design system
- **UI Components**: shadcn/ui built on Radix UI primitives
- **Animations**: Framer Motion 12.23.12
- **Icons**: Lucide React 0.536.0
- **State Management**: React Context API + React Query

### Backend
- **Runtime**: Next.js API Routes (serverless functions)
- **Database**: Supabase (PostgreSQL) with real-time capabilities
- **Authentication**: Clerk 6.30.1 for secure user management
- **GraphQL**: Apollo Server 4.10.4 with custom resolvers
- **ORM**: Supabase client with type-safe queries

### Third-Party Services
- **Payments**: PayID (primary manual payment method)
- **Email**: Resend 6.0.1 for transactional emails
- **Maps**: Leaflet.js 1.9.4 + React Leaflet 5.0.0
- **AI**: Multiple providers (Hyperbolic, OpenRouter, Groq)
- **Calendar**: FullCalendar 6.1.18 for scheduling
- **Monitoring**: Sentry 10.3.0 for error tracking
- **Forms**: Google Forms integration

### Development Tools
- **Build Tool**: Next.js with Turbopack
- **Linting**: ESLint 9 with Next.js configuration
- **Testing**: Jest 29.7.0 + Playwright 1.56.1
- **Type Checking**: TypeScript strict mode
- **Package Manager**: npm with lock file

---


## 🏗️ Architecture

### Application Structure

```
driving-school/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   │   ├── sign-in/              # Sign-in page
│   │   ├── sign-up/              # Sign-up page
│   │   └── complete-profile/     # Post-signup profile completion
│   ├── admin/                    # Admin dashboard
│   │   ├── components/           # Admin-specific components
│   │   ├── navigation/           # Navigation management
│   │   └── page.tsx              # Main admin dashboard
│   ├── api/                      # API routes (40+ endpoints)
│   │   ├── admin/                # Admin operations
│   │   ├── calendar/             # Calendar integration
│   │   ├── chatbot/              # AI chatbot
│   │   ├── components/           # Component management
│   │   ├── content/              # Content management
│   │   ├── graphql/              # GraphQL endpoint
│   │   ├── manual-payment/       # Payment processing
│   │   ├── packages/             # Package CRUD
│   │   ├── quota/                # Quota management
│   │   ├── reviews/              # Review system
│   │   └── webhooks/             # Webhook handlers
│   ├── packages/                 # Package listing page
│   ├── reviews/                  # Reviews page
│   ├── contact/                  # Contact page
│   ├── manual-payment/           # Payment processing page
│   └── page.tsx                  # Homepage
│
├── components/                   # Reusable React components (100+)
│   ├── admin/                    # Admin dashboard components (20+)
│   ├── booking/                  # Booking system
│   ├── chatbot/                  # AI chatbot UI
│   ├── drag-drop/                # Drag-and-drop page builder (15+)
│   ├── home/                     # Homepage sections (8+)
│   ├── maps/                     # Leaflet map components
│   ├── payment/                  # Payment UI
│   ├── ui/                       # shadcn/ui base components (40+)
│   └── ...                       # Other component categories
│
├── lib/                          # Utility libraries and services
│   ├── api/                      # API utilities
│   ├── calendar/                 # Calendar service
│   ├── components/               # Component registry
│   ├── conflict-resolution/      # Concurrent editing
│   ├── database/                 # Database utilities
│   ├── drag-drop/                # Drag-and-drop system
│   ├── graphql/                  # GraphQL (schema, resolvers, dataloaders)
│   ├── navigation/               # Navigation management
│   ├── permissions/              # RBAC system
│   ├── realtime/                 # Real-time features
│   ├── theme/                    # Theme management
│   ├── validation/               # Input validation
│   ├── supabase.ts               # Supabase client
│   ├── types.ts                  # TypeScript types
│   └── utils.ts                  # Utility functions
│
├── contexts/                     # React Context providers
│   ├── editModeContext.tsx       # Edit mode & real-time collaboration
│   ├── globalContentContext.tsx  # Global content management
│   └── ThemeContext.tsx          # Theme customization
│
├── hooks/                        # Custom React hooks
│   ├── useBookings.ts            # Booking management
│   ├── useNavigationManager.ts   # Navigation CRUD
│   ├── usePages.ts               # Page management
│   ├── useProfileCompletion.ts   # Profile completion check
│   └── useRealTimeNotifications.ts # Real-time notifications
│
├── sql/                          # Database schema and migrations
│   └── create_calendar_tables.sql
│
├── public/                       # Static assets
│   └── leaflet/                  # Map assets
│
└── Configuration Files
    ├── next.config.ts            # Next.js configuration
    ├── tsconfig.json             # TypeScript configuration
    ├── eslint.config.mjs         # ESLint configuration
    ├── jest.config.js            # Jest testing configuration
    ├── playwright.config.ts      # Playwright E2E testing
    ├── middleware.ts             # Clerk authentication middleware
    ├── instrumentation.ts        # Sentry instrumentation
    └── components.json           # shadcn/ui configuration
```

### Key Architectural Patterns

#### 1. **Server Components First**
- Default to React Server Components for data fetching
- Use Client Components only when interactivity is needed
- Marked with `'use client'` directive

#### 2. **API Route Organization**
- RESTful endpoints for CRUD operations
- GraphQL endpoint for complex queries
- Webhook handlers for third-party integrations
- Centralized middleware for all routes

#### 3. **State Management**
- React Context for global state (EditMode, Theme, GlobalContent)
- React Query for server state management
- Local state with useState/useReducer for component state

#### 4. **Type Safety**
- Full TypeScript coverage with strict mode
- Shared types in `lib/types.ts`
- Zod schemas for runtime validation

#### 5. **Real-time Architecture**
- Supabase real-time subscriptions
- Custom event router for component communication
- Presence tracking for collaborative editing
- Conflict resolution system

---


## 🗄️ Database Schema

### Core Tables

#### **users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  clerk_id TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('student', 'instructor', 'admin')),
  address TEXT,
  suburb TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  experience_level TEXT CHECK (experience_level IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED')),
  goals TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  invitation_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose**: Store user information synced from Clerk  
**Key Fields**:
- `clerk_id`: Links to Clerk authentication
- `role`: Determines permissions (student, instructor, admin)
- `latitude/longitude`: For service area mapping

#### **packages**
```sql
CREATE TABLE packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  hours INTEGER NOT NULL,
  features JSONB NOT NULL,
  popular BOOLEAN DEFAULT FALSE,
  payment_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose**: Driving lesson packages  
**Key Fields**:
- `features`: JSONB array of package features
- `popular`: Highlight recommended packages
- `payment_id`: Optional PayID for direct payment

#### **bookings**
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  package_id UUID REFERENCES packages(id) ON DELETE SET NULL,
  instructor_id UUID REFERENCES users(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT NOT NULL,
  lesson_hours DECIMAL(4, 2) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'rejected')),
  payment_id TEXT,
  notes TEXT,
  google_calendar_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose**: Lesson bookings  
**Key Fields**:
- `status`: Booking lifecycle management
- `google_calendar_event_id`: Google Calendar integration
- `lesson_hours`: Hours consumed from quota

#### **reviews**
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  approved BOOLEAN DEFAULT FALSE,
  user_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose**: Customer testimonials  
**Key Fields**:
- `approved`: Admin moderation required
- `rating`: 1-5 star rating

#### **manual_payment_sessions**
```sql
CREATE TABLE manual_payment_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  package_id UUID REFERENCES packages(id),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'AUD',
  gateway TEXT CHECK (gateway IN ('payid', 'tyro', 'bpay')),
  status TEXT CHECK (status IN ('pending', 'completed', 'expired')),
  payment_reference TEXT,
  metadata JSONB,
  expires_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose**: Manual payment tracking (PayID, BPAY, Tyro)  
**Key Fields**:
- `session_id`: Unique session identifier
- `gateway`: Payment method used
- `expires_at`: 24-hour expiration

#### **user_quotas**
```sql
CREATE TABLE user_quotas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  total_hours DECIMAL(6, 2) DEFAULT 0,
  used_hours DECIMAL(6, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose**: Track lesson hours purchased and used  
**Calculated Field**: `remaining_hours = total_hours - used_hours`

#### **quota_transactions**
```sql
CREATE TABLE quota_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  transaction_type TEXT CHECK (transaction_type IN ('purchase', 'consumption', 'refund', 'bonus')),
  hours_change DECIMAL(6, 2) NOT NULL,
  amount_paid DECIMAL(10, 2),
  description TEXT,
  package_id UUID REFERENCES packages(id),
  payment_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose**: Audit log for all quota changes  
**Key Fields**:
- `transaction_type`: Type of quota change
- `hours_change`: Positive for additions, negative for consumption

#### **site_content**
```sql
CREATE TABLE site_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_name TEXT NOT NULL,
  content_key TEXT NOT NULL,
  content_type TEXT CHECK (content_type IN ('text', 'image', 'json', 'boolean')),
  content_value TEXT,
  content_json JSONB,
  file_path TEXT,
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  file_type TEXT,
  alt_text TEXT,
  title TEXT,
  description TEXT,
  page_section TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  is_draft BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(page_name, content_key)
);
```

**Purpose**: CMS for editable page content  
**Key Fields**:
- `content_type`: Determines how to render content
- `content_json`: For structured data (arrays, objects)
- `is_draft`: Draft/publish workflow

#### **content_versions**
```sql
CREATE TABLE content_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_name TEXT NOT NULL,
  content_key TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  content_value TEXT,
  content_json JSONB,
  changed_by UUID REFERENCES users(id),
  change_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose**: Version history for content rollback  
**Key Fields**:
- `version_number`: Incremental version tracking
- `changed_by`: User who made the change

### Additional Tables

- **referrals**: Referral program tracking
- **referral_rewards**: Reward distribution
- **invitation_codes**: Invitation code management
- **user_notifications**: In-app notifications
- **navigation_items**: Dynamic navigation menu
- **pages**: Custom page management
- **component_templates**: Reusable component templates
- **scheduling_constraints**: Instructor availability
- **booking_rules**: System-wide booking rules
- **working_hours**: Instructor working hours

### Database Functions

#### **update_user_quota**
```sql
CREATE OR REPLACE FUNCTION update_user_quota(
  p_user_id UUID,
  p_hours_change DECIMAL,
  p_transaction_type TEXT,
  p_description TEXT,
  p_package_id UUID DEFAULT NULL,
  p_payment_id TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  -- Insert transaction
  INSERT INTO quota_transactions (
    user_id, transaction_type, hours_change, 
    description, package_id, payment_id
  ) VALUES (
    p_user_id, p_transaction_type, p_hours_change,
    p_description, p_package_id, p_payment_id
  );
  
  -- Update quota
  INSERT INTO user_quotas (user_id, total_hours, used_hours)
  VALUES (p_user_id, 
    CASE WHEN p_transaction_type = 'purchase' THEN p_hours_change ELSE 0 END,
    CASE WHEN p_transaction_type = 'consumption' THEN p_hours_change ELSE 0 END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_hours = user_quotas.total_hours + 
      CASE WHEN p_transaction_type = 'purchase' THEN p_hours_change ELSE 0 END,
    used_hours = user_quotas.used_hours + 
      CASE WHEN p_transaction_type = 'consumption' THEN p_hours_change ELSE 0 END,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
```

#### **check_time_slot_availability**
```sql
CREATE OR REPLACE FUNCTION check_time_slot_availability(
  p_instructor_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_exclude_booking_id UUID DEFAULT NULL
) RETURNS TABLE(available BOOLEAN, conflicts TEXT[]) AS $$
-- Checks working hours, constraints, existing bookings, and rules
-- Returns availability status and list of conflicts
$$;
```

### Row Level Security (RLS)

All tables have RLS policies:
- **Users**: Can read own data, admins can read all
- **Bookings**: Users see own bookings, admins see all
- **Reviews**: Public can read approved, admins can moderate
- **Packages**: Public can read active, admins can manage
- **Content**: Public can read active, admins can edit

---


## 🔌 API Routes (40+ Endpoints)

### Public Endpoints
- `GET /api/packages` - Fetch all packages (cached 5min)
- `POST /api/chatbot` - AI chatbot interactions
- `GET /api/manual-payment?session_id=...` - Get payment details
- `POST /api/reviews` - Submit review
- `GET /api/health` - Health check

### Protected Endpoints (Require Authentication)
- `POST /api/init-user` - Initialize user in Supabase
- `GET /api/quota` - Get user's quota
- `POST /api/quota` - Add hours to quota
- `POST /api/manual-payment` - Confirm payment
- `GET /api/check-profile-completion` - Check profile status

### Admin Endpoints (Require Admin Role)
- `POST /api/packages` - Create package
- `PUT /api/packages/[id]` - Update package
- `DELETE /api/packages/[id]` - Delete package
- `PUT /api/reviews/[id]` - Approve/reject review
- `POST /api/send-booking-email` - Send notifications
- `GET /api/admin/content` - Get CMS content
- `PUT /api/admin/content` - Update CMS content
- `POST /api/admin/pages` - Create page
- `POST /api/admin/theme` - Update theme

### GraphQL Endpoint
- `POST /api/graphql` - GraphQL queries and mutations
  - Queries: users, packages, bookings, reviews, quotas, referrals
  - Mutations: CRUD operations for all entities
  - Subscriptions: Real-time updates

### Calendar Integration
- `POST /api/calendar/connect` - Connect Google Calendar
- `GET /api/calendar/events` - Fetch events
- `POST /api/calendar/book` - Create booking with calendar event
- `DELETE /api/calendar/cancel` - Cancel booking and event

### Webhook Endpoints
- `POST /api/webhooks/clerk` - Clerk user sync
- `POST /api/webhooks/stripe` - Stripe payment events (if enabled)

---

## 🎨 Components (100+)

### Homepage Components (`components/home/`)
- **Hero**: Main hero section with CTA
- **Features**: 8 feature highlights
- **PackagesPreview**: Top 3 packages
- **Gallery**: Image showcase
- **InstructorBio**: Instructor profile
- **ServiceAreaMap**: Leaflet map
- **ReviewsPreview**: Customer testimonials

### Admin Components (`components/admin/`)
- **AdminDashboardClient**: Main dashboard container
- **OverviewTab**: Metrics and charts
- **BookingsTab**: Booking management
- **UsersTab**: User management
- **PackagesTab**: Package CRUD
- **ReviewsTab**: Review moderation
- **CalendarTab**: FullCalendar view
- **ContentTab**: CMS editor
- **ThemeTab**: Theme customizer
- **MapsTab**: Service area visualization
- **SEOTab**: Meta tags management

### UI Components (`components/ui/`)
- **shadcn/ui**: 40+ base components (Button, Card, Dialog, etc.)
- **EditableText**: In-place content editing
- **EditableImage**: Image upload and editing
- **NotificationSystem**: Toast notifications
- **LoadingIndicator**: Loading states
- **StarRating**: 5-star rating display

### Drag-and-Drop Components (`components/drag-drop/`)
- **AndroidStyleEditor**: Page builder
- **ComponentPalette**: Component library
- **DropZoneArea**: Drop zones for components
- **EditModeHUD**: Editing toolbar
- **InPlaceEditor**: Component property editor

---

## 🪝 Hooks & Contexts

### Custom Hooks (`hooks/`)

#### **useBookings**
```typescript
const { updateBookingStatus, isUpdating } = useBookings(onBookingUpdate);
```
- Update booking status
- Send email notifications
- Schedule review reminders
- Add location coordinates

#### **useNavigationManager**
```typescript
const {
  items, loading, error,
  createItem, updateItem, deleteItem,
  reorderItems, toggleVisibility
} = useNavigationManager({ autoSync: true });
```
- CRUD operations for navigation
- Real-time sync
- Permission validation
- Auto-refresh

#### **usePages**
```typescript
const {
  pages, loading,
  fetchPages, createPage, updatePage, deletePage
} = usePages();
```
- Page management
- Content normalization
- Error handling

#### **useProfileCompletion**
```typescript
const { completed, authenticated, loading } = useProfileCompletion();
```
- Check profile completion status
- Auto-redirect to complete-profile
- Clerk metadata integration

#### **useRealTimeNotifications**
```typescript
const {
  isConnected, notifications,
  clearNotifications, markAsRead
} = useRealTimeNotifications();
```
- Server-Sent Events (SSE)
- Real-time notifications
- Auto-reconnect with exponential backoff

### React Contexts (`contexts/`)

#### **EditModeContext**
```typescript
const {
  isEditMode, toggleEditMode,
  saveContent, isAdmin,
  isConnected, activeEditors,
  subscribeToPage, broadcastPresence
} = useEditMode();
```
**Features**:
- Edit mode toggle
- Content saving with optimistic updates
- Real-time collaboration
- Presence tracking
- Conflict resolution
- Permission validation

#### **GlobalContentContext**
```typescript
const {
  content, updateGlobalContent,
  isLoading, refreshContent
} = useGlobalContent();
```
**Features**:
- Global business information
- Instructor details
- Operating hours
- Contact information

#### **ThemeContext**
```typescript
const { theme, updateTheme, applyTheme } = useTheme();
```
**Features**:
- Dynamic theme customization
- Color overrides (HSL-based)
- Typography settings
- Layout configuration
- Dark mode support
- Custom CSS injection

---

## 🔐 Security & Authentication

### Authentication Flow
1. User signs in via Clerk
2. Clerk middleware validates session
3. API routes extract userId from Clerk
4. User mapped to Supabase via clerk_id
5. Operations performed with user context

### Authorization Layers
1. **Clerk Middleware**: Route-level protection
2. **API Route Auth**: `requireAuth()` helper
3. **GraphQL Resolvers**: `getAuthenticatedUser()` check
4. **Admin Checks**: `requireAdmin()` for admin operations
5. **RLS Policies**: Database-level row security

### Permission System (`lib/permissions/`)
```typescript
const result = await permissionManager.checkPermission({
  userId: user.id,
  userRole: 'editor',
  resource: 'content',
  operation: 'update'
});
```

**Roles**:
- **Admin**: Full access to all resources
- **Editor**: Can edit content, components, pages
- **Viewer**: Read-only access
- **Guest**: Public access only

**Resources**: content, component, page, navigation, user, package, booking, review

**Operations**: create, read, update, delete, move, reorder

### Input Validation
- **Zod Schemas**: All inputs validated
- **Sanitization**: XSS prevention
- **Type Safety**: TypeScript strict mode
- **SQL Injection**: Parameterized queries

### Rate Limiting
- **Payment Endpoints**: 5 requests / 15 minutes
- **General API**: 100 requests / minute
- **GraphQL**: Per-operation rate limiting
- **Webhooks**: 100 requests / minute

---

## 🔄 Real-time Features

### Real-time Infrastructure (`lib/realtime/`)

#### **RealtimeClient**
- WebSocket connection management
- Auto-reconnect with exponential backoff
- Event subscription and publishing
- Connection status tracking

#### **PresenceTracker**
- Track active editors on each page
- Heartbeat mechanism (30s interval)
- User join/leave notifications
- Component-level presence

#### **EventRouter**
- Route events to appropriate handlers
- Event type registration
- Async event processing
- Error handling

### Real-time Events
- `content_change`: Content updates
- `component_add`: Component added
- `component_move`: Component moved
- `component_delete`: Component deleted
- `page_create`: New page created
- `navigation_update`: Navigation changed
- `conflict_detected`: Edit conflict

### Conflict Resolution
```typescript
interface ConflictItem {
  id: string;
  type: 'content' | 'component' | 'page';
  componentId: string;
  localVersion: any;
  remoteVersion: any;
  conflictedAt: string;
  conflictedBy: string;
}
```

**Resolution Strategies**:
- `accept_local`: Keep local changes
- `accept_remote`: Accept remote changes
- `merge`: Attempt automatic merge
- `manual`: Require manual resolution

---

## 🧪 Testing & Quality

### Testing Setup
- **Unit Tests**: Jest 29.7.0
- **E2E Tests**: Playwright 1.56.1
- **Coverage**: 70% threshold
- **CI/CD**: GitHub Actions

### Test Files
- `__tests__/` - Unit tests
- `tests/` - E2E tests
- `jest.config.js` - Jest configuration
- `playwright.config.ts` - Playwright configuration

### Code Quality
- **ESLint**: Next.js + TypeScript rules
- **TypeScript**: Strict mode enabled
- **Prettier**: Code formatting (if configured)
- **Husky**: Pre-commit hooks (if configured)

---

## 🚀 Deployment

### Vercel (Recommended)
- Automatic deployments from Git
- Preview deployments for PRs
- Environment variables configured
- Edge functions for API routes
- Image optimization
- Analytics

### Environment Variables
```env
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

## 💡 Development Workflows

### Starting Development
```bash
npm run dev          # Start dev server with Turbopack
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
npm run test         # Run Jest tests
npm run test:e2e     # Run Playwright tests
```

### Common Tasks

#### Adding a New API Route
1. Create file in `app/api/[route]/route.ts`
2. Implement GET/POST/PUT/DELETE handlers
3. Wrap with `withCentralizedStateManagement`
4. Add type definitions in `lib/types.ts`
5. Test with Postman or curl

#### Creating a New Component
1. Create file in `components/[category]/[name].tsx`
2. Use TypeScript for props
3. Import from `@/components/ui` for base components
4. Add to component registry if drag-droppable
5. Export from `components/index.ts`

#### Adding a Database Table
1. Create migration SQL in `sql/migrations/`
2. Run migration in Supabase dashboard
3. Add TypeScript types in `lib/types.ts`
4. Create API routes for CRUD
5. Add RLS policies

#### Updating Theme
1. Go to Admin Dashboard → Theme Tab
2. Customize colors, typography, layout
3. Preview changes in real-time
4. Apply to live site
5. Export theme for backup

---

## 📚 Key Files Reference

### Configuration
- `next.config.ts` - Next.js + Sentry configuration
- `tsconfig.json` - TypeScript strict mode
- `eslint.config.mjs` - ESLint rules
- `components.json` - shadcn/ui configuration
- `middleware.ts` - Clerk authentication
- `instrumentation.ts` - Sentry setup

### Core Application
- `app/layout.tsx` - Root layout with providers
- `app/page.tsx` - Homepage
- `app/admin/page.tsx` - Admin dashboard
- `lib/types.ts` - TypeScript type definitions
- `lib/supabase.ts` - Supabase client
- `lib/utils.ts` - Utility functions

### Key Libraries
- `lib/graphql/server.ts` - Apollo Server setup
- `lib/graphql/resolvers.ts` - GraphQL resolvers
- `lib/graphql/dataloaders.ts` - DataLoader implementation
- `lib/realtime/RealtimeClient.ts` - Real-time infrastructure
- `lib/permissions/PermissionManager.ts` - RBAC system
- `lib/content.ts` - CMS utilities

---

## 🎯 Quick Reference

### Most Important Files to Know
1. `app/layout.tsx` - Application shell
2. `app/page.tsx` - Homepage
3. `app/admin/page.tsx` - Admin dashboard
4. `lib/types.ts` - All TypeScript types
5. `contexts/editModeContext.tsx` - Edit mode & real-time
6. `lib/graphql/resolvers.ts` - GraphQL operations
7. `middleware.ts` - Authentication
8. `next.config.ts` - App configuration

### Common Patterns
- **Server Component**: Default, no `'use client'`
- **Client Component**: Add `'use client'` at top
- **API Route**: Export GET/POST/PUT/DELETE functions
- **Hook**: Start with `use`, return object with state/actions
- **Context**: Create context, provider, and custom hook

### Debugging Tips
- Check Sentry for errors
- Use `console.log` in development
- Check Network tab for API calls
- Use React DevTools for component tree
- Check Supabase logs for database issues
- Use GraphQL Playground for GraphQL debugging

---

## 📞 Support Resources

- **Sentry**: Real-time error tracking
- **Supabase Dashboard**: Database management
- **Clerk Dashboard**: User management
- **Vercel Dashboard**: Deployment logs
- **GitHub**: Source code and issues

---

**Last Updated**: 2025-01-06  
**Maintained By**: Development Team  
**For**: Kiro AI Assistant

This document provides comprehensive context for AI-assisted development. Reference specific sections as needed for accurate code generation and problem-solving.
