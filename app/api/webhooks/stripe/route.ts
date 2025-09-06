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
      // Check if this is a quota purchase (package purchase) or a direct booking
      const metadata = session.metadata;
      const isQuotaPurchase = metadata?.type === 'quota_purchase';
      
      if (isQuotaPurchase) {
        // Handle quota purchase - add hours to user's quota
        const supabaseUserId = metadata.user_id; // This is now Supabase UUID
        const packageId = metadata.package_id;
        const hours = parseInt(metadata.hours || '0');
        const packageName = metadata.package_name;
        const price = parseFloat(metadata.price || '0');
        
        // Get user details using Supabase UUID
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id, email, full_name')
          .eq('id', supabaseUserId)
          .single();
          
        if (userError || !user) {
          console.error('Error fetching user:', userError);
          return NextResponse.json({ error: 'User not found' }, { status: 500 });
        }
        
        // Add quota hours using the RPC function
        const { error: quotaError } = await supabase
          .rpc('update_user_quota', {
            p_user_id: supabaseUserId,
            p_hours_change: hours,
            p_transaction_type: 'purchase',
            p_description: `Purchased ${packageName} - ${hours} hours`,
            p_package_id: packageId,
            p_payment_id: session.payment_intent as string
          });
          
        if (quotaError) {
          console.error('Error updating quota:', quotaError);
          return NextResponse.json({ error: 'Quota update failed' }, { status: 500 });
        }
        
        // Send quota purchase confirmation email
        await sendQuotaPurchaseConfirmation({
          user,
          packageName,
          hours,
          price,
          paymentId: session.payment_intent as string
        });
        
      } else {
        // Handle direct booking (legacy flow)
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
      }

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

async function sendQuotaPurchaseConfirmation({ user, packageName, hours, price, paymentId }: {
  user: { id: string; email: string; full_name: string };
  packageName: string;
  hours: number;
  price: number;
  paymentId: string;
}) {
  await resend.emails.send({
    from: 'EG Driving School <noreply@egdrivingschool.com>',
    to: user.email,
    subject: 'Quota Purchase Confirmed - Hours Added to Your Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #eab308;">Quota Purchase Confirmed!</h2>
        <p>Hi ${user.full_name},</p>
        <p>Thank you for your payment. Your driving lesson hours have been successfully added to your account.</p>
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Purchase Details:</h3>
          <p><strong>Package:</strong> ${packageName}</p>
          <p><strong>Hours Added:</strong> ${hours} hours</p>
          <p><strong>Amount Paid:</strong> $${price.toFixed(2)}</p>
          <p><strong>Payment ID:</strong> ${paymentId}</p>
        </div>
        <p>You can now use these hours to book driving lessons through your Service Center.</p>
        <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/service-center" style="background: #eab308; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0;">Visit Service Center</a></p>
        <p>If you have any questions, please contact us at info@brisbanedrivingschool.com</p>
      </div>
    `
  });
}