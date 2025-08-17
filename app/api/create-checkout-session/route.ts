import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {});

const GOOGLE_FORM_URL = process.env.NEXT_PUBLIC_GOOGLE_FORM_URL ||
  'https://docs.google.com/forms/d/e/FORM_ID/viewform';

export async function POST(request: NextRequest) {
  try {
    const { packageId, packageName, price, bookingDetails } = await request.json();

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'aud',
            product_data: {
              name: packageName,
              description: `Driving lesson package - ${bookingDetails.hours} hours`,
              metadata: {
                packageId,
                bookingDate: bookingDetails.date,
                bookingTime: bookingDetails.time,
                location: bookingDetails.location,
              },
            },
            unit_amount: Math.round(price * 100), // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      // After successful payment, redirect to Google Form with pre-filled data
      success_url: `${GOOGLE_FORM_URL}?` + new URLSearchParams({
        'entry.1234567890': bookingDetails.userName || '', // Name field
        'entry.0987654321': bookingDetails.userEmail || '', // Email field
        'entry.1111111111': bookingDetails.location || '', // Location field
        'entry.2222222222': packageName, // Package field
        'entry.3333333333': `${bookingDetails.date} ${bookingDetails.time}`, // Date/Time field
        'entry.4444444444': bookingDetails.notes || '', // Notes field
      }).toString(),
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/book?canceled=true`,
      metadata: {
        packageId,
        userId: bookingDetails.userId,
        bookingDate: bookingDetails.date,
        bookingTime: bookingDetails.time,
        location: bookingDetails.location,
      },
      customer_email: bookingDetails.userEmail,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Stripe session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
