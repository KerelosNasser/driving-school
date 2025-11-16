import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendWhatsAppNotification, formatPaymentNotification } from '@/lib/whatsapp';

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

    // Update session with payment reference and mark as PENDING_VERIFICATION
    // Admin must verify the payment before hours are granted
    const { data, error } = await supabase
      .from('manual_payment_sessions')
      .update({
        payment_reference: paymentReference.trim(),
        status: 'pending_verification',
        submitted_at: new Date().toISOString(),
        gateway: gateway || session.gateway
      })
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('Error confirming manual payment:', error);
      return NextResponse.json({ error: 'Failed to confirm payment' }, { status: 500 });
    }

    // DO NOT grant hours yet - admin must verify first
    // Hours will be granted when admin approves the payment

    // Send WhatsApp notification to admin
    try {
      const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER;
      if (adminPhone) {
        await sendWhatsAppNotification({
          to: adminPhone,
          message: formatPaymentNotification({
            userName: data.metadata?.user_name || data.full_name || 'Unknown User',
            amount: data.amount,
            packageName: data.metadata?.package_name || 'Unknown Package',
            paymentReference: paymentReference.trim(),
            hours: parseFloat(data.metadata?.hours || '0')
          })
        });
      }
    } catch (notificationError) {
      // Don't fail the request if notification fails
      console.error('Failed to send WhatsApp notification:', notificationError);
    }

    return NextResponse.json({ 
      message: 'Payment reference submitted successfully. Your payment is pending admin verification.',
      session: data,
      status: 'pending_verification',
      note: 'Your hours will be added to your account once the payment is verified by our team (usually within 24 hours).'
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