import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { isAdmin } from '@/lib/auth-helpers';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// GET - Get all pending payment verifications
export async function GET() {
  try {
    // Check admin access
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      console.log('Admin access denied in verify-payment route');
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase configuration');
      return NextResponse.json(
        { error: 'Configuration error', message: 'Database configuration is missing' },
        { status: 500 }
      );
    }

    const supabase = getSupabaseAdmin();
    
    // Add timeout and better error handling
    const { data, error } = await Promise.race([
      supabase
        .from('manual_payment_sessions')
        .select(`
          *,
          users:user_id (
            id,
            email,
            full_name,
            phone
          )
        `)
        .eq('status', 'pending_verification')
        .order('submitted_at', { ascending: false }),
      new Promise<{ data: null; error: { message: string } }>((_, reject) =>
        setTimeout(() => reject({ data: null, error: { message: 'Database request timeout' } }), 10000)
      )
    ]);

    if (error) {
      console.error('Error loading pending payments:', {
        message: error.message,
        details: (error as any).details || 'No additional details',
        hint: (error as any).hint || 'No hint available',
        code: (error as any).code || 'No error code'
      });
      
      // Return empty array instead of error for better UX
      return NextResponse.json({ 
        data: [], 
        warning: 'Could not load pending payments. Please check your database connection.' 
      });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    console.error('Error in GET /api/admin/verify-payment:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      name: error?.name,
      cause: error?.cause
    });
    
    // Return empty array with warning instead of 500 error
    return NextResponse.json({ 
      data: [], 
      warning: 'Database connection failed. Please check your network connection and try again.' 
    });
  }
}

// POST - Approve or reject a payment
export async function POST(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { sessionId, action, adminNotes } = body;

    if (!sessionId || !action) {
      return NextResponse.json(
        { error: 'Bad request', message: 'Session ID and action are required' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Bad request', message: 'Action must be either "approve" or "reject"' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('manual_payment_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (session.status !== 'pending_verification') {
      return NextResponse.json(
        { error: 'Payment is not pending verification' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      // Approve payment and grant hours
      const { error: updateError } = await supabase
        .from('manual_payment_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          verified_by: (await auth()).userId,
          admin_notes: adminNotes || null
        })
        .eq('session_id', sessionId);

      if (updateError) {
        console.error('Error approving payment:', updateError);
        return NextResponse.json(
          { error: 'Failed to approve payment' },
          { status: 500 }
        );
      }

      // Grant hours to user
      try {
        const hoursToAdd = parseFloat(session.metadata?.hours || '0');
        
        // First, ensure user has a quota record
        const { data: existingQuota } = await supabase
          .from('user_quotas')
          .select('*')
          .eq('user_id', session.user_id)
          .single();

        if (!existingQuota) {
          // Create new quota record
          await supabase
            .from('user_quotas')
            .insert({
              user_id: session.user_id,
              total_hours: hoursToAdd,
              used_hours: 0
            });
        } else {
          // Update existing quota by adding hours to total_hours
          await supabase
            .from('user_quotas')
            .update({
              total_hours: parseFloat(existingQuota.total_hours) + hoursToAdd,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', session.user_id);
        }
        
        // Log the transaction in quota_transactions
        await supabase
          .from('quota_transactions')
          .insert({
            user_id: session.user_id,
            transaction_type: 'purchase',
            hours_change: hoursToAdd,
            amount_paid: session.amount,
            description: `Purchased ${session.metadata?.package_name || 'Package'} - ${hoursToAdd} hours via ${session.gateway?.toUpperCase() || 'Manual Payment'} (Admin Verified)`,
            package_id: session.package_id,
            payment_id: sessionId,
            metadata: {
              gateway: session.gateway,
              payment_reference: session.payment_reference,
              session_id: sessionId,
              verified_by: (await auth()).userId,
              admin_notes: adminNotes
            }
          });
        
      } catch (quotaUpdateError) {
        console.error('Error updating user quota:', quotaUpdateError);
        return NextResponse.json(
          { error: 'Payment approved but failed to grant hours. Please contact support.' },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        success: true,
        message: 'Payment approved and hours granted successfully',
        hoursAdded: session.metadata?.hours || 0
      });

    } else {
      // Reject payment
      const { error: updateError } = await supabase
        .from('manual_payment_sessions')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          verified_by: (await auth()).userId,
          admin_notes: adminNotes || null
        })
        .eq('session_id', sessionId);

      if (updateError) {
        console.error('Error rejecting payment:', updateError);
        return NextResponse.json(
          { error: 'Failed to reject payment' },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        success: true,
        message: 'Payment rejected successfully'
      });
    }

  } catch (error: any) {
    console.error('Error in POST /api/admin/verify-payment:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      name: error?.name,
      cause: error?.cause?.message
    });
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error?.message || 'An unexpected error occurred. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}
