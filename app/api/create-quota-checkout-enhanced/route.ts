import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';
import { checkRateLimit, paymentRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

// Input validation schema
const checkoutSchema = z.object({
  packageId: z.string().uuid('Invalid package ID format'),
  promoCode: z.string().optional(),
  metadata: z.record(z.string()).optional()
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const rateLimitResult = await checkRateLimit(request, paymentRateLimit);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many payment attempts. Please try again later.',
          retryAfter: rateLimitResult.resetTime 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.resetTime! - Date.now()) / 1000))
          }
        }
      );
    }

    // Authentication check
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Input validation
    const body = await request.json();
    const validatedInput = checkoutSchema.parse(body);
    const { packageId, promoCode, metadata = {} } = validatedInput;

    // Get package details with error handling
    const { data: packageData, error: packageError } = await supabase
      .from('packages')
      .select('*')
      .eq('id', packageId)
      .eq('active', true) // Only allow active packages
      .single();

    if (packageError || !packageData) {
      return NextResponse.json({ error: 'Package not found or inactive' }, { status: 404 });
    }

    // Map Clerk user ID to Supabase UUID and fetch user details
    const { data: userRow, error: userLookupError } = await supabase
      .from('users')
      .select('id, email, full_name, phone')
      .eq('clerk_id', clerkUserId)
      .single();

    if (userLookupError || !userRow) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Apply promo code if provided
    let finalPrice = packageData.price;
    let discountAmount = 0;
    
    if (promoCode) {
      const { data: promo } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.toUpperCase())
        .eq('active', true)
        .gte('expires_at', new Date().toISOString())
        .single();
        
      if (promo) {
        if (promo.discount_type === 'percentage') {
          discountAmount = (packageData.price * promo.discount_value) / 100;
        } else {
          discountAmount = promo.discount_value;
        }
        finalPrice = Math.max(0, packageData.price - discountAmount);
      }
    }

    // Enhanced Stripe checkout session with 2025 features
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'afterpay_clearpay'], // Multiple payment options
      line_items: [
        {
          price_data: {
            currency: 'aud',
            product_data: {
              name: `${packageData.name} - Driving Lesson Hours`,
              description: `${packageData.hours} hours of professional driving instruction`,
              images: [`${process.env.NEXT_PUBLIC_BASE_URL}/images/package-${packageId}.jpg`],
              metadata: {
                package_id: packageId,
                hours: packageData.hours.toString(),
              }
            },
            unit_amount: Math.round(finalPrice * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      // Add discount if applicable
      ...(discountAmount > 0 && {
        discounts: [{
          coupon: await stripe.coupons.create({
            amount_off: Math.round(discountAmount * 100),
            currency: 'aud',
            duration: 'once',
            name: `Promo: ${promoCode}`
          }).then(c => c.id)
        }]
      }),
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/service-center?quota_purchase=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/packages?quota_purchase=cancelled`,
      customer_email: userRow.email,
      phone_number_collection: {
        enabled: true,
      },
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['AU'],
      },
      payment_intent_data: {
        metadata: {
          type: 'quota_purchase',
          user_id: userRow.id,
          package_id: packageId,
          original_price: packageData.price.toString(),
          final_price: finalPrice.toString(),
          discount_amount: discountAmount.toString(),
          promo_code: promoCode || '',
          ...metadata
        },
      },
      metadata: {
        type: 'quota_purchase',
        user_id: userRow.id,
        package_id: packageId,
        package_name: packageData.name,
        hours: packageData.hours.toString(),
        price: finalPrice.toString(),
        original_price: packageData.price.toString(),
        user_email: userRow.email,
        user_name: userRow.full_name,
        promo_code: promoCode || '',
      },
      // Enhanced security features
      consent_collection: {
        terms_of_service: 'required',
      },
      custom_text: {
        submit: {
          message: 'By completing this purchase, you agree to our Terms of Service and acknowledge our Privacy Policy.'
        }
      },
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes expiry
    });

    // Log the checkout attempt for security monitoring
    await supabase
      .from('payment_attempts')
      .insert({
        user_id: userRow.id,
        package_id: packageId,
        session_id: session.id,
        amount: finalPrice,
        currency: 'AUD',
        status: 'initiated',
        ip_address: request.headers.get('x-forwarded-for') || request.ip,
        user_agent: request.headers.get('user-agent'),
        metadata: {
          promo_code: promoCode,
          discount_amount: discountAmount,
          ...metadata
        }
      });

    return NextResponse.json({ 
      sessionId: session.id, 
      url: session.url,
      expiresAt: session.expires_at 
    });

  } catch (error) {
    console.error('Error creating enhanced checkout session:', error);
    
    // Log security incidents
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}