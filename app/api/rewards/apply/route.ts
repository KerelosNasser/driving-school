import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '@/lib/rate-limit';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Rate limiting configuration
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

interface ApplyRewardRequest {
  rewardId: string;
  context: 'booking' | 'quota_purchase';
  contextId?: string; // booking_id or transaction_id
  amount?: number; // For discount calculation
}

// Get client IP address
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  
  return '127.0.0.1';
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIP(request);
    const { success } = await limiter.check(request, 10, identifier); // 10 requests per minute per IP
    if (!success) {
      return NextResponse.json(
        { message: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Check authentication
    const { userId: clerkUserId } = auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: ApplyRewardRequest = await request.json();
    const { rewardId, context, contextId, amount } = body;

    if (!rewardId || !context) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

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

    // Get reward details and verify ownership
    const { data: reward, error: rewardError } = await supabase
      .from('referral_rewards')
      .select(`
        id,
        reward_type,
        reward_value,
        is_used,
        expires_at,
        user_id
      `)
      .eq('id', rewardId)
      .eq('user_id', user.id)
      .single();

    if (rewardError || !reward) {
      return NextResponse.json(
        { message: 'Reward not found or not owned by user' },
        { status: 404 }
      );
    }

    // Check if reward is still valid
    if (reward.is_used) {
      return NextResponse.json(
        { message: 'Reward has already been used' },
        { status: 400 }
      );
    }

    if (new Date(reward.expires_at) < new Date()) {
      return NextResponse.json(
        { message: 'Reward has expired' },
        { status: 400 }
      );
    }

    // Apply reward based on type and context
    let appliedValue = 0;
    let description = '';

    if (reward.reward_type === 'discount_30_percent') {
      if (context !== 'booking' || !amount) {
        return NextResponse.json(
          { message: 'Discount rewards can only be applied to bookings with an amount' },
          { status: 400 }
        );
      }

      appliedValue = Math.round((amount * 30) / 100 * 100) / 100; // 30% discount, rounded to 2 decimal places
      description = `30% discount applied to booking`;

    } else if (reward.reward_type === 'free_hours_2') {
      if (context === 'booking') {
        // For bookings: apply as discount equivalent to 2 hours at average rate
        const averageHourRate = 50; // You might want to fetch this dynamically
        appliedValue = 2 * averageHourRate;
        description = `2 free hours applied as ${appliedValue} discount`;
      } else if (context === 'quota_purchase') {
        // For quota: directly add hours
        appliedValue = 2;
        description = `2 free hours added to quota`;
        
        // Add hours to user quota
        try {
          const { error: quotaError } = await supabase
            .rpc('update_user_quota', {
              p_user_id: user.id,
              p_hours_change: appliedValue,
              p_transaction_type: 'free_credit',
              p_description: 'Referral reward: 2 free hours',
              p_booking_id: null,
              p_payment_intent_id: null,
              p_amount: null,
              p_currency: null,
              p_metadata: JSON.stringify({
                reward_id: rewardId,
                reward_type: reward.reward_type
              })
            });

          if (quotaError) {
            throw new Error('Failed to update quota: ' + quotaError.message);
          }
        } catch (quotaErr) {
          console.error('Quota update error:', quotaErr);
          return NextResponse.json(
            { message: 'Failed to apply reward to quota' },
            { status: 500 }
          );
        }
      }
    } else {
      return NextResponse.json(
        { message: 'Unknown reward type' },
        { status: 400 }
      );
    }

    // Mark reward as used
    const { error: updateError } = await supabase
      .from('referral_rewards')
      .update({
        is_used: true,
        used_at: new Date().toISOString(),
        applied_to_booking_id: context === 'booking' ? contextId : null,
        applied_to_transaction_id: context === 'quota_purchase' ? contextId : null
      })
      .eq('id', rewardId);

    if (updateError) {
      console.error('Error marking reward as used:', updateError);
      return NextResponse.json(
        { message: 'Failed to apply reward' },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({
      message: 'Reward applied successfully',
      appliedValue,
      description,
      rewardType: reward.reward_type,
      context
    });

  } catch (error) {
    console.error('Apply reward error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to validate reward before application
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
    const rewardId = searchParams.get('rewardId');
    const context = searchParams.get('context');
    const amount = searchParams.get('amount');

    if (!rewardId || !context) {
      return NextResponse.json(
        { message: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get user ID
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

    // Get reward details
    const { data: reward, error: rewardError } = await supabase
      .from('referral_rewards')
      .select(`
        id,
        reward_type,
        reward_value,
        is_used,
        expires_at
      `)
      .eq('id', rewardId)
      .eq('user_id', user.id)
      .single();

    if (rewardError || !reward) {
      return NextResponse.json(
        { valid: false, message: 'Reward not found or not owned by user' },
        { status: 404 }
      );
    }

    // Check validity
    const isExpired = new Date(reward.expires_at) < new Date();
    const isUsed = reward.is_used;

    let expectedValue = 0;
    let canApply = true;
    let message = '';

    if (isUsed) {
      canApply = false;
      message = 'Reward has already been used';
    } else if (isExpired) {
      canApply = false;
      message = 'Reward has expired';
    } else {
      // Calculate expected value
      if (reward.reward_type === 'discount_30_percent') {
        if (context === 'booking' && amount) {
          expectedValue = Math.round((parseFloat(amount) * 30) / 100 * 100) / 100;
          message = `30% discount (${expectedValue}) will be applied`;
        } else {
          canApply = false;
          message = 'Discount rewards can only be applied to bookings';
        }
      } else if (reward.reward_type === 'free_hours_2') {
        if (context === 'booking') {
          const averageHourRate = 50;
          expectedValue = 2 * averageHourRate;
          message = `2 free hours (${expectedValue} discount) will be applied`;
        } else if (context === 'quota_purchase') {
          expectedValue = 2;
          message = '2 free hours will be added to your quota';
        }
      }
    }

    return NextResponse.json({
      valid: canApply,
      message,
      expectedValue,
      rewardType: reward.reward_type,
      expiresAt: reward.expires_at
    });

  } catch (error) {
    console.error('Validate reward error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
