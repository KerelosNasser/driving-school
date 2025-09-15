import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// POST - Admin gift reward to user
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerComponentClient({ cookies });

    // Check if user is admin
    const { data: adminUser } = await supabase
      .from('users')
      .select('id, role')
      .eq('clerk_id', userId)
      .single();

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      recipient_user_id, 
      reward_type, 
      reward_value, 
      package_id = null,
      reason = 'Admin gift',
      expires_at = null,
      notify_user = true
    } = body;

    // Validate required fields
    if (!recipient_user_id || !reward_type || !reward_value) {
      return NextResponse.json({ 
        error: 'Missing required fields: recipient_user_id, reward_type, reward_value' 
      }, { status: 400 });
    }

    // Validate reward type
    if (!['discount', 'free_package'].includes(reward_type)) {
      return NextResponse.json({ 
        error: 'Invalid reward_type. Must be "discount" or "free_package"' 
      }, { status: 400 });
    }

    // If free_package, package_id is required
    if (reward_type === 'free_package' && !package_id) {
      return NextResponse.json({ 
        error: 'package_id is required for free_package rewards' 
      }, { status: 400 });
    }

    // Verify recipient user exists
    const { data: recipientUser } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('id', recipient_user_id)
      .single();

    if (!recipientUser) {
      return NextResponse.json({ error: 'Recipient user not found' }, { status: 404 });
    }

    // If package_id provided, verify package exists
    let packageInfo = null;
    if (package_id) {
      const { data: pkg } = await supabase
        .from('packages')
        .select('id, name, price')
        .eq('id', package_id)
        .single();

      if (!pkg) {
        return NextResponse.json({ error: 'Package not found' }, { status: 404 });
      }
      packageInfo = pkg;
    }

    // Create the reward record
    const { data: reward, error: rewardError } = await supabase
      .from('referral_rewards')
      .insert({
        user_id: recipient_user_id,
        reward_type,
        reward_value,
        package_id,
        is_used: false,
        earned_at: new Date().toISOString(),
        expires_at: expires_at ? new Date(expires_at).toISOString() : null,
        source: 'admin_gift',
        metadata: {
          gifted_by_admin: adminUser.id,
          reason,
          admin_gift: true
        }
      })
      .select()
      .single();

    if (rewardError) {
      console.error('Create reward error:', rewardError);
      return NextResponse.json({ error: 'Failed to create reward' }, { status: 500 });
    }

    // Create audit log
    await supabase
      .from('reward_audit_logs')
      .insert({
        user_id: recipient_user_id,
        reward_id: reward.id,
        action: 'admin_gift',
        admin_user_id: adminUser.id,
        details: {
          reward_type,
          reward_value,
          package_id,
          reason,
          recipient_email: recipientUser.email
        }
      });

    // Send notification to user if requested
    if (notify_user) {
      let notificationTitle = 'You received a reward!';
      let notificationMessage = '';

      if (reward_type === 'discount') {
        notificationTitle = `${reward_value}% Discount Reward!`;
        notificationMessage = `Congratulations! You've received a ${reward_value}% discount reward from our admin team. ${reason ? `Reason: ${reason}` : ''}`;
      } else if (reward_type === 'free_package') {
        notificationTitle = 'Free Package Reward!';
        notificationMessage = `Amazing! You've received a free ${packageInfo?.name || 'package'} reward from our admin team. ${reason ? `Reason: ${reason}` : ''}`;
      }

      await supabase
        .from('user_notifications')
        .insert({
          user_id: recipient_user_id,
          type: 'reward_received',
          title: notificationTitle,
          message: notificationMessage,
          data: {
            reward_id: reward.id,
            reward_type,
            reward_value,
            package_id,
            source: 'admin_gift'
          },
          expires_at: expires_at ? new Date(expires_at).toISOString() : null
        });
    }

    // Prepare response data
    const responseData = {
      success: true,
      reward: {
        id: reward.id,
        reward_type,
        reward_value,
        package_id,
        package_name: packageInfo?.name || null,
        expires_at: reward.expires_at,
        created_at: reward.earned_at
      },
      recipient: {
        id: recipientUser.id,
        email: recipientUser.email,
        name: `${recipientUser.first_name || ''} ${recipientUser.last_name || ''}`.trim()
      },
      notification_sent: notify_user,
      message: `Reward successfully gifted to ${recipientUser.email}`
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('POST /api/admin/referral-rewards/gift error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Get gift history (admin only)
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerComponentClient({ cookies });

    // Check if user is admin
    const { data: adminUser } = await supabase
      .from('users')
      .select('id, role')
      .eq('clerk_id', userId)
      .single();

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get admin-gifted rewards with user and package info
    const { data: gifts, count, error } = await supabase
      .from('referral_rewards')
      .select(`
        *,
        users!inner(id, email, first_name, last_name),
        packages(id, name, price)
      `, { count: 'exact' })
      .eq('source', 'admin_gift')
      .order('earned_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Fetch gift history error:', error);
      return NextResponse.json({ error: 'Failed to fetch gift history' }, { status: 500 });
    }

    // Format the response
    const formattedGifts = gifts?.map(gift => ({
      id: gift.id,
      reward_type: gift.reward_type,
      reward_value: gift.reward_value,
      package: gift.packages ? {
        id: gift.packages.id,
        name: gift.packages.name,
        price: gift.packages.price
      } : null,
      recipient: {
        id: gift.users.id,
        email: gift.users.email,
        name: `${gift.users.first_name || ''} ${gift.users.last_name || ''}`.trim()
      },
      is_used: gift.is_used,
      used_at: gift.used_at,
      earned_at: gift.earned_at,
      expires_at: gift.expires_at,
      reason: gift.metadata?.reason || 'Admin gift',
      gifted_by_admin: gift.metadata?.gifted_by_admin
    })) || [];

    return NextResponse.json({
      gifts: formattedGifts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('GET /api/admin/referral-rewards/gift error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}