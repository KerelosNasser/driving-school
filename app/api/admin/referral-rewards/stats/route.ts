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

// GET - Fetch referral system statistics
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

    // Get comprehensive statistics
    const [
      { count: totalUsers },
      { count: totalReferrals },
      { count: totalRewards },
      { count: totalRewardsUsed },
      { data: activeTiers },
    ] = await Promise.all([
      // Total users
      supabase.from('users').select('*', { count: 'exact', head: true }),

      // Total referrals (if referrals table exists)
      (async () => {
        try {
          const result = await supabase.from('referrals').select('*', { count: 'exact', head: true });
          return result;
        } catch {
          return { count: 0 };
        }
      })(),

      // Total rewards distributed
      supabase.from('referral_rewards').select('*', { count: 'exact', head: true }),

      // Total rewards used
      supabase.from('referral_rewards').select('*', { count: 'exact', head: true }).eq('is_used', true),

      // Active reward tiers
      supabase.from('reward_tiers').select('*').eq('is_active', true),
    ]);

    // Calculate discount value (sum of discount percentages * some average package price)
    const { data: discountRewards } = await supabase
      .from('referral_rewards')
      .select('reward_value, is_used')
      .eq('reward_type', 'discount');

    const totalDiscountValue = (discountRewards || []).reduce((sum, reward) => {
      if (!reward.is_used) {
        // Estimate $50 average package price for discount calculation
        return sum + (reward.reward_value * 50);
      }
      return sum;
    }, 0);

    const stats = {
      total_users: totalUsers || 0,
      total_referrals: totalReferrals || 0,
      total_rewards_distributed: totalRewards || 0,
      total_rewards_used: totalRewardsUsed || 0,
      total_discount_value: Math.round(totalDiscountValue),
      active_reward_tiers: activeTiers?.length || 0
    };

    return NextResponse.json({ stats });

  } catch (error) {
    console.error('GET /api/admin/referral-rewards/stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
