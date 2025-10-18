import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/utils';
import { auth } from '@clerk/nextjs/server';
import { withCentralizedStateManagement } from '@/lib/api-middleware';

async function handleInvitationStatsRequest(_request: NextRequest) {
  try {
    // Get Clerk session user id (string)
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Map Clerk id -> internal users.id (uuid)
    const { data: userRow, error: userLookupError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', clerkId)
      .limit(1)
      .single();

    if (userLookupError || !userRow) {
      console.error('Local user lookup failed for clerk id:', clerkId, userLookupError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const internalUserId = userRow.id as string;

    // Check invitation_codes table exists and fetch active code
    try {
      const { data: invitationCode, error: codeError } = await supabaseAdmin
        .from('invitation_codes')
        .select('*')
        .eq('user_id', internalUserId)
        .eq('is_active', true)
        .single();

      if (codeError && codeError.code === 'PGRST116') {
        // Table missing — fallback response
        return NextResponse.json({
          message: 'Invitation system coming soon',
          invitationCode: null,
          statistics: {
            totalReferrals: 0,
            completedReferrals: 0,
            pendingReferrals: 0,
            totalRewards: 0,
            unusedRewards: 0
          },
          referrals: [],
          rewards: []
        });
      }

      if (!invitationCode) {
        return NextResponse.json({
          message: 'No invitation code found',
          invitationCode: null,
          statistics: {
            totalReferrals: 0,
            completedReferrals: 0,
            pendingReferrals: 0,
            totalRewards: 0,
            unusedRewards: 0
          },
          referrals: [],
          rewards: []
        });
      }

      // Get referrals from unified referrals table
      const { data: referralsData } = await supabaseAdmin
        .from('referrals')
        .select(`
          id,
          status,
          created_at,
          completed_at,
          referred_user_id,
          users!referrals_referred_user_id_fkey (
            id,
            full_name,
            email
          )
        `)
        .eq('referrer_user_id', internalUserId)
        .order('created_at', { ascending: false });

      const referrals = (referralsData || []).map((referral: any) => ({
        id: referral.id,
        referredUser: {
          name: referral.users?.full_name || 'Unknown User',
          email: referral.users?.email || 'unknown@example.com'
        },
        completedAt: referral.completed_at || referral.created_at,
        createdAt: referral.created_at,
        status: referral.status
      }));

      const referralStats = {
        totalReferrals: referralsData?.length || 0,
        completedReferrals: referralsData?.filter((r: any) => r.status === 'completed').length || 0,
        pendingReferrals: referralsData?.filter((r: any) => r.status === 'pending').length || 0
      };

      // Get rewards (if table present)
      let rewards: any[] = [];
      let rewardStats = {
        totalRewards: 0,
        unusedRewards: 0
      };

      try {
        const { data: rewardsData, error: rewardsError } = await supabaseAdmin
          .from('referral_rewards')
          .select('*')
          .eq('user_id', internalUserId);

        if (!rewardsError && rewardsData) {
          rewards = rewardsData.map((reward: any) => ({
            id: reward.id,
            type: reward.reward_type || 'discount',
            value: reward.reward_value || 0,
            expiresAt: reward.expires_at,
            createdAt: reward.created_at,
            isUsed: !!reward.is_used,
            usedAt: reward.used_at || null
          }));

          rewardStats.totalRewards = rewardsData.length;
          rewardStats.unusedRewards = rewardsData.filter((r: any) => !r.is_used && (!r.expires_at || new Date(r.expires_at) > new Date())).length;
        }
      } catch (err) {
        console.warn('Referral rewards table not available or query failed:', err);
      }

      // Return consolidated response
      return NextResponse.json({
        invitationCode: {
          code: invitationCode.code,
          currentUses: invitationCode.current_uses || 0,
          maxUses: invitationCode.max_uses,
          isActive: invitationCode.is_active,
          createdAt: invitationCode.created_at,
          expiresAt: invitationCode.expires_at || null
        },
        statistics: {
          totalReferrals: referralStats.totalReferrals,
          completedReferrals: referralStats.completedReferrals,
          pendingReferrals: referralStats.pendingReferrals,
          totalRewards: rewardStats.totalRewards,
          unusedRewards: rewardStats.unusedRewards
        },
        referrals,
        rewards
      });
    } catch (err: any) {
      // Generic fallback if invitation_codes table doesn't exist (safety)
      if (err?.code === 'PGRST116' || err?.message?.includes('relation') || err?.message?.includes('does not exist')) {
        return NextResponse.json({
          message: 'Invitation system coming soon',
          invitationCode: null,
          statistics: {
            totalReferrals: 0,
            completedReferrals: 0,
            pendingReferrals: 0,
            totalRewards: 0,
            unusedRewards: 0
          },
          referrals: [],
          rewards: []
        });
      }
      console.error('Unhandled error fetching invitation stats:', err);
      return NextResponse.json({ error: 'Failed to fetch invitation statistics' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error in GET /api/invitation/stats:', error);
    return NextResponse.json({ error: 'Failed to fetch invitation statistics' }, { status: 500 });
  }
}

export const GET = withCentralizedStateManagement(handleInvitationStatsRequest, '/api/invitation/stats', {
  priority: 'medium',
  maxRetries: 2,
  requireAuth: true
});
