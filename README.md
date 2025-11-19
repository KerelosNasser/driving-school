# Driving School Management System

A comprehensive, modern, and feature-rich management system for driving schools. This application streamlines operations for administrators, instructors, and students, offering real-time booking, role-based access control, AI-driven assistance, and robust security features.

## 🚀 Key Features

### 🔐 Authentication & Security
- **Secure Authentication**: Powered by **Clerk**, supporting multi-role access (Admin, Instructor, Student).
- **Fraud Detection**: Custom-built fraud detection engine (`fraud-detection.ts`) to analyze suspicious activities.
- **Enhanced Rate Limiting**: Advanced rate limiting logic (`rate-limit-enhanced.ts`) to protect API endpoints from abuse.
- **Phone Security**: Integrated phone number verification and security configurations (`phone-security.config.ts`).

### 📅 Smart Booking System
- **Real-Time Scheduling**: Interactive calendar interface using **FullCalendar**.
- **Conflict Resolution**: Sophisticated algorithms to prevent double bookings and manage instructor availability (`conflict-resolution`).
- **Timezone Support**: Seamless handling of timezones for accurate scheduling.

### 🗺️ Interactive Maps & Location Services
- **Service Area Mapping**: Integration with **Google Maps** and **Leaflet** to visualize service areas and instructor locations.
- **Geocoding**: Precise location services for student pickups and drop-offs (`geocoding.ts`).

### 🤖 AI & Automation
- **AI Chatbot**: Intelligent assistant to help users with common queries (`chatbot`).
- **Automated Workflows**: Cron jobs (`cron`) for background tasks like reminders and status updates.
- **Smart Notifications**: Automated email and in-app notifications for booking confirmations, reminders, and updates.

### 💬 Communication Hub
- **WhatsApp Integration**: Direct messaging support via WhatsApp (`whatsapp.ts`) for instant communication.
- **Email System**: Transactional emails delivered reliably via **Resend**.
- **Real-Time Updates**: Instant in-app notifications using custom hooks (`useRealTimeNotifications.ts`).

### 🛠️ Advanced API & Data Layer
- **GraphQL API**: Flexible and efficient data querying with **GraphQL**, secured by `graphql-shield`.
- **Webhooks**: Robust webhook handling for external integrations.
- **Database**: Scalable **PostgreSQL** database managed via **Supabase**.

### 💳 Payments & Commerce
- **Payment Processing**: Structure for manual payments and extensible design for payment gateway integration.
- **Package Management**: Admin tools to create and manage driving lesson packages.

## 💻 Tech Stack

### Frontend
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/)
- **State Management**: React Query (TanStack Query)

### Backend
- **Server**: Next.js Server Actions & API Routes
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **API**: GraphQL (Yoga/Apollo), REST
- **ORM/Query**: Supabase Client

### Tools & DevOps
- **Monitoring**: [Sentry](https://sentry.io/) for error tracking and performance monitoring.
- **Testing**: 
  - **E2E**: [Playwright](https://playwright.dev/)
  - **Unit**: [Jest](https://jestjs.io/)
- **Linting**: ESLint, Prettier

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or pnpm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd driving-school
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up Environment Variables**
   Create a `.env.local` file in the root directory and add the necessary keys (refer to `.env.example` if available):
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
   CLERK_SECRET_KEY=...
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   # Add other keys for Google Maps, Resend, Sentry, etc.
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🧪 Testing

Run the test suite to ensure everything is working correctly.

- **Unit Tests**:
  ```bash
  npm run test
  ```

- **End-to-End Tests**:
  ```bash
  npm run test:e2e
  ```

## 🚀 Deployment

The application is optimized for deployment on **Vercel**.

1. Push your code to a Git repository.
2. Import the project into Vercel.
3. Configure the environment variables in the Vercel dashboard.
4. Deploy!

---

Built with ❤️ and Next.js 15.
