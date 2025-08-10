import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const resend = new Resend(process.env.RESEND_API_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    try {
      // Update booking status to 'pending' (waiting for admin confirmation)
      const { data: booking, error: updateError } = await supabase
        .from('bookings')
        .update({ 
          status: 'pending',
          stripe_payment_intent_id: session.payment_intent,
          updated_at: new Date().toISOString()
        })
        .eq('stripe_session_id', session.id)
        .select(`
          *,
          users:user_id(id, email, full_name),
          packages:package_id(id, name, hours, price)
        `)
        .single();

      if (updateError || !booking) {
        console.error('Error updating booking:', updateError);
        return NextResponse.json({ error: 'Booking update failed' }, { status: 500 });
      }

      // Send admin notification email
      await sendAdminNotification(booking);
      
      // Send customer confirmation email
      await sendCustomerConfirmation(booking);

    } catch (error) {
      console.error('Error processing webhook:', error);
      return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}

async function sendAdminNotification(booking: any) {
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@brisbanedrivingschool.com';
  
  await resend.emails.send({
    from: 'EG Driving School <noreply@egdrivingschool.com>',
    to: [adminEmail],
    subject: `New Booking Requires Confirmation - ${booking.users.full_name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #eab308;">New Booking Awaiting Confirmation</h2>
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Customer Details:</h3>
          <p><strong>Name:</strong> ${booking.users.full_name}</p>
          <p><strong>Email:</strong> ${booking.users.email}</p>
          <p><strong>Package:</strong> ${booking.packages.name}</p>
          <p><strong>Date:</strong> ${booking.date}</p>
          <p><strong>Time:</strong> ${booking.time}</p>
          <p><strong>Location:</strong> ${booking.location || 'Not specified'}</p>
          <p><strong>Notes:</strong> ${booking.notes || 'None'}</p>
        </div>
        <p>Please log into the admin panel to confirm or reject this booking.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin" 
           style="background: #eab308; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View in Admin Panel
        </a>
      </div>
    `
  });
}

async function sendCustomerConfirmation(booking: any) {
  await resend.emails.send({
    from: 'EG Driving School <noreply@egdrivingschool.com>',
    to: [booking.users.email],
    subject: 'Payment Confirmed - Booking Awaiting Approval',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #eab308;">Payment Confirmed!</h2>
        <p>Hi ${booking.users.full_name},</p>
        <p>Thank you for your payment. Your booking is now awaiting confirmation from our team.</p>
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Booking Details:</h3>
          <p><strong>Package:</strong> ${booking.packages.name}</p>
          <p><strong>Date:</strong> ${booking.date}</p>
          <p><strong>Time:</strong> ${booking.time}</p>
          <p><strong>Location:</strong> ${booking.location || 'Not specified'}</p>
        </div>
        <p>We'll send you a confirmation email once your booking is approved by our instructor.</p>
        <p>If you have any questions, please contact us at info@brisbanedrivingschool.com</p>
      </div>
    `
  });
}