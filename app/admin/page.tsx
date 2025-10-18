import { createClerkClient } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { Toaster } from 'sonner';
import { formatForDisplay } from '@/lib/phone';
import { AdminDashboardClient } from './components/AdminDashboardClient';
import { Review, Package, Booking as LibBooking, } from '@/lib/types';

// Create a server-side Supabase client for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Define the new, merged user type
export interface MergedUser {
  // Clerk data
  clerkId: string;
  email: string;
  clerkCreatedAt: Date | string;
  lastSignInAt: Date | string | null;

  // Supabase data
  supabaseUserId?: string;
  fullName?: string;
  phone?: string;
  supabaseCreatedAt?: string;

  // Status
  isSynced: boolean;
}

// Define types for server-side data fetching that match what comes from Supabase
interface ServerBooking {
  id: string;
  user_id: string;
  package_id: string | null;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'rejected';
  created_at: string;
  users: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    created_at: string;
    clerk_id: string;
  };
  packages: {
    id: string;
    name: string;
    price: number;
  } | null;
}

// Server-side function to fetch and merge users
async function getMergedUsers(): Promise<MergedUser[]> {
  try {
    const clerkClient = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY ?? '',
    });

    console.log("Fetching users from Clerk and Supabase...");

    // Fetch users from Clerk
    const clerkUsersResponse = await clerkClient.users.getUserList({ limit: 200 });
    const clerkUsers = clerkUsersResponse.data || [];
    console.log(`Found ${clerkUsers.length} Clerk users`);

    // Fetch users from Supabase
    const { data: supabaseUsers, error: supabaseError } = await supabaseAdmin
      .from('users')
      .select('*');

    if (supabaseError) {
      console.error("Supabase error:", supabaseError);
      throw supabaseError;
    }

    console.log(`Found ${supabaseUsers?.length || 0} Supabase users`);

    // Create maps for both user types for efficient lookups
    const clerkUserMap = new Map(
      clerkUsers.map(user => {
        const email = user.emailAddresses?.find(e => e.id === user.primaryEmailAddressId)?.emailAddress || '';
        return [email.toLowerCase(), user];
      })
    );

    const supabaseUserMap = new Map(
      (supabaseUsers || []).map(user => [user.email?.toLowerCase(), user])
    );

    // Get all unique emails from both sources
    const allEmails = new Set([
      ...clerkUsers.map(u => 
        u.emailAddresses?.find(e => e.id === u.primaryEmailAddressId)?.emailAddress?.toLowerCase()
      ).filter(Boolean),
      ...(supabaseUsers || []).map(u => u.email?.toLowerCase()).filter(Boolean)
    ]);

    // Merge users, giving priority to Clerk data when available
    const mergedUsers: MergedUser[] = Array.from(allEmails).map(email => {
      const clerkUser = clerkUserMap.get(email);
      const supabaseUser = supabaseUserMap.get(email);

      // If we have both Clerk and Supabase user, merge them
      if (clerkUser && supabaseUser) {
        const primaryEmail = clerkUser.emailAddresses?.find(
          e => e.id === clerkUser.primaryEmailAddressId
        )?.emailAddress || email;

        return {
          clerkId: clerkUser.id,
          email: primaryEmail,
          clerkCreatedAt: clerkUser.createdAt,
          lastSignInAt: clerkUser.lastSignInAt,
          supabaseUserId: supabaseUser.id,
          fullName: supabaseUser.full_name || 
                   `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'No Name',
          phone: supabaseUser.phone || '',
          supabaseCreatedAt: supabaseUser.created_at,
          isSynced: true,
        };
      }
      
      // If only Clerk user exists
      if (clerkUser) {
        const primaryEmail = clerkUser.emailAddresses?.find(
          e => e.id === clerkUser.primaryEmailAddressId
        )?.emailAddress || email;

        return {
          clerkId: clerkUser.id,
          email: primaryEmail,
          clerkCreatedAt: clerkUser.createdAt,
          lastSignInAt: clerkUser.lastSignInAt,
          fullName: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'No Name',
          phone: '',
          isSynced: false,
        };
      }
      
      // If only Supabase user exists
      if (supabaseUser) {
        return {
          clerkId: '',
          email: supabaseUser.email || email,
          supabaseUserId: supabaseUser.id,
          fullName: supabaseUser.full_name || 'No Name',
          phone: supabaseUser.phone || '',
          supabaseCreatedAt: supabaseUser.created_at,
          clerkCreatedAt: supabaseUser.created_at, // Use Supabase created_at as fallback
          isSynced: false,
        };
      }
      
      // Fallback (shouldn't happen due to the Set creation above)
      return {
        clerkId: '',
        email: email,
        fullName: 'Unknown User',
        isSynced: false,
        clerkCreatedAt: new Date().toISOString(),
      };
    });

    console.log(`Merged ${mergedUsers.length} unique users`);
    return mergedUsers;
  } catch (error) {
    console.error("Error in getMergedUsers:", error);
    return [];
  }
}

// Helper function to transform server booking data to lib types
function transformBookings(serverBookings: ServerBooking[]): LibBooking[] {
  return serverBookings.map(booking => ({
    id: booking.id,
    user_id: booking.user_id,
    package_id: booking.package_id,
    date: booking.date,
    time: booking.time,
    start_time: booking.time, // Map time to start_time
    end_time: booking.time, // Map time to end_time (you may want to calculate this)
    status: booking.status as LibBooking['status'], // Status should already match
    created_at: booking.created_at,
    users: booking.users ? {
      id: booking.users.id,
      email: booking.users.email,
      full_name: booking.users.full_name,
      phone: booking.users.phone ? formatForDisplay(booking.users.phone) : booking.users.phone,
      created_at: booking.users.created_at,
    } : undefined,
    packages: booking.packages ? {
      id: booking.packages.id,
      name: booking.packages.name,
      description: '', // Default description
      price: booking.packages.price,
      hours: 0, // Default hours
      features: [],
      popular: false,
      created_at: '',
    } : undefined,
  }));
}

// Main Admin Page (Server Component)
export default async function AdminDashboardPage() {
  // Fetch all data on the server
  const [users, reviews, bookings, packages] = await Promise.all([
    getMergedUsers(),
    supabaseAdmin.from('reviews').select('*'),
    supabaseAdmin.from('bookings').select('*, users(*), packages(*)'),
    supabaseAdmin.from('packages').select('*').order('created_at', { ascending: false })
  ]);

  // Transform server bookings to lib types
  const transformedBookings = transformBookings((bookings.data as ServerBooking[]) || []);

  return (
    <div className="mx-auto">
      <Toaster />
      <AdminDashboardClient
        initialUsers={users || []}
        initialReviews={(reviews.data as Review[]) || []}
        initialBookings={transformedBookings}
        initialPackages={(packages.data as Package[]) || []}
      />
    </div>
  );
}
