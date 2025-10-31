import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { sessionId, paymentReference, gateway } = await request.json();

    if (!sessionId || !paymentReference) {
      return NextResponse.json({ error: 'Missing session ID or payment reference' }, { status: 400 });
    }

    // Validate payment reference format based on gateway
    const validationError = validatePaymentReference(paymentReference, gateway);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Get session details first
    const { data: session, error: sessionError } = await supabase
      .from('manual_payment_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if session is already completed
    if (session.status === 'completed') {
      return NextResponse.json({ error: 'Payment already confirmed' }, { status: 400 });
    }

    // Check if session is expired
    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Session expired' }, { status: 400 });
    }

    // Update session with payment reference and mark as completed
    const { data, error } = await supabase
      .from('manual_payment_sessions')
      .update({
        payment_reference: paymentReference.trim(),
        status: 'completed',
        completed_at: new Date().toISOString(),
        gateway: gateway || session.gateway
      })
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('Error confirming manual payment:', error);
      return NextResponse.json({ error: 'Failed to confirm payment' }, { status: 500 });
    }

    // Update user quota with purchased hours
    try {
      const hoursToAdd = parseFloat(data.metadata?.hours || '0');
      
      // First, ensure user has a quota record
      const { data: existingQuota } = await supabase
        .from('user_quotas')
        .select('*')
        .eq('user_id', data.user_id)
        .single();

      if (!existingQuota) {
        // Create new quota record
        const { error: createError } = await supabase
          .from('user_quotas')
          .insert({
            user_id: data.user_id,
            total_hours: hoursToAdd,
            used_hours: 0
          });
        
        if (createError) {
          console.error('Error creating user quota:', createError);
        }
      } else {
        // Update existing quota by adding hours to total_hours
        const { error: updateError } = await supabase
          .from('user_quotas')
          .update({
            total_hours: parseFloat(existingQuota.total_hours) + hoursToAdd,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', data.user_id);
        
        if (updateError) {
          console.error('Error updating user quota:', updateError);
        }
      }
      
      // Log the transaction in quota_transactions
      const { error: transactionError } = await supabase
        .from('quota_transactions')
        .insert({
          user_id: data.user_id,
          transaction_type: 'purchase',
          hours_change: hoursToAdd,
          amount_paid: data.amount,
          description: `Purchased ${data.metadata?.package_name || 'Package'} - ${hoursToAdd} hours via ${gateway?.toUpperCase() || 'Manual Payment'}`,
          package_id: data.package_id,
          payment_id: sessionId,
          metadata: {
            gateway: gateway || session.gateway,
            payment_reference: paymentReference.trim(),
            session_id: sessionId
          }
        });
      
      if (transactionError) {
        console.error('Error logging transaction:', transactionError);
      }
      
    } catch (quotaUpdateError) {
      console.error('Error updating user quota:', quotaUpdateError);
    }

    return NextResponse.json({ 
      message: 'Payment confirmed successfully',
      session: data,
      hoursAdded: data.metadata?.hours || 0
    });

  } catch (error) {
    console.error('Error confirming manual payment:', error);
    return NextResponse.json({ error: 'Failed to confirm payment' }, { status: 500 });
  }
}

function validatePaymentReference(ref: string, gateway: string): string | null {
  if (!ref || ref.trim().length === 0) {
    return 'Payment reference is required';
  }

  const cleanRef = ref.trim();

  // Only validate PayID references
  if (gateway === 'payid') {
    if (cleanRef.length < 6) return 'PayID reference must be at least 6 characters';
    if (!/^[A-Za-z0-9]+$/.test(cleanRef)) return 'PayID reference should contain only letters and numbers';
  }
  
  return null;
}