import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session ID' }, { status: 400 });
    }

    // Get session details
    const { data: session, error } = await supabase
      .from('manual_payment_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if session is expired
    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Session expired' }, { status: 400 });
    }

    // Return payment details with environment-specific information
    const paymentDetails: any = {
      sessionId: session.session_id,
      amount: session.amount,
      currency: session.currency,
      gateway: session.gateway,
      packageName: session.metadata?.package_name,
      hours: session.metadata?.hours,
      userEmail: session.metadata?.user_email,
      userName: session.metadata?.user_name,
    };

    // Add gateway-specific details based on environment variables
    switch (session.gateway) {
      case 'payid':
        paymentDetails.payIdIdentifier = process.env.NEXT_PUBLIC_PAYID_IDENTIFIER || 'contact@drivingschool.com.au';
        break;
      case 'bpay':
        paymentDetails.bpayBillerCode = process.env.NEXT_PUBLIC_BPAY_BILLER_CODE || '123456';
        break;
      case 'tyro':
        paymentDetails.tyroPaymentId = process.env.NEXT_PUBLIC_TYRO_PAYMENT_ID || 'tyro-payment-id';
        break;
    }

    return NextResponse.json(paymentDetails);

  } catch (error) {
    console.error('Error fetching manual payment session:', error);
    return NextResponse.json({ error: 'Failed to fetch payment session' }, { status: 500 });
  }
}

// Add POST function for confirming payments
export async function POST(request: NextRequest) {
  try {
    const { sessionId, paymentReference } = await request.json();

    if (!sessionId || !paymentReference) {
      return NextResponse.json({ error: 'Missing session ID or payment reference' }, { status: 400 });
    }

    // Update session with payment reference and mark as completed
    const { data, error } = await supabase
      .from('manual_payment_sessions')
      .update({
        payment_reference: paymentReference,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('Error confirming manual payment:', error);
      return NextResponse.json({ error: 'Failed to confirm payment' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Update user quota with purchased hours
    try {
      const { error: quotaError } = await supabase
        .rpc('update_user_quota', {
          p_user_id: data.user_id,
          p_hours_change: data.metadata?.hours || 0,
          p_transaction_type: 'purchase',
          p_description: `Purchased ${data.metadata?.package_name || 'Package'} - ${data.metadata?.hours || 0} hours`,
          p_package_id: data.package_id,
          p_payment_id: sessionId
        });

      if (quotaError) {
        console.error('Error updating user quota:', quotaError);
        // Don't fail the whole request if quota update fails, but log the error
      }
    } catch (quotaUpdateError) {
      console.error('Error updating user quota:', quotaUpdateError);
      // Continue with the response even if quota update fails
    }

    return NextResponse.json({ 
      message: 'Payment confirmed successfully',
      session: data
    });

  } catch (error) {
    console.error('Error confirming manual payment:', error);
    return NextResponse.json({ error: 'Failed to confirm payment' }, { status: 500 });
  }
}
