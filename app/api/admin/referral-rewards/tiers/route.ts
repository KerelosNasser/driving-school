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

// GET - Fetch all reward tiers
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

    const supabase = await createServerComponentClient({ cookies });

    const { data: tiers, error } = await supabase
      .from('reward_tiers')
      .select('*')
      .order('required_referrals', { ascending: true });

    if (error) {
      console.error('Error fetching reward tiers:', error);
      return NextResponse.json({ error: 'Failed to fetch reward tiers' }, { status: 500 });
    }

    return NextResponse.json({ tiers: tiers || [] });

  } catch (error) {
    console.error('GET /api/admin/referral-rewards/tiers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new reward tier
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
      tier_name,
      required_referrals,
      reward_type,
      reward_value,
      package_id,
      is_active = true
    } = body;

    // Validate required fields
    if (!tier_name || !required_referrals || !reward_type || reward_value === undefined) {
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
        name: tier_name,
        required_referrals,
        reward_type,
        reward_value,
        package_id,
        is_active,
        created_by: userData?.id
      })
      .select()
      .single();

    if (error) {
      console.error('Create tier error:', error);
      return NextResponse.json({ error: 'Failed to create reward tier' }, { status: 500 });
    }

    return NextResponse.json({ tier: newTier });

  } catch (error) {
    console.error('POST /api/admin/referral-rewards/tiers error:', error);
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
      tier_name,
      required_referrals,
      reward_type,
      reward_value,
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
        name: tier_name,
        required_referrals,
        reward_type,
        reward_value,
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
    console.error('PUT /api/admin/referral-rewards/tiers error:', error);
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
    console.error('DELETE /api/admin/referral-rewards/tiers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
