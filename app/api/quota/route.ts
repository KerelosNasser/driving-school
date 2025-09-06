import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { rateLimit } from '@/lib/rate-limit';
import { supabaseAdmin } from '@/lib/api/utils';

// Rate limiting
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

async function getOrCreateSupabaseUserId(clerkUserId: string): Promise<string> {
  // 1) Try to find by clerk_id first
  const { data: existingByClerk } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_id', clerkUserId)
    .maybeSingle();

  if (existingByClerk?.id) return existingByClerk.id as string;

  // 2) Fetch Clerk user details
  const client = await clerkClient();
  const clerkUser = await client.users.getUser(clerkUserId);
  const email = clerkUser?.primaryEmailAddress?.emailAddress || clerkUser?.emailAddresses?.[0]?.emailAddress || '';
  const full_name = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') || clerkUser?.username || 'Unknown User';

  // 3) If a user with the same email already exists, link it to this Clerk account
  if (email) {
    const { data: existingByEmail } = await supabaseAdmin
      .from('users')
      .select('id, clerk_id')
      .eq('email', email)
      .maybeSingle();

    if (existingByEmail?.id) {
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('users')
        .update({ clerk_id: clerkUserId, full_name })
        .eq('id', existingByEmail.id)
        .select('id')
        .single();

      if (updateError || !updated?.id) {
        throw new Error(`Failed to link existing user to Clerk: ${updateError?.message || 'unknown error'}`);
      }
      return updated.id as string;
    }
  }

  // 4) Otherwise insert a new user. Handle race conditions on unique email.
  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('users')
    .insert({ clerk_id: clerkUserId, email, full_name })
    .select('id')
    .single();

  if (insertError || !inserted?.id) {
    // If email unique constraint hit due to race, fetch by email and link
    const message = (insertError as any)?.message || '';
    const code = (insertError as any)?.code || '';
    if (code === '23505' && message.includes('users_email_key') && email) {
      const { data: byEmailAfter } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      if (byEmailAfter?.id) {
        const { data: updated, error: updateError2 } = await supabaseAdmin
          .from('users')
          .update({ clerk_id: clerkUserId, full_name })
          .eq('id', byEmailAfter.id)
          .select('id')
          .single();
        if (updateError2 || !updated?.id) {
          throw new Error(`Failed to finalize user provisioning after conflict: ${updateError2?.message || 'unknown error'}`);
        }
        return updated.id as string;
      }
    }

    throw new Error(`Failed to provision user in Supabase: ${insertError?.message || 'unknown error'}`);
  }

  return inserted.id as string;
}

// GET - Fetch user's current quota
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    await limiter.check(request, 10, 'CACHE_TOKEN');

    // Get authenticated user (Clerk)
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Map or provision user in Supabase
    const supabaseUserId = await getOrCreateSupabaseUserId(clerkUserId);

    // Get user's quota information
    const { data: quota, error } = await supabase
      .from('user_quotas')
      .select('*')
      .eq('user_id', supabaseUserId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching quota:', error);
      return NextResponse.json({ error: 'Failed to fetch quota' }, { status: 500 });
    }

    // If no quota exists, return default values
    if (!quota) {
      return NextResponse.json({
        quota: {
          user_id: supabaseUserId,
          total_hours: 0,
          used_hours: 0,
          available_hours: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      });
    }

    // Return quota with available_hours (computed column from database)
    return NextResponse.json({ quota });
  } catch (error) {
    console.error('Quota API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add hours to user's quota (for package purchases)
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    await limiter.check(request, 5, 'CACHE_TOKEN');

    // Get authenticated user (Clerk)
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Map or provision user in Supabase
    const supabaseUserId = await getOrCreateSupabaseUserId(clerkUserId);

    const { hours, transaction_type, description, package_id, payment_id } = await request.json();

    if (!hours || hours <= 0) {
      return NextResponse.json({ error: 'Invalid hours amount' }, { status: 400 });
    }

    // Validate transaction type
    const validTransactionTypes = ['purchase', 'refund', 'adjustment', 'free_credit'];
    const finalTransactionType = transaction_type || 'purchase';
    
    if (!validTransactionTypes.includes(finalTransactionType)) {
      return NextResponse.json({ 
        error: 'Invalid transaction type',
        valid_types: validTransactionTypes 
      }, { status: 400 });
    }

    // Use the update_user_quota function to add hours
    const { data, error } = await supabase.rpc('update_user_quota', {
      p_user_id: supabaseUserId,
      p_hours_change: hours,
      p_transaction_type: finalTransactionType,
      p_description: description || `Added ${hours} hours`,
      p_package_id: package_id || null,
      p_payment_id: payment_id || null
    });

    if (error) {
      console.error('Error updating quota:', error);
      // Handle specific database errors
      if (error.message?.includes('Insufficient quota hours')) {
        return NextResponse.json({ 
          error: 'Insufficient quota balance',
          details: error.message 
        }, { status: 400 });
      }
      return NextResponse.json({ 
        error: 'Failed to update quota',
        details: error.message 
      }, { status: 500 });
    }

    // Get updated quota
    const { data: updatedQuota, error: fetchError } = await supabase
      .from('user_quotas')
      .select('*')
      .eq('user_id', supabaseUserId)
      .single();

    if (fetchError) {
      console.error('Error fetching updated quota:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch updated quota' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      quota: updatedQuota,
      message: `Successfully added ${hours} hours to your quota`
    });
  } catch (error) {
    console.error('Quota update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}