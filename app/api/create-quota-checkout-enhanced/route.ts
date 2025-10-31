import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { checkRateLimit, paymentRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';
import { PaymentIdService } from '@/lib/payment-id-service';

// Input validation schema
const checkoutSchema = z.object({
  packageId: z.string().uuid('Invalid package ID format'),
  promoCode: z.string().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
  paymentGateway: z.string().optional().default('payid'),
  acceptedTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions to proceed',
  }),
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
    const { packageId, promoCode, metadata = {}, paymentGateway, acceptedTerms } = validatedInput;

    // Validate payment gateway - only PayID is supported
    if (paymentGateway !== 'payid') {
      return NextResponse.json({ error: 'Only PayID payment gateway is supported' }, { status: 400 });
    }

    // Get package details with error handling
    const { data: packageData, error: packageError } = await supabase
      .from('packages')
      .select('*')
      .eq('id', packageId)
      .single();

    if (packageError || !packageData) {
      return NextResponse.json({ error: 'Package not found or inactive' }, { status: 404 });
    }
    // All gateways now use payment ID-based system
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return NextResponse.json({ error: 'User not found in Clerk' }, { status: 404 });
    }
    
    const email = clerkUser.emailAddresses[0]?.emailAddress;
    const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User';
    
    if (!email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    // Generate payment ID using the service
    const paymentIdService = new PaymentIdService();
    const paymentId = paymentIdService.generatePaymentId(packageId, clerkUserId);
    
    // Create payment session with payment ID
    const sessionId = `payment_${paymentGateway}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Use the atomic function to create both user and payment session
    const { data, error: functionError } = await supabase.rpc('create_manual_payment_session', {
      p_clerk_id: clerkUserId,
      p_email: email,
      p_full_name: fullName,
      p_session_id: sessionId,
      p_package_id: packageId,
      p_amount: packageData.price,
      p_currency: 'AUD',
      p_gateway: paymentGateway,
      p_expires_at: new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString(), // 24 hours from now
      p_metadata: {
        package_name: packageData.name,
        hours: packageData.hours,
        user_email: email,
        user_name: fullName,
        payment_id: paymentId,
        ...metadata
      }
    });

    if (functionError) {
      console.error('Error creating payment session:', functionError);
      return NextResponse.json(
        { error: 'Failed to create payment session' },
        { status: 500 }
      );
    }

    const session = {
      id: sessionId,
      payment_id: paymentId,
      url: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/manual-payment?session_id=${sessionId}&gateway=${paymentGateway}&payment_id=${paymentId}`,
      expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours expiry
    };

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

    // Log the checkout attempt for security monitoring
    // Get user ID for logging
    const { data: userRow } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single();

    if (userRow?.id) {
      await supabase
        .from('payment_attempts')
        .insert({
          user_id: userRow.id,
          package_id: packageId,
          session_id: session.id,
          amount: finalPrice,
          currency: 'AUD',
          status: 'initiated',
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          user_agent: request.headers.get('user-agent'),
          metadata: {
            promo_code: promoCode || '',
            discount_amount: discountAmount.toString(),
            payment_gateway: paymentGateway,
            payment_id: session.payment_id,
            ...metadata
          }
        });
    }

    return NextResponse.json({ 
      sessionId: session.id, 
      paymentId: session.payment_id,
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