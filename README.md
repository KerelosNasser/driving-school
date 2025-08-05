# Brisbane Driving School

A professional website for a driving school in Brisbane, Australia. This project is built with Next.js, Clerk for authentication, Supabase for database, and Tailwind CSS with shadcn/ui for styling.

## Features

- **Professional Landing Page**: Modern, responsive design with animations
- **Package Selection**: Browse and select from various driving lesson packages
- **About Us Page**: Information about the instructor with Google Maps integration
- **Reviews Page**: Display positive feedback from students
- **Booking System**: Multi-step form to book driving lessons
- **Admin Dashboard**: Restricted access panel with charts and management tools
- **Authentication**: Secure login and registration with Clerk
- **Database**: Supabase integration for storing user data, bookings, and reviews

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui components
- **Authentication**: Clerk
- **Database**: Supabase
- **Maps**: Google Maps API
- **Calendar**: Google Calendar API (placeholder)
- **Payments**: Stripe (placeholder)
- **Charts**: Recharts
- **Animations**: Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Clerk account for authentication
- Supabase account for database
- Google Maps API key
- (Optional) Google Calendar API credentials
- (Optional) Stripe API keys

### Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
NEXT_PUBLIC_ADMIN_EMAIL=admin@example.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Important: Make sure the Supabase URL is a valid URL with https:// prefix

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Google Calendar
GOOGLE_CALENDAR_CLIENT_ID=your_google_calendar_client_id
GOOGLE_CALENDAR_CLIENT_SECRET=your_google_calendar_client_secret
GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:3000/api/auth/callback/google
GOOGLE_CALENDAR_ID=your_google_calendar_id

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Chatbot
NEXT_PUBLIC_CHATBOT_WIDGET_ID=your_chatbot_widget_id
```

### Database Setup

The project includes SQL files in the `sql/` directory for setting up the database:

1. **schema.sql**: Creates all necessary tables with proper constraints and indexes
2. **seed.sql**: Populates the database with sample data (packages, users, reviews, bookings)

To set up your database:

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `sql/schema.sql` into the editor and run it
4. Copy and paste the contents of `sql/seed.sql` into the editor and run it

Alternatively, if you have the Supabase CLI installed:

```bash
supabase db execute --file=./sql/schema.sql
supabase db execute --file=./sql/seed.sql
```

For more detailed instructions, see the README.md file in the `sql/` directory.

### Installation

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `app/`: Next.js app router pages
  - `page.tsx`: Homepage
  - `packages/`: Packages page
  - `about/`: About Us page
  - `reviews/`: Reviews page
  - `admin/`: Admin Dashboard (restricted access)
  - `book/`: Booking page
- `components/`: React components
  - `navigation.tsx`: Navigation bar
  - `footer.tsx`: Footer component
  - `home/`: Homepage components
  - `ui/`: shadcn/ui components
- `lib/`: Utility functions
  - `supabase.ts`: Supabase client and type definitions
  - `supabase-server.ts`: Server-side Supabase client
  - `utils.ts`: Helper functions
- `sql/`: Database setup files
  - `schema.sql`: Database schema definition
  - `seed.sql`: Sample data for development
  - `README.md`: Instructions for database setup
- `middleware.ts`: Authentication and route protection

## Future Enhancements

- Complete Google Calendar integration for booking management
- Implement Stripe payment processing
- Add email notifications for bookings
- Enhance admin dashboard with more detailed analytics
- Implement user profile management
- Add a contact form
- Set up automated testing

## License

This project is licensed under the MIT License.

## Acknowledgements

- [Next.js](https://nextjs.org)
- [Clerk](https://clerk.dev)
- [Supabase](https://supabase.io)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Framer Motion](https://www.framer.com/motion)
- [Recharts](https://recharts.org)
- [Google Maps API](https://developers.google.com/maps)
- [Lucide Icons](https://lucide.dev)
