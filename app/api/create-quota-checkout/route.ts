import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { packageId } = await request.json();

    if (!packageId) {
      return NextResponse.json({ error: 'Package ID is required' }, { status: 400 });
    }

    // Get package details
    const { data: packageData, error: packageError } = await supabase
      .from('packages')
      .select('*')
      .eq('id', packageId)
      .single();

    if (packageError || !packageData) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    // Map Clerk user ID to Supabase UUID and fetch user details
    const { data: userRow, error: userLookupError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('clerk_id', clerkUserId)
      .single();

    if (userLookupError || !userRow) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create Stripe checkout session for quota purchase
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
            unit_amount: Math.round(packageData.price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/service-center?quota_purchase=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/packages?quota_purchase=cancelled`,
      customer_email: userRow.email,
      metadata: {
        type: 'quota_purchase',
        user_id: userRow.id, // Supabase UUID
        package_id: packageId,
        package_name: packageData.name,
        hours: packageData.hours.toString(),
        price: packageData.price.toString(),
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating quota checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}