
# 🚗 EG Driving School - Professional Web Application
A comprehensive, modern web application for a professional driving school business built with cutting-edge technologies. This full-stack application provides everything needed to run a successful driving school, from student management to AI-powered customer support.

## 🌟 Overview
EG Driving School is a feature-rich web application designed to streamline driving school operations while providing an exceptional user experience. The application combines modern web technologies with intelligent automation to deliver a professional, scalable solution for driving instruction businesses.

## 🎯 Key Features
### 🏠 Professional Landing Page
- Modern, responsive design with smooth animations using Framer Motion
- SEO-optimized with structured data (Organization & LocalBusiness schemas)
- Interactive hero section with compelling call-to-actions
- Feature showcase highlighting unique selling points
- Image gallery with optimized loading
- Service area mapping with Leaflet.js integration
- Customer testimonials and reviews display
### 📦 Package Management System
- Dynamic package display with pricing and features
- Popular package highlighting
- Detailed package descriptions with feature lists
- Admin-controlled package creation and editing
- Stripe integration for secure payment processing
- Package comparison functionality
### 🤖 AI-Powered Chatbot
- Intelligent customer support using Hugging Face Transformers
- Comprehensive knowledge base about driving school services
- Persistent chat history with localStorage
- Context-aware conversations
- User authentication integration
- Automated greeting system
- Mobile-responsive chat interface
### 📅 Advanced Booking System
- Multi-step booking process with validation
- Calendar integration for availability checking
- Real-time booking status updates
- Email notifications for booking confirmations
- Google Calendar synchronization
- Booking management for both users and admins
### 👨‍💼 Comprehensive Admin Dashboard
- Overview Tab : Key metrics, charts, and analytics using Recharts
- Bookings Management : Status updates, scheduling, and customer communication
- User Management : Customer profiles, contact information, and booking history
- Package Management : Create, edit, and manage driving lesson packages
- Reviews Management : Approve/reject customer reviews and testimonials
- Calendar View : Visual booking schedule with FullCalendar integration
- Interactive Map : Service area visualization with Leaflet.js
- Forms Integration : Google Forms integration for data collection
### 🔐 Authentication & Security
- Clerk authentication with secure user management
- Role-based access control (Student,Admin)
- Protected API routes with middleware
- Secure session management
- Email verification and password reset
### 💳 Payment Processing
- Stripe integration for secure payments
- Checkout session management
- Webhook handling for payment confirmations
- Automated email receipts
- Payment status tracking
### 📧 Email Communication
- Resend integration for transactional emails
- Booking confirmation emails
- Review reminder notifications
- Admin notification system
- Customizable email templates
### 🗺️ Location Services
- Leaflet.js maps for service area display
- Interactive admin map for booking locations
- Geocoding for address validation
- Custom map markers and styling
### 📊 Analytics & Monitoring
- Sentry integration for error tracking and performance monitoring
- Web Vitals tracking for performance optimization
- Custom analytics dashboard
- Real-time application monitoring
## 🛠️ Technology Stack
### Frontend
- Framework : Next.js 15.4.5 (App Router)
- React : 19.1.0 with modern hooks and patterns
- TypeScript : Full type safety throughout the application
- Styling : Tailwind CSS 4.0 with custom design system
- UI Components : shadcn/ui with Radix UI primitives
- Animations : Framer Motion for smooth interactions
- Icons : Lucide React for consistent iconography
### Backend & Database
- Database : Supabase (PostgreSQL) with real-time capabilities
- Authentication : Clerk for secure user management
- API : Next.js API routes with TypeScript
- ORM : Supabase client with type-safe queries
### Third-Party Integrations
- Payments : Stripe for secure payment processing
- Email : Resend for transactional email delivery
- Maps : Leaflet.js for interactive mapping
- AI : Hugging Face Transformers for chatbot intelligence
- Calendar : FullCalendar for scheduling interface
- Monitoring : Sentry for error tracking and performance
- Forms : Google Forms integration for data collection
### Development & Deployment
- Build Tool : Next.js with Turbopack for fast development
- Linting : ESLint with Next.js configuration
- Type Checking : TypeScript strict mode
- Package Manager : npm with lock file for consistency
## 📁 Project Structure
-------------------------------------------------------------------------------
driving-school/
├── 📁 app/                          # Next.js App 
Router
│   ├── 📁 (auth)/                   # Authentication 
routes
│   │   ├── 📁 sign-in/              # Sign-in page
│   │   └── 📁 sign-up/              # Sign-up page
│   ├── 📁 about/                    # About page
│   ├── 📁 admin/                    # Admin dashboard
│   │   ├── 📁 components/           # Admin-specific 
components
│   │   └── 📄 page.tsx              # Admin dashboard 
page
│   ├── 📁 api/                      # API routes
│   │   ├── 📁 chatbot/              # AI chatbot 
endpoint
│   │   ├── 📁 create-checkout-session/ # Stripe 
checkout
│   │   ├── 📁 packages/             # Package CRUD 
operations
│   │   ├── 📁 send-booking-email/   # Email 
notifications
│   │   ├── 📁 send-review-reminder/ # Review reminders
│   │   ├── 📁 sentry-example-api/   # Sentry testing
│   │   └── 📁 webhooks/             # Stripe webhooks
│   ├── 📁 book/                     # Booking system
│   ├── 📁 contact/                  # Contact page
│   ├── 📁 packages/                 # Package listing
│   ├── 📁 reviews/                  # Reviews and 
testimonials
│   ├── 📄 global-error.tsx         # Global error 
boundary
│   ├── 📄 globals.css              # Global styles
│   ├── 📄 layout.tsx               # Root layout with 
providers
│   ├── 📄 page.tsx                 # Homepage
│   └── 📄 sitemap.ts               # Dynamic sitemap 
generation
├── 📁 components/                   # Reusable 
components
│   ├── 📁 admin/                   # Admin dashboard 
components
│   ├── 📁 chatbot/                 # AI chatbot 
components
│   ├── 📁 home/                    # Homepage sections
│   ├── 📁 maps/                    # Map components
│   ├── 📁 seo/                     # SEO and analytics
│   ├── 📁 ui/                      # shadcn/ui 
components
│   ├── 📄 footer.tsx               # Site footer
│   └── 📄 navigation.tsx           # Main navigation
├── 📁 lib/                         # Utility libraries
│   ├── 📄 chatbot-knowledge.ts     # AI knowledge base
│   ├── 📄 data.ts                  # Static data
│   ├── 📄 enhanced-driving-knowledge.ts # Extended AI 
training
│   ├── 📄 geocoding.ts             # Location services
│   ├── 📄 rate-limit.ts            # API rate limiting
│   ├── 📄 supabase-server.ts       # Server-side 
Supabase client
│   ├── 📄 supabase.ts              # Client-side 
Supabase client
│   ├── 📄 training-data.ts         # AI training 
datasets
│   ├── 📄 types.ts                 # TypeScript type 
definitions
│   └── 📄 utils.ts                 # Utility functions
├── 📁 sql/                         # Database schema 
and seeds
│   ├── 📄 schema.sql               # Database schema
│   └── 📄 seed.sql                 # Sample data
├── 📁 public/                      # Static assets
│   ├── 📁 leaflet/                 # Map assets
│   ├── 📄 robots.txt               # SEO robots file
│   └── 📄 site.webmanifest         # PWA manifest
├── 📄 middleware.ts                # Clerk 
authentication middleware
├── 📄 next.config.ts               # Next.js 
configuration
├── 📄 instrumentation.ts           # Sentry 
instrumentation
└── 📄 package.json                 # Dependencies and 
scripts
-------------------------------------------------------------------------------
## 🗄️ Database Schema
The application uses a well-structured PostgreSQL database with the following main tables:

### Users Table
- id (UUID, Primary Key)
- email (Unique, Not Null)
- full_name (Not Null)
- phone (Optional)
- clerk_id (Unique, Not Null)
- created_at (Timestamp)
### Packages Table
- id (UUID, Primary Key)
- name (Not Null)
- description (Not Null)
- price (Decimal)
- hours (Integer)
- features (JSONB)
- popular (Boolean)
- created_at (Timestamp)
### Bookings Table
- id (UUID, Primary Key)
- user_id (Foreign Key to Users)
- package_id (Foreign Key to Packages)
- date (Date)
- time (Time)
- status (Enum: pending, confirmed, cancelled, completed)
- payment_id (Stripe Payment ID)
- notes (Text)
- google_calendar_event_id (Optional)
- created_at (Timestamp)
### Reviews Table
- id (UUID, Primary Key)
- user_id (Foreign Key to Users)
- rating (Integer, 1-5)
- comment (Not Null)
- approved (Boolean)
- user_name (Not Null)
- created_at (Timestamp)
## 🚀 Installation & Setup
### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Clerk account for authentication
- Stripe account for payments
- Resend account for emails
- Hugging Face account for AI features

## 🔄 Application Workflow
### Customer Journey
1. 1.
   Discovery : Customer visits the homepage and explores packages
2. 2.
   Engagement : AI chatbot provides instant support and answers questions
3. 3.
   Selection : Customer chooses a driving lesson package
4. 4.
   Booking : Multi-step booking process with calendar integration
5. 5.
   Payment : Secure Stripe checkout process
6. 6.
   Confirmation : Automated email confirmation and calendar invite
7. 7.
   Service : Driving lessons are conducted
8. 8.
   Follow-up : Review reminder emails and feedback collection
### Admin Workflow
1. 1.
   Dashboard Overview : Monitor key metrics and recent activity
2. 2.
   Booking Management : Review, confirm, or reschedule bookings
3. 3.
   Customer Communication : Send updates and manage customer relationships
4. 4.
   Package Management : Create and modify lesson packages
5. 5.
   Review Moderation : Approve or reject customer testimonials
6. 6.
   Calendar Management : Visual scheduling and availability management
7. 7.
   Analytics : Track business performance and customer satisfaction
### Technical Workflow
1. 1.
   Request Handling : Next.js API routes process all backend operations
2. 2.
   Authentication : Clerk middleware protects routes and manages sessions
3. 3.
   Database Operations : Supabase handles all data persistence and real-time updates
4. 4.
   Payment Processing : Stripe webhooks ensure secure payment handling
5. 5.
   Email Delivery : Resend manages all transactional email communications
6. 6.
   AI Processing : Hugging Face models power the intelligent chatbot
7. 7.
   Error Monitoring : Sentry tracks and reports application issues
## 🎨 Design System
The application uses a consistent design system built on:

- Color Palette : Professional yellow and white tones with accent colors
- Typography : Inter font family for modern readability
- Spacing : Consistent spacing scale using Tailwind CSS
- Components : shadcn/ui components with custom styling
- Animations : Framer Motion for smooth, professional interactions
- Responsive Design : Mobile-first approach with breakpoint optimization
## 🔧 API Endpoints
### Public Endpoints
- GET /api/packages - Retrieve all packages
- POST /api/chatbot - AI chatbot interactions
- POST /api/create-checkout-session - Stripe checkout
- POST /api/webhooks/stripe - Stripe webhook handler
### Protected Endpoints
- POST /api/packages - Create new package (Admin only)
- PUT /api/packages/[id] - Update package (Admin only)
- DELETE /api/packages/[id] - Delete package (Admin only)
- POST /api/send-booking-email - Send booking notifications
- POST /api/send-review-reminder - Send review reminders
## 📱 Mobile Responsiveness
The application is fully responsive and optimized for:

- Mobile Phones : 320px - 768px
- Tablets : 768px - 1024px
- Desktops : 1024px+
- Large Screens : 1440px+
## 🔒 Security Features
- Authentication : Clerk-based secure authentication
- Authorization : Role-based access control
- API Protection : Middleware-protected routes
- Rate Limiting : API endpoint protection
- Input Validation : Zod schema validation
- CSRF Protection : Built-in Next.js protection
- Secure Headers : Custom security headers configuration
## 📈 Performance Optimizations
- Image Optimization : Next.js Image component with WebP/AVIF support
- Code Splitting : Automatic route-based code splitting
- Caching : Strategic caching for API responses
- Bundle Optimization : Tree shaking and dead code elimination
- Web Vitals : Performance monitoring and optimization
- Lazy Loading : Component and image lazy loading
## 🧪 Testing & Quality Assurance
- TypeScript : Full type safety throughout the application
- ESLint : Code quality and consistency enforcement
- Error Boundaries : Graceful error handling
- Sentry Integration : Real-time error monitoring
- Performance Monitoring : Web Vitals tracking
## 🚀 Deployment
The application is optimized for deployment on:

- Vercel (Recommended for Next.js)
- Netlify
- AWS Amplify
- Docker containers
### Deployment Checklist
- Environment variables configured
- Database schema deployed
- Stripe webhooks configured
- Domain DNS configured
- SSL certificates installed
- Monitoring tools configured
## 🔮 Future Enhancements
- Mobile App : React Native companion app
- Advanced Analytics : Enhanced business intelligence dashboard
- Multi-language Support : Internationalization (i18n)
- Progressive Web App : PWA capabilities
- Advanced AI : More sophisticated chatbot with voice support
- Integration Expansion : Additional third-party service integrations
- Automated Testing : Comprehensive test suite implementation
## 📞 Support & Maintenance
For technical support or questions about this application:

- Review the documentation thoroughly
- Check the GitHub issues for common problems
- Consult the integration guides for third-party services
- Monitor Sentry for real-time error tracking

# EG Driving School - Next.js Project

This is a comprehensive driving school management platform built with Next.js, Supabase, and Stripe. It includes features for booking lessons, managing user quotas, processing payments, and more.

## Features

- **User Authentication**: Secure sign-up and login with Clerk
- **Package Management**: Driving lesson packages with different pricing tiers
- **Booking System**: Calendar-based booking with Google Calendar integration
- **Payment Processing**: Multiple payment gateways including PayID, Tyro, BPAY, Stripe, and Afterpay
- **Quota Management**: Track and manage user lesson hours
- **Review System**: Collect and display student reviews
- **Admin Dashboard**: Comprehensive admin tools for managing content and users
- **Real-time Updates**: Real-time notifications and status updates
- **SEO Optimization**: Dynamic SEO metadata for all pages
- **Responsive Design**: Mobile-first responsive UI with Tailwind CSS

## Payment Gateways

The platform supports multiple payment gateways optimized for the Australian market, with manual payment methods prioritized as primary options:

1. **PayID** (Primary) - Instant bank transfers using PayID (0.5% + 10¢)
2. **Tyro** (Primary) - Australian EFTPOS payment provider (1.8% + 30¢)
3. **BPAY** (Primary) - Bank transfer payments via BPAY (0.6% + 25¢)
4. **Stripe** - Credit and debit card payments (2.9% + 30¢)
5. **Afterpay** - Buy-now, pay-later option (3.5% + 30¢, integrated with Stripe)
6. **PayPal** (Planned) - Popular international payment method

## User Synchronization

The platform automatically synchronizes users between Clerk (authentication) and Supabase (database). When a user who exists in Clerk but not yet in Supabase attempts to make a purchase, they are automatically created in Supabase with their profile information. 

The synchronization process also handles cases where a user with the same email already exists in the database but without a Clerk ID, by linking the Clerk ID to the existing user record.

## Enhanced UI/UX

The checkout process has been completely redesigned with a modern, professional interface that guides users through the payment process with clear instructions and visual feedback. Key improvements include:

- Visually appealing package display with feature highlighting
- Intuitive payment gateway selection with detailed information
- Step-by-step progress indicator
- Clear error messaging and guidance
- Responsive design for all devices
- Trust signals and security indicators

## Setup Instructions

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Configure Supabase project
5. Run database migrations:
   - Run migrations in order from `sql/migrations/`
   - Migration 09 adds manual payment sessions table for Tyro, BPAY, and PayID
   - Migration 11 enhances user synchronization between Clerk and Supabase
   - Migration 12 fixes foreign key constraint for manual payment sessions
   - Migration 13 adds atomic function for manual payment session creation
   - Migration 14 adds payment gateway IDs to environment configuration
6. Start the development server: `npm run dev`

## Environment Variables

See `.env.example` for required environment variables.

## Database Schema

The database schema is defined in the `sql/` directory:
- `01_extensions.sql` - Required PostgreSQL extensions
- `02_tables.sql` - Main tables
- `03_functions.sql` - Database functions
- `04_triggers_indexes.sql` - Triggers and indexes
- `05_permissions.sql` - Row Level Security policies
- `migrations/` - Sequential database migrations

## Recent Updates

### Migration 09 - Manual Payment Sessions
Added support for manual payment methods including:
- Tyro EFTPOS
- BPAY
- PayID

This migration creates the `manual_payment_sessions` table to track payments made through these methods.

### Migration 11 - User Synchronization Enhancement
Enhanced user synchronization between Clerk and Supabase to automatically create users in Supabase when they exist in Clerk but haven't been synced yet. This prevents "User not found" errors during payment processing. The enhancement also handles cases where users with the same email already exist in the database.

### Migration 12 - Manual Payment Sessions Foreign Key Fix
Fixed the foreign key constraint for manual payment sessions that was incorrectly referencing `auth.users` instead of `public.users`. This resolves the "foreign key constraint violation" errors that were occurring when creating manual payment sessions.

### Migration 13 - Atomic Manual Payment Session Creation
Added a PostgreSQL function that atomically creates users and manual payment sessions, preventing race conditions and foreign key constraint violations.

### Migration 14 - Payment Gateway IDs Configuration
Added configuration for payment gateway IDs (Tyro, BPAY, PayID) to the environment variables for better customization and security.

## Deployment

The application can be deployed to Vercel with minimal configuration.

## Contributing

Contributions are welcome! Please follow standard GitHub workflow.

## License

This project is proprietary and confidential.
