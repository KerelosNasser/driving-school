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

// GET - Fetch all user rewards with user information
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

    const { data: rewards, error } = await supabase
      .from('referral_rewards')
      .select(`
        *,
        users!referral_rewards_user_id_fkey (
          id,
          email,
          full_name,
          first_name,
          last_name
        ),
        packages (
          id,
          name,
          price
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user rewards:', error);
      return NextResponse.json({ error: 'Failed to fetch user rewards' }, { status: 500 });
    }

    // Transform the data to match expected format
    const transformedRewards = (rewards || []).map((reward: any) => ({
      id: reward.id,
      user_id: reward.user_id,
      reward_type: reward.reward_type,
      reward_value: reward.reward_value,
      package_id: reward.package_id,
      is_used: reward.is_used,
      used_at: reward.used_at,
      earned_at: reward.created_at,
      expires_at: reward.expires_at,
      source: reward.source || 'referral',
      users: reward.users ? {
        email: reward.users.email,
        first_name: reward.users.first_name || reward.users.full_name?.split(' ')[0] || '',
        last_name: reward.users.last_name || reward.users.full_name?.split(' ').slice(1).join(' ') || ''
      } : null,
      packages: reward.packages ? {
        name: reward.packages.name,
        price: reward.packages.price
      } : null
    }));

    return NextResponse.json({ rewards: transformedRewards });

  } catch (error) {
    console.error('GET /api/admin/referral-rewards/rewards error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
