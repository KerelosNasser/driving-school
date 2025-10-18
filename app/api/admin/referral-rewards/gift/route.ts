import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const client = await clerkClient()
    const user = await client.users.getUser(userId);
    return user.publicMetadata?.role === 'admin' || process.env.NODE_ENV === 'development';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// POST - Gift a reward to a user
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isUserAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const supabase = await createServerComponentClient({ cookies });
    const body = await request.json();
    const {
      recipient_user_id,
      reward_type,
      reward_value,
      package_id,
      reason,
      expires_at,
      notify_user = true
    } = body;

    // Validate required fields
    if (!recipient_user_id || !reward_type || reward_value === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get admin user info
    const { data: adminUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }

    // Verify recipient user exists
    const { data: recipientUser } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('id', recipient_user_id)
      .single();

    if (!recipientUser) {
      return NextResponse.json({ error: 'Recipient user not found' }, { status: 404 });
    }

    // Create the reward using the database function if available, otherwise insert directly
    let rewardResult;

    try {
      // Try to use the database function first
      const { data: functionResult, error: functionError } = await supabase.rpc('gift_reward_to_user', {
        p_user_id: recipient_user_id,
        p_reward_type: reward_type,
        p_reward_value: reward_value,
        p_gifted_by: adminUser.id,
        p_reason: reason || 'Admin gifted reward',
        p_metadata: {
          gifted_via: 'admin_panel',
          package_id: package_id,
          expires_at: expires_at
        }
      });

      if (functionError) {
        console.warn('Database function not available, using direct insert:', functionError);
        throw new Error('Database function not available');
      }

      rewardResult = functionResult;
    } catch (functionError) {
      // Fallback to direct insert
      const { data: directReward, error: insertError } = await supabase
        .from('referral_rewards')
        .insert({
          user_id: recipient_user_id,
          reward_type,
          reward_value,
          package_id,
          source: 'admin_gift',
          gifted_by: adminUser.id,
          reason: reason || 'Admin gifted reward',
          expires_at: expires_at || null,
          metadata: {
            gifted_via: 'admin_panel'
          }
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating reward:', insertError);
        return NextResponse.json({ error: 'Failed to create reward' }, { status: 500 });
      }

      rewardResult = directReward;
    }

    // Send notification if requested (you can implement email notification here)
    if (notify_user) {
      try {
        // TODO: Implement email notification
        console.log(`Notification: Reward gifted to ${recipientUser.email} - ${reward_type} ${reward_value}`);
      } catch (notificationError) {
        console.warn('Failed to send notification:', notificationError);
      }
    }

    return NextResponse.json({
      success: true,
      reward_id: rewardResult?.id || rewardResult,
      message: 'Reward gifted successfully'
    });

  } catch (error) {
    console.error('POST /api/admin/referral-rewards/gift error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
