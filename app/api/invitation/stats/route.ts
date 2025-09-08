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

    // Get user ID from Clerk ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, invitation_code')
      .eq('clerk_id', clerkUserId)
      .single();

    if (userError || !user) {
      console.log('User not found in database:', userError);
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if invitation_codes table exists and get invitation code stats
    const { data: invitationCode, error: codeError } = await supabase
      .from('invitation_codes')
      .select(`
        id,
        code,
        current_uses,
        max_uses,
        is_active,
        created_at
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    // If invitation system not set up, return basic fallback
    if (codeError) {
      console.log('Invitation codes table not found or no active code:', codeError);
      // Generate a basic invitation code from user info as placeholder
      const basicCode = user.invitation_code || 'COMING-SOON';
      
      return NextResponse.json({
        invitationCode: {
          code: basicCode,
          currentUses: 0,
          maxUses: null,
          isActive: false,
          createdAt: new Date().toISOString()
        },
        statistics: {
          totalReferrals: 0,
          completedReferrals: 0,
          pendingReferrals: 0,
          totalRewards: 0,
          unusedRewards: 0
        },
        referrals: [],
        rewards: [],
        message: 'Invitation system coming soon'
      });
    }

    // Get referrals data
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select(`
        id,
        status,
        created_at,
        completed_at,
        referred_user_id,
        users:referred_user_id (
          full_name,
          email
        )
      `)
      .eq('referrer_user_id', user.id)
      .order('created_at', { ascending: false });

    if (referralsError) {
      console.error('Error fetching referrals:', referralsError);
    }

    // Get reward statistics
    const { data: rewards, error: rewardsError } = await supabase
      .from('referral_rewards')
      .select(`
        id,
        reward_type,
        reward_value,
        is_used,
        created_at,
        expires_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (rewardsError) {
      console.error('Error fetching rewards:', rewardsError);
    }

    // Calculate summary statistics
    const completedReferrals = referrals?.filter(r => r.status === 'completed') || [];
    const pendingReferrals = referrals?.filter(r => r.status === 'pending') || [];
    const unusedRewards = rewards?.filter(r => !r.is_used && new Date(r.expires_at) > new Date()) || [];

    return NextResponse.json({
      invitationCode: {
        code: invitationCode.code,
        currentUses: invitationCode.current_uses,
        maxUses: invitationCode.max_uses,
        isActive: invitationCode.is_active,
        createdAt: invitationCode.created_at
      },
      statistics: {
        totalReferrals: referrals?.length || 0,
        completedReferrals: completedReferrals.length,
        pendingReferrals: pendingReferrals.length,
        totalRewards: rewards?.length || 0,
        unusedRewards: unusedRewards.length
      },
      referrals: completedReferrals.map(r => ({
        id: r.id,
        referredUser: {
          name: r.users?.full_name,
          email: r.users?.email
        },
        completedAt: r.completed_at,
        createdAt: r.created_at
      })),
      rewards: unusedRewards.map(r => ({
        id: r.id,
        type: r.reward_type,
        value: r.reward_value,
        expiresAt: r.expires_at,
        createdAt: r.created_at
      }))
    });

  } catch (error) {
    console.error('Invitation stats error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
