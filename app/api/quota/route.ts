import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withCentralizedStateManagement } from '@/lib/api-middleware';
import { auth } from '@clerk/nextjs/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const supabaseAdmin = supabase;

// GET - Fetch user's current quota
async function handleQuotaGetRequest(_request: NextRequest) {
  try {
    // Get authenticated user (Clerk)
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify Supabase connection
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase credentials not configured');
      return NextResponse.json({ error: 'Database configuration error' }, { status: 500 });
    }

    // Get user from database using clerk_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json({ error: 'Failed to fetch user', details: userError.message }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const supabaseUserId = user.id;

    // Get user's quota information
    const { data: quota, error } = await supabase
      .from('user_quotas')
      .select('*')
      .eq('user_id', supabaseUserId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching quota:', error);
      return NextResponse.json({ error: 'Failed to fetch quota', details: error.message }, { status: 500 });
    }

    // If no quota exists, return default values
    if (!quota) {
      return NextResponse.json({
        quota: {
          user_id: supabaseUserId,
          total_hours: 0,
          used_hours: 0,
          remaining_hours: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      });
    }

    // Calculate remaining hours and return quota
    const quotaWithRemaining = {
      ...quota,
      remaining_hours: (quota.total_hours || 0) - (quota.used_hours || 0)
    };
    
    return NextResponse.json({ quota: quotaWithRemaining });
  } catch (error) {
    console.error('Quota API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('Error fetching quota:', { message: errorMessage, details: errorStack });
    return NextResponse.json({ 
      error: 'Internal server error',
      message: errorMessage,
      details: errorStack
    }, { status: 500 });
  }
}

// POST - Add hours to user's quota (for package purchases)
async function handleQuotaPostRequest(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
     }

    // Map or provision user in Supabase - USING TEST USER
    const supabaseUserId = '550e8400-e29b-41d4-a716-446655440000'; // await getOrCreateSupabaseUserId(clerkUserId);

    // Check if request body is empty before parsing
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      return NextResponse.json({ error: 'Invalid or empty request body', details: error }, { status: 400 });
    }
    
    const { hours, transaction_type, description, package_id, payment_id } = requestBody;

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

    // Update user quota directly since RPC function doesn't exist
    const { data: existingQuota } = await supabaseAdmin
      .from('user_quotas')
      .select('*')
      .eq('user_id', supabaseUserId)
      .single();

    if (!existingQuota) {
      // Create new quota record
      const { error: createError } = await supabaseAdmin
        .from('user_quotas')
        .insert({
          user_id: supabaseUserId,
          total_hours: hours,
          used_hours: 0
        });
      
      if (createError) {
        console.error('Error creating user quota:', createError);
        return NextResponse.json({ error: 'Failed to create quota' }, { status: 500 });
      }
    } else {
      // Update existing quota
      const { error: updateError } = await supabaseAdmin
        .from('user_quotas')
        .update({
          total_hours: parseFloat(existingQuota.total_hours) + hours,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', supabaseUserId);
      
      if (updateError) {
        console.error('Error updating user quota:', updateError);
        return NextResponse.json({ error: 'Failed to update quota' }, { status: 500 });
      }
    }

    // Log the transaction
    const { error: transactionError } = await supabaseAdmin
      .from('quota_transactions')
      .insert({
        user_id: supabaseUserId,
        transaction_type: finalTransactionType,
        hours_change: hours,
        amount_paid: 0, // Default for manual additions
        description: description || `Added ${hours} hours`,
        package_id: package_id || null,
        payment_id: payment_id || null,
        metadata: {}
      });

    const error = transactionError;

    if (error) {
      console.error('Error logging transaction:', error);
      return NextResponse.json({ 
        error: 'Failed to log transaction',
        details: error.message 
      }, { status: 500 });
    }

    // Get updated quota
    const { data: updatedQuota, error: fetchError } = await supabaseAdmin
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

// Export handlers with centralized state management
export const GET = withCentralizedStateManagement(handleQuotaGetRequest, '/api/quota', {
  priority: 'medium',
  maxRetries: 2,
  requireAuth: true
});

export const POST = withCentralizedStateManagement(handleQuotaPostRequest, '/api/quota', {
  priority: 'high',
  maxRetries: 1,
  requireAuth: true
});