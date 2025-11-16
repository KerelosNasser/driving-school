import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { isUserAdmin } from '@/lib/auth-helpers';

// GET - Fetch referral rewards overview and statistics
export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'overview') {
      // Get comprehensive overview data
      const [
        { data: rewardTiers },
        { data: recentRewards },
        { data: topReferrers },
        { data: systemStats }
      ] = await Promise.all([
        // Active reward tiers
        supabase
          .from('reward_tiers')
          .select('*')
          .eq('is_active', true)
          .order('required_referrals', { ascending: true }),

        // Recent rewards (last 30 days)
        supabase
          .from('referral_rewards')
          .select(`
            *,
            users!referral_rewards_user_id_fkey(id, email, full_name),
            reward_tiers(name, description)
          `)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(20),

        // Top referrers from materialized view
        supabase
          .from('user_referral_progress')
          .select('*')
          .order('completed_referrals', { ascending: false })
          .limit(10),

        // System statistics
        supabase.rpc('get_referral_system_stats')
      ]);

      return NextResponse.json({
        rewardTiers: rewardTiers || [],
        recentRewards: recentRewards || [],
        topReferrers: topReferrers || [],
        systemStats: systemStats || {
          totalUsers: 0,
          totalReferrals: 0,
          totalRewards: 0,
          activeRewardTiers: 0
        }
      });
    }

    if (action === 'tiers') {
      // Get all reward tiers
      const { data: tiers, error } = await supabase
        .from('reward_tiers')
        .select('*')
        .order('required_referrals', { ascending: true });

      if (error) {
        return NextResponse.json({ error: 'Failed to fetch reward tiers' }, { status: 500 });
      }

      return NextResponse.json({ tiers: tiers || [] });
    }

    if (action === 'users') {
      // Get user referral progress with pagination
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const search = searchParams.get('search');
      const offset = (page - 1) * limit;

      let query = supabase
        .from('user_referral_progress')
        .select('*', { count: 'exact' });

      if (search) {
        query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
      }

      const { data: users, count, error } = await query
        .order('completed_referrals', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
      }

      return NextResponse.json({
        users: users || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      });
    }

    return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });

  } catch (error) {
    console.error('GET /api/admin/referral-rewards error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new reward tier or gift reward to user
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
    const { action } = body;

    if (action === 'create_tier') {
      const {
        name,
        description,
        required_referrals,
        reward_type,
        reward_value,
        reward_metadata = {},
        package_id
      } = body;

      // Validate required fields
      if (!name || !required_referrals || !reward_type || reward_value === undefined) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      // Check if tier with same referral count already exists
      const { data: existingTier } = await supabase
        .from('reward_tiers')
        .select('id')
        .eq('required_referrals', required_referrals)
        .eq('is_active', true)
        .single();

      if (existingTier) {
        return NextResponse.json({ 
          error: 'A reward tier for this referral count already exists' 
        }, { status: 409 });
      }

      // Get user info for created_by
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', userId)
        .single();

      const { data: newTier, error } = await supabase
        .from('reward_tiers')
        .insert({
          name,
          description,
          required_referrals,
          reward_type,
          reward_value,
          reward_metadata,
          package_id,
          created_by: userData?.id
        })
        .select()
        .single();

      if (error) {
        console.error('Create tier error:', error);
        return NextResponse.json({ error: 'Failed to create reward tier' }, { status: 500 });
      }

      return NextResponse.json({ tier: newTier });
    }

    if (action === 'gift_reward') {
      const {
        user_id,
        reward_type,
        reward_value,
        reason
      } = body;

      // Validate required fields
      if (!user_id || !reward_type || reward_value === undefined) {
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

      // Use the database function to gift reward
      const { data: result, error } = await supabase.rpc('gift_reward_to_user', {
        p_user_id: user_id,
        p_reward_type: reward_type,
        p_reward_value: reward_value,
        p_gifted_by: adminUser.id,
        p_reason: reason || 'Admin gifted reward',
        p_metadata: { gifted_via: 'admin_panel' }
      });

      if (error) {
        console.error('Gift reward error:', error);
        return NextResponse.json({ error: 'Failed to gift reward' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        reward_id: result,
        message: 'Reward gifted successfully' 
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('POST /api/admin/referral-rewards error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update reward tier
export async function PUT(request: NextRequest) {
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
      id,
      name,
      description,
      required_referrals,
      reward_type,
      reward_value,
      reward_metadata,
      package_id,
      is_active
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Tier ID is required' }, { status: 400 });
    }

    // Check if changing referral count conflicts with existing tier
    if (required_referrals) {
      const { data: existingTier } = await supabase
        .from('reward_tiers')
        .select('id')
        .eq('required_referrals', required_referrals)
        .eq('is_active', true)
        .neq('id', id)
        .single();

      if (existingTier) {
        return NextResponse.json({ 
          error: 'Another active tier already exists for this referral count' 
        }, { status: 409 });
      }
    }

    const { data: updatedTier, error } = await supabase
      .from('reward_tiers')
      .update({
        name,
        description,
        required_referrals,
        reward_type,
        reward_value,
        reward_metadata,
        package_id,
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update tier error:', error);
      return NextResponse.json({ error: 'Failed to update reward tier' }, { status: 500 });
    }

    return NextResponse.json({ tier: updatedTier });

  } catch (error) {
    console.error('PUT /api/admin/referral-rewards error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete reward tier
export async function DELETE(request: NextRequest) {
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
    const { searchParams } = new URL(request.url);
    const tierId = searchParams.get('id');

    if (!tierId) {
      return NextResponse.json({ error: 'Tier ID is required' }, { status: 400 });
    }

    // Check if tier has associated rewards
    const { data: associatedRewards } = await supabase
      .from('referral_rewards')
      .select('id')
      .eq('tier_id', tierId)
      .limit(1);

    if (associatedRewards && associatedRewards.length > 0) {
      // Soft delete by deactivating instead of hard delete
      const { error } = await supabase
        .from('reward_tiers')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', tierId);

      if (error) {
        return NextResponse.json({ error: 'Failed to deactivate reward tier' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Reward tier deactivated (has associated rewards)' 
      });
    } else {
      // Hard delete if no associated rewards
      const { error } = await supabase
        .from('reward_tiers')
        .delete()
        .eq('id', tierId);

      if (error) {
        return NextResponse.json({ error: 'Failed to delete reward tier' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Reward tier deleted successfully' 
      });
    }

  } catch (error) {
    console.error('DELETE /api/admin/referral-rewards error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
