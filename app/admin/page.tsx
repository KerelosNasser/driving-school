import { createClerkClient } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { Toaster } from 'sonner';
import { AdminDashboardClient } from './components/AdminDashboardClient';

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

// Define types for our other data
interface Review {
  id: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  approved: boolean;
  created_at: string;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
  clerk_id: string;
}

interface Package {
  id: string;
  name: string;
  price: number;
}

interface Booking {
  id: string;
  user_id: string;
  package_id: string | null;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  users: User;
  packages: Package | null;
}

// Server-side function to fetch and merge users
async function getMergedUsers(): Promise<MergedUser[]> {
  try {
    const clerkClient = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
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

// Main Admin Page (Server Component)
export default async function AdminDashboardPage() {
  // Fetch all data on the server
  const [users, reviews, bookings, packages] = await Promise.all([
    getMergedUsers(),
    supabaseAdmin.from('reviews').select('*'),
    supabaseAdmin.from('bookings').select('*, users(*), packages(*)'),
    supabaseAdmin.from('packages').select('*').order('created_at', { ascending: false })
  ]);

  return (
    <div className="container mx-auto py-10">
      <Toaster />
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      {/* Pass server-fetched data to the client component */}
      <AdminDashboardClient
        initialUsers={users || []}
        initialReviews={(reviews.data as Review[]) || []}
        initialBookings={(bookings.data as Booking[]) || []}
        initialPackages={(packages.data as Package[]) || []}
      />
    </div>
  );
}
