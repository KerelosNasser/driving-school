import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    // In development, allow all authenticated users
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    
    const client = await clerkClient()
    const user = await client.users.getUser(userId);
    return user.publicMetadata?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    // In development, allow access even if Clerk check fails
    return process.env.NODE_ENV === 'development';
  }
}

// GET - Fetch all users for admin panel
export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isUserAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, full_name, first_name, last_name, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Transform to include first_name and last_name if they don't exist
    const transformedUsers = (users || []).map((user: any) => ({
      id: user.id,
      email: user.email,
      first_name: user.first_name || user.full_name?.split(' ')[0] || '',
      last_name: user.last_name || user.full_name?.split(' ').slice(1).join(' ') || '',
      full_name: user.full_name,
      created_at: user.created_at
    }));

    return NextResponse.json({ users: transformedUsers });

  } catch (error) {
    console.error('GET /api/admin/users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
