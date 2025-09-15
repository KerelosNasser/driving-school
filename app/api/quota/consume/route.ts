import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { withCentralizedStateManagement } from '@/lib/api-middleware';
import { supabaseAdmin } from '@/lib/api/utils';

// Centralized state management replaces individual rate limiting

async function getOrCreateSupabaseUserId(clerkUserId: string): Promise<string> {
  const { data: existingByClerk } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_id', clerkUserId)
    .maybeSingle();
  if (existingByClerk?.id) return existingByClerk.id as string;

  const ClerkClient = await clerkClient();
  const clerkUser = await ClerkClient.users.getUser(clerkUserId);
  const email =
    clerkUser?.primaryEmailAddress?.emailAddress ||
    clerkUser?.emailAddresses?.[0]?.emailAddress ||
    '';
  const full_name =
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') ||
    clerkUser?.username ||
    'Unknown User';

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

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('users')
    .insert({ clerk_id: clerkUserId, email, full_name })
    .select('id')
    .single();

  if (insertError || !inserted?.id) {
    const message = (insertError as any)?.message || '';
    const code = (insertError as any)?.code || '';
    if (code === '23505' && message.includes('users_email_key') && email) {
      const { data: after } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      if (after?.id) {
        const { data: updated, error: updateError2 } = await supabaseAdmin
          .from('users')
          .update({ clerk_id: clerkUserId, full_name })
          .eq('id', after.id)
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

// POST - Consume hours from user's quota (for booking lessons)
async function handleQuotaConsumeRequest(request: NextRequest) {
  try {

    // Get authenticated user
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create Supabase user ID
    const supabaseUserId = await getOrCreateSupabaseUserId(clerkUserId);

    // Check if request body is empty before parsing
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      return NextResponse.json({ error: 'Invalid or empty request body' }, { status: 400 });
    }
    
    const { hours, booking_id, description } = requestBody;

    if (!hours || hours <= 0) {
      return NextResponse.json({ error: 'Invalid hours amount' }, { status: 400 });
    }

    if (!booking_id) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    // First check if user has enough quota
    const { data: currentQuota, error: quotaError } = await supabase
      .from('user_quotas')
      .select('available_hours')
      .eq('user_id', supabaseUserId)
      .single();

    if (quotaError) {
      console.error('Error fetching current quota:', quotaError);
      return NextResponse.json({ error: 'Failed to check quota balance' }, { status: 500 });
    }

    if (!currentQuota || currentQuota.available_hours < hours) {
      return NextResponse.json({ 
        error: 'Insufficient quota balance',
        available_hours: currentQuota?.available_hours || 0,
        required_hours: hours
      }, { status: 400 });
    }

    // Use the update_user_quota function to consume hours
    const { error } = await supabase.rpc('update_user_quota', {
      p_user_id: supabaseUserId,
      p_hours_change: -hours, // Negative to consume hours
      p_transaction_type: 'booking',
      p_description: description || `Booked ${hours} hour lesson`,
      p_package_id: null,
      p_payment_id: null,
      p_booking_id: booking_id
    });

    if (error) {
      console.error('Error consuming quota:', error);
      // Handle specific database errors
      if (error.message?.includes('Insufficient quota hours')) {
        return NextResponse.json({ 
          error: 'Insufficient quota balance',
          details: error.message 
        }, { status: 400 });
      }
      return NextResponse.json({ 
        error: 'Failed to consume quota',
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
      consumed_hours: hours,
      message: `Successfully consumed ${hours} hours from your quota`
    });
  } catch (error) {
    console.error('Quota consumption error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = withCentralizedStateManagement(handleQuotaConsumeRequest, '/api/quota/consume', {
  priority: 'high',
  maxRetries: 1,
  requireAuth: true
});