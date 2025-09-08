import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId: clerkUserId } = auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeUsed = searchParams.get('includeUsed') === 'true';
    const includeExpired = searchParams.get('includeExpired') === 'true';

    // Get user ID from Clerk ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Build query conditions
    let query = supabase
      .from('referral_rewards')
      .select(`
        id,
        reward_type,
        reward_value,
        is_used,
        expires_at,
        created_at,
        used_at,
        referral_id,
        referrals (
          id,
          created_at,
          referred_user_id,
          users:referred_user_id (
            full_name,
            email
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (!includeUsed) {
      query = query.eq('is_used', false);
    }

    if (!includeExpired) {
      query = query.gte('expires_at', new Date().toISOString());
    }

    const { data: rewards, error: rewardsError } = await query;

    if (rewardsError) {
      console.error('Error fetching rewards:', rewardsError);
      return NextResponse.json(
        { message: 'Failed to fetch rewards' },
        { status: 500 }
      );
    }

    // Transform rewards data
    const formattedRewards = rewards?.map(reward => {
      const isExpired = new Date(reward.expires_at) < new Date();
      const isAvailable = !reward.is_used && !isExpired;

      // Get reward metadata
      let rewardMeta = {
        title: 'Unknown Reward',
        description: 'Unknown reward type',
        icon: 'gift',
        color: 'gray',
        valueDisplay: reward.reward_value?.toString() || '0'
      };

      switch (reward.reward_type) {
        case 'discount_30_percent':
          rewardMeta = {
            title: '30% Discount',
            description: 'Off your next booking',
            icon: 'percent',
            color: 'blue',
            valueDisplay: '30%'
          };
          break;
        case 'free_hours_2':
          rewardMeta = {
            title: '2 Free Hours',
            description: 'Driving lessons',
            icon: 'clock',
            color: 'green',
            valueDisplay: '2 Hours'
          };
          break;
      }

      return {
        id: reward.id,
        type: reward.reward_type,
        value: reward.reward_value,
        meta: rewardMeta,
        status: {
          isUsed: reward.is_used,
          isExpired,
          isAvailable
        },
        dates: {
          created: reward.created_at,
          expires: reward.expires_at,
          used: reward.used_at
        },
        referral: reward.referrals ? {
          id: reward.referrals.id,
          createdAt: reward.referrals.created_at,
          referredUser: {
            name: reward.referrals.users?.full_name,
            email: reward.referrals.users?.email
          }
        } : null
      };
    }) || [];

    // Get summary statistics
    const stats = {
      total: formattedRewards.length,
      available: formattedRewards.filter(r => r.status.isAvailable).length,
      used: formattedRewards.filter(r => r.status.isUsed).length,
      expired: formattedRewards.filter(r => r.status.isExpired && !r.status.isUsed).length
    };

    return NextResponse.json({
      rewards: formattedRewards,
      statistics: stats,
      filters: {
        includeUsed,
        includeExpired
      }
    });

  } catch (error) {
    console.error('Get rewards error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
