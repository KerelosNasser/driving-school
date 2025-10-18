import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { invitationCode, newUserId, newUserEmail: _newUserEmail } = await request.json();

    if (!invitationCode || !newUserId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find the referrer
    const { data: referrer, error: referrerError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('invitation_code', invitationCode.trim())
      .single();

    if (referrerError || !referrer) {
      return NextResponse.json(
        { error: 'Invalid invitation code' },
        { status: 400 }
      );
    }

    // Prevent self-referral
    if (referrer.id === newUserId) {
      return NextResponse.json(
        { error: 'Cannot refer yourself' },
        { status: 400 }
      );
    }

    // Check if referral already exists
    const { data: existingReferral } = await supabase
      .from('referrals')
      .select('id')
      .eq('referrer_user_id', referrer.id)
      .eq('referred_user_id', newUserId)
      .single();

    if (existingReferral) {
      return NextResponse.json(
        { error: 'Referral already processed' },
        { status: 409 }
      );
    }

    // Record the referral
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .insert({
        referrer_user_id: referrer.id,
        referred_user_id: newUserId,
        invitation_code: invitationCode,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (referralError) {
      console.error('Error recording referral:', referralError);
      return NextResponse.json(
        { error: 'Failed to record referral' },
        { status: 500 }
      );
    }

    // Update referrer's invitation code usage count if using invitation_codes table
    try {
      const { data: codeData } = await supabase
        .from('invitation_codes')
        .select('id, current_uses')
        .eq('user_id', referrer.id)
        .eq('is_active', true)
        .single();

      if (codeData) {
        await supabase
          .from('invitation_codes')
          .update({
            current_uses: (codeData.current_uses || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', codeData.id);
      }
    } catch (codeError) {
      // invitation_codes table might not exist, continue anyway
      console.warn('Could not update invitation code usage:', codeError);
    }

    // Check for reward eligibility and distribute rewards
    await checkAndDistributeRewards(referrer.id);

    return NextResponse.json({
      success: true,
      referral_id: referral.id,
      message: 'Referral processed successfully'
    });

  } catch (error) {
    console.error('Error processing referral:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Function to check referral count and distribute appropriate rewards
async function checkAndDistributeRewards(userId: string) {
  try {
    // Get user's current referral count
    const { count: referralCount } = await supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_user_id', userId)
      .eq('status', 'completed');

    if (!referralCount) return;

    // Get active reward tiers that the user qualifies for
    const { data: eligibleTiers } = await supabase
      .from('reward_tiers')
      .select('*')
      .eq('is_active', true)
      .lte('required_referrals', referralCount)
      .order('required_referrals', { ascending: false });

    if (!eligibleTiers || eligibleTiers.length === 0) return;

    // Check which rewards the user has already received
    const { data: receivedRewards } = await supabase
      .from('referral_rewards')
      .select('tier_id, reward_type, reward_value')
      .eq('user_id', userId)
      .eq('source', 'referral')
      .not('tier_id', 'is', null);

    const receivedRewardKeys = new Set(
      (receivedRewards || []).map(r => `${r.tier_id}-${r.reward_type}-${r.reward_value}`)
    );

    // Distribute new rewards for newly qualified tiers
    for (const tier of eligibleTiers) {
      const rewardKey = `${tier.id}-${tier.reward_type}-${tier.reward_value}`;

      if (!receivedRewardKeys.has(rewardKey)) {
        // User qualifies for this tier reward and hasn't received it yet
        const { error: rewardError } = await supabase
          .from('referral_rewards')
          .insert({
            user_id: userId,
            reward_type: tier.reward_type,
            reward_value: tier.reward_value,
            package_id: tier.package_id,
            tier_id: tier.id,
            source: 'referral',
            reason: `Earned ${tier.name} - ${referralCount} referrals`,
            earned_at: new Date().toISOString()
          });

        if (rewardError) {
          console.error('Error distributing reward:', rewardError);
        } else {
          console.log(`Distributed ${tier.reward_type} reward to user ${userId} for tier ${tier.name}`);

          // Update user's referral progress tracking
          await updateUserReferralProgress(userId, referralCount);
        }
      }
    }

  } catch (error) {
    console.error('Error in checkAndDistributeRewards:', error);
  }
}

// Function to update user referral progress
async function updateUserReferralProgress(userId: string, referralCount: number) {
  try {
    // Update or insert user referral progress
    const { error } = await supabase
      .from('user_referral_progress')
      .upsert({
        user_id: userId,
        completed_referrals: referralCount,
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error updating referral progress:', error);
    }
  } catch (error) {
    console.error('Error in updateUserReferralProgress:', error);
  }
}
