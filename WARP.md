# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server with Turbopack for fast builds
- `npm run build` - Create production build
- `npm run start` - Start production server
- `npm run lint` - Run ESLint with Next.js configuration
- `npm run type-check` - Run TypeScript compiler without emitting files

### Single Component Testing
- Use `npm run dev` and navigate to specific routes to test individual components
- Admin dashboard: `/admin` (requires admin authentication)
- Booking flow: `/book` (test multi-step process)
- AI chatbot: Available on homepage and throughout site

## Architecture Overview

### Tech Stack Foundation
- **Frontend**: Next.js 15.4.5 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS 4.0 with shadcn/ui components
- **Database**: Supabase (PostgreSQL) with real-time capabilities
- **Authentication**: Clerk with role-based access control
- **Payments**: Stripe with webhooks
- **AI**: Hugging Face Transformers for chatbot
- **Email**: Resend for transactional emails
- **Monitoring**: Sentry for error tracking and performance

### Key Architectural Patterns

#### 1. Route Organization (App Router)
- `app/(auth)/` - Authentication routes with layout grouping
- `app/admin/` - Protected admin dashboard with role-based access
- `app/api/` - Server-side API endpoints with middleware protection
- Route handlers follow REST conventions with proper error handling

#### 2. Database Architecture
Core entities with relationships:
- `users` (Clerk integration with profile completion system)
- `packages` (driving lesson packages with Stripe integration)
- `bookings` (calendar integration with status management)
- `reviews` (moderation system with approval workflow)
- Invitation/referral system with device fingerprinting

#### 3. Authentication & Authorization Flow
- Clerk middleware protects all routes automatically
- Post-authentication profile completion at `/complete-profile`
- Role-based access: `student`, `instructor`, `admin`
- API routes use Clerk's `auth()` for user context

#### 4. State Management Strategy
- Server components for data fetching (preferred)
- Client components only when interactivity required
- Form state with react-hook-form + Zod validation
- Toast notifications with sonner
- Real-time updates via Supabase subscriptions

#### 5. API Design Patterns
- RESTful endpoints with consistent error responses
- Rate limiting with IP-based throttling
- Input validation using Zod schemas
- Webhook handling for Stripe events
- AI chatbot with context-aware responses

### Critical Integration Points

#### Supabase Configuration
- Row Level Security (RLS) enabled on all tables
- Service role key for admin operations
- Real-time subscriptions for live updates
- Database functions for complex operations

#### Clerk Authentication
- Middleware runs on all routes
- Post-signup redirect to profile completion
- Role assignment and management
- Session handling with server components

#### Stripe Payment Flow
1. Package selection → checkout session creation
2. Stripe hosted checkout → webhook confirmation
3. Database booking creation → email notification
4. Admin dashboard management

#### AI Chatbot System
- Knowledge base in `lib/content.ts` and related files
- Hugging Face inference for responses
- Context-aware conversation handling
- Chat history persistence with localStorage

## Development Workflow

### Setting Up New Features
1. Start with database schema changes in SQL files
2. Update TypeScript types in `lib/types.ts`
3. Create API routes with proper validation
4. Build UI components with shadcn/ui
5. Add error boundaries and loading states
6. Test with different user roles

### Working with Forms
- Use react-hook-form with Zod resolvers
- Server-side validation mirrors client-side
- Error handling with proper user feedback
- File uploads through admin API endpoints

### Database Development
- Schema files in `sql/` directory
- Run migrations in order: `schema.sql`, then feature-specific files
- Use Supabase RLS policies for security
- Test with different user roles and permissions

### Component Development
- Follow existing patterns in `components/` structure
- Use TypeScript interfaces from `lib/types.ts`
- Implement proper loading and error states
- Ensure mobile responsiveness

## Key Configuration Files

### Next.js Configuration (`next.config.ts`)
- Sentry integration for monitoring
- Image optimization for external domains
- TypeScript and ESLint build configurations (currently permissive for development)

### Middleware (`middleware.ts`)
- Clerk authentication on all routes
- Excludes static files and Next.js internals
- Includes API routes for protection

### Environment Variables
Key integrations requiring configuration:
- `NEXT_PUBLIC_CLERK_*` - Authentication
- `NEXT_PUBLIC_SUPABASE_*` - Database
- `STRIPE_*` - Payment processing
- `RESEND_API_KEY` - Email delivery
- `HUGGINGFACE_*` - AI chatbot
- `GOOGLE_PLACES_API_KEY` - Location services

## Testing Strategy

### Manual Testing Workflows
1. **User Journey**: Sign up → Complete profile → Browse packages → Book → Pay
2. **Admin Workflow**: Login → Dashboard overview → Manage bookings → Update packages
3. **AI Chatbot**: Test knowledge base responses and conversation flow
4. **Form Validation**: Test all forms with invalid/malicious inputs

### API Testing
- Test rate limiting with rapid requests
- Verify authentication on protected endpoints
- Test webhook handling with Stripe CLI
- Validate input sanitization and SQL injection protection

## Common Development Patterns

### Error Handling
- Use try-catch blocks in API routes
- Return consistent error response format
- Log errors to Sentry in production
- Provide user-friendly error messages

### Data Fetching
- Prefer server components for initial data
- Use Supabase client for real-time subscriptions
- Implement loading states for better UX
- Cache static data appropriately

### Security Considerations
- All database operations use RLS policies
- Input validation on both client and server
- Rate limiting on sensitive endpoints
- Device fingerprinting for fraud prevention
- Secure handling of Stripe webhooks

## Production Deployment Notes

### Pre-deployment Checklist
- Set `ignoreBuildErrors: false` and `ignoreDuringBuilds: false` in `next.config.ts`
- Configure all environment variables
- Set up Stripe webhooks with production URLs
- Enable Sentry monitoring
- Configure Supabase RLS policies
- Set up email templates in Resend

### Performance Monitoring
- Sentry tracks Web Vitals and errors
- Next.js Image optimization enabled
- Turbopack for fast development builds
- Bundle optimization with tree shaking

This codebase follows modern Next.js patterns with comprehensive integrations. Focus on maintaining type safety, proper error handling, and security best practices when making changes.
