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

// POST - Manually trigger reward distribution for all users
export async function POST(_request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isUserAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Try to use the database function first
    try {
      const { data: result, error: functionError } = await supabase.rpc('distribute_rewards_to_all_users');

      if (functionError) {
        console.warn('Database function not available, using manual distribution:', functionError);
        throw new Error('Database function not available');
      }

      const totalRewards = result?.reduce((sum: number, r: any) => sum + (r.rewards_distributed || 0), 0) || 0;

      return NextResponse.json({
        success: true,
        message: `Distributed ${totalRewards} rewards to ${result?.length || 0} users`,
        details: result
      });

    } catch (functionError) {
      // Fallback to manual distribution
      console.log('Using manual reward distribution...');

      // Get all users with completed referrals
      const { data: referrers } = await supabase
        .from('referrals')
        .select('referrer_user_id')
        .eq('status', 'completed');

      if (!referrers || referrers.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No users with referrals found',
          totalRewards: 0,
          usersProcessed: 0
        });
      }

      // Get unique referrer IDs
      const uniqueReferrerIds = [...new Set(referrers.map(r => r.referrer_user_id))];
      let totalRewardsDistributed = 0;

      for (const referrerId of uniqueReferrerIds) {
        // Get referral count for this user
        const { count: referralCount } = await supabase
          .from('referrals')
          .select('*', { count: 'exact', head: true })
          .eq('referrer_user_id', referrerId)
          .eq('status', 'completed');

        if (!referralCount) continue;

        // Get eligible tiers
        const { data: eligibleTiers } = await supabase
          .from('reward_tiers')
          .select('*')
          .eq('is_active', true)
          .lte('required_referrals', referralCount)
          .order('required_referrals', { ascending: true });

        if (!eligibleTiers || eligibleTiers.length === 0) continue;

        // Get already received rewards
        const { data: receivedRewards } = await supabase
          .from('referral_rewards')
          .select('tier_id')
          .eq('user_id', referrerId)
          .eq('source', 'referral')
          .not('tier_id', 'is', null);

        const receivedTierIds = new Set(
          (receivedRewards || []).map(r => r.tier_id)
        );

        // Distribute missing rewards
        for (const tier of eligibleTiers) {
          if (!receivedTierIds.has(tier.id)) {
            const { error: rewardError } = await supabase
              .from('referral_rewards')
              .insert({
                user_id: referrerId,
                reward_type: tier.reward_type,
                reward_value: tier.reward_value,
                package_id: tier.package_id,
                tier_id: tier.id,
                source: 'referral',
                reason: `Earned ${tier.tier_name} - ${referralCount} referrals`,
                earned_at: new Date().toISOString(),
                created_at: new Date().toISOString()
              });

            if (!rewardError) {
              totalRewardsDistributed++;
            } else {
              console.error(`Error distributing reward to user ${referrerId}:`, rewardError);
            }
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: `Manually distributed ${totalRewardsDistributed} rewards to ${uniqueReferrerIds.length} users`,
        totalRewards: totalRewardsDistributed,
        usersProcessed: uniqueReferrerIds.length
      });
    }

  } catch (error) {
    console.error('POST /api/admin/referral-rewards/distribute error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
