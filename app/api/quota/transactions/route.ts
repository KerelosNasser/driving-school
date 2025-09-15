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

// GET - Fetch user's quota transaction history
async function handleQuotaTransactionsRequest(request: NextRequest) {
  try {
    // Get authenticated user
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUserId = await getOrCreateSupabaseUserId(clerkUserId);

    // Get query parameters for pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Max 100 per page
    const offset = (page - 1) * limit;

    // Get transaction type filter if provided
    const transactionType = searchParams.get('type');

    // Build query with proper joins
    let query = supabase
      .from('quota_transactions')
      .select(`
        id,
        user_id,
        transaction_type,
        hours_change,
        amount_paid,
        description,
        package_id,
        booking_id,
        payment_id,
        metadata,
        created_at,
        created_by,
        packages:package_id(name, hours),
        bookings:booking_id(date, time, status)
      `)
      .eq('user_id', supabaseUserId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply transaction type filter if provided
    if (transactionType && ['purchase', 'booking', 'refund', 'adjustment', 'free_credit'].includes(transactionType)) {
      query = query.eq('transaction_type', transactionType);
    }

    const { data: transactions, error, count } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch transactions',
        details: error.message 
      }, { status: 500 });
    }

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('quota_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', supabaseUserId);

    if (countError) {
      console.error('Error fetching transaction count:', countError);
    }

    return NextResponse.json({
      transactions: transactions || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      },
    });
  } catch (error) {
    console.error('Transactions API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withCentralizedStateManagement(handleQuotaTransactionsRequest, '/api/quota/transactions', {
  priority: 'medium',
  maxRetries: 2,
  requireAuth: true
});