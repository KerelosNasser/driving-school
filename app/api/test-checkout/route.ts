import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

export async function POST(request: NextRequest) {
  try {
    console.log('Test checkout endpoint hit');
    
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('User authenticated:', clerkUserId);

    // Use hardcoded package data for testing
    const packageData = {
      id: 'test-package',
      name: 'Test Package',
      price: 299,
      hours: 5,
      description: 'Test driving lesson package'
    };

    console.log('Creating Stripe session...');

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'aud',
            product_data: {
              name: `${packageData.name} - Driving Lesson Hours`,
              description: `${packageData.hours} hours of professional driving instruction`,
            },
            unit_amount: Math.round(packageData.price * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/service-center?test_purchase=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/packages?test_purchase=cancelled`,
      metadata: {
        type: 'test_purchase',
        user_id: clerkUserId,
        package_id: packageData.id,
      },
    });

    console.log('Stripe session created:', session.id);

    return NextResponse.json({ 
      sessionId: session.id, 
      url: session.url,
      success: true
    });

  } catch (error) {
    console.error('Test checkout error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}