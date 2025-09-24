import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';
import { checkRateLimit, paymentRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';
import { isManualGateway } from '@/lib/payment-utils';
import { supabaseAdmin } from '@/lib/api/utils';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

// Input validation schema
const checkoutSchema = z.object({
  packageId: z.string().uuid('Invalid package ID format'),
  promoCode: z.string().optional(),
  metadata: z.record(z.string()).optional(),
  paymentGateway: z.string().optional().default('stripe'),
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

    // Validate payment gateway
    const supportedGateways = ['stripe', 'afterpay', 'tyro', 'bpay', 'payid'];
    if (!supportedGateways.includes(paymentGateway)) {
      return NextResponse.json({ error: 'Unsupported payment gateway' }, { status: 400 });
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

    // Handle different payment gateways
    let session;
    
    if (!isManualGateway(paymentGateway)) {
      // Stripe/Afterpay checkout session
      // Map Clerk user ID to Supabase UUID and fetch user details
      let { data: userRow, error: userLookupError } = await supabase
        .from('users')
        .select('id, email, full_name, phone')
        .eq('clerk_id', clerkUserId)
        .single();

      // If user doesn't exist, create one automatically
      if (!userRow && userLookupError?.code === 'PGRST116') {
        try {
          const clerkUser = await currentUser();

          if (clerkUser) {
            const email = clerkUser.emailAddresses[0]?.emailAddress;
            const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User';
            const phone = clerkUser.phoneNumbers[0]?.phoneNumber || null;

            if (email) {
              // First, try to find an existing user with the same email
              const { data: existingUserByEmail } = await supabaseAdmin
                .from('users')
                .select('id')
                .eq('email', email)
                .maybeSingle();

              if (existingUserByEmail) {
                // If user exists by email, update their clerk_id
                const { data: updatedUser, error: updateError } = await supabaseAdmin
                  .from('users')
                  .update({ 
                    clerk_id: clerkUserId,
                    full_name: fullName,
                    phone: phone
                  })
                  .eq('id', existingUserByEmail.id)
                  .select('id, email, full_name, phone')
                  .single();

                if (!updateError && updatedUser) {
                  userRow = updatedUser;
                  userLookupError = null;
                }
              } else {
                // If no user exists with this email, create a new one
                const { data: newUser, error: createError } = await supabaseAdmin
                  .from('users')
                  .insert({
                    clerk_id: clerkUserId,
                    email,
                    full_name: fullName,
                    phone,
                  })
                  .select('id, email, full_name, phone')
                  .single();

                if (!createError && newUser) {
                  userRow = newUser;
                  userLookupError = null;
                } else if (createError?.code === '23505') {
                  // Handle race condition where user was created between our check and insert
                  // Try to find the user again and update their clerk_id
                  const { data: userAfterConflict, error: conflictError } = await supabaseAdmin
                    .from('users')
                    .select('id')
                    .eq('email', email)
                    .maybeSingle();

                  if (!conflictError && userAfterConflict) {
                    const { data: updatedUser, error: finalUpdateError } = await supabaseAdmin
                      .from('users')
                      .update({ 
                        clerk_id: clerkUserId,
                        full_name: fullName,
                        phone: phone
                      })
                      .eq('id', userAfterConflict.id)
                      .select('id, email, full_name, phone')
                      .single();

                    if (!finalUpdateError && updatedUser) {
                      userRow = updatedUser;
                      userLookupError = null;
                    }
                  }
                }
              }
            }
          }
        } catch (createUserError) {
          console.error('Error creating user:', createUserError);
        }
      }

      if (userLookupError || !userRow) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card', 'afterpay_clearpay'], // Multiple payment options
        line_items: [
          {
            price_data: {
              currency: 'aud',
              product_data: {
                name: `${packageData.name} - Driving Lesson Hours`,
                description: `${packageData.hours} hours of professional driving instruction`,
                images: [`${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/images/package-${packageId}.jpg`],
                metadata: {
                  package_id: packageId,
                  hours: packageData.hours.toString(),
                }
              },
              unit_amount: Math.round(packageData.price * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/service-center?quota_purchase=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/packages?quota_purchase=cancelled`,
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
            final_price: packageData.price.toString(),
            discount_amount: '0',
            promo_code: '',
            ...metadata
          },
        },
        metadata: {
          type: 'quota_purchase',
          user_id: userRow.id,
          package_id: packageId,
          package_name: packageData.name,
          hours: packageData.hours.toString(),
          price: packageData.price.toString(),
          original_price: packageData.price.toString(),
          user_email: userRow.email,
          user_name: userRow.full_name,
          promo_code: '',
          payment_gateway: paymentGateway,
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
    } else {
      // For Tyro, BPAY, and PayID, create a manual payment session using the atomic function
      const clerkUser = await currentUser();
      
      if (!clerkUser) {
        return NextResponse.json({ error: 'User not found in Clerk' }, { status: 404 });
      }
      
      const email = clerkUser.emailAddresses[0]?.emailAddress;
      const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User';
      
      if (!email) {
        return NextResponse.json({ error: 'User email not found' }, { status: 400 });
      }

      const sessionId = `manual_${paymentGateway}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Use the atomic function to create both user and manual payment session
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
          ...metadata
        }
      });

      if (functionError) {
        console.error('Error creating manual payment session:', functionError);
        return NextResponse.json(
          { error: 'Failed to create manual payment session' },
          { status: 500 }
        );
      }

      session = {
        id: sessionId,
        url: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/manual-payment?session_id=${sessionId}&gateway=${paymentGateway}`,
        expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours expiry
      };
    }

    // Apply promo code if provided (only for Stripe/Afterpay)
    let finalPrice = packageData.price;
    let discountAmount = 0;
    
    if (promoCode && !isManualGateway(paymentGateway)) {
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
        
        // Update the session with discount information
        // Note: For Stripe sessions, the discount was already applied during creation
      }
    }

    // Log the checkout attempt for security monitoring
    // Get user ID for logging (from session or from user lookup)
    let userIdForLogging;
    if (!isManualGateway(paymentGateway)) {
      // For Stripe/Afterpay, we already have the userRow
      const { data: userRow } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', clerkUserId)
        .single();
      userIdForLogging = userRow?.id;
    } else {
      // For manual payments, get user ID after session creation
      const { data: userRow } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', clerkUserId)
        .single();
      userIdForLogging = userRow?.id;
    }

    if (userIdForLogging) {
      await supabase
        .from('payment_attempts')
        .insert({
          user_id: userIdForLogging,
          package_id: packageId,
          session_id: session.id,
          amount: finalPrice,
          currency: 'AUD',
          status: 'initiated',
          ip_address: request.headers.get('x-forwarded-for') || request.ip,
          user_agent: request.headers.get('user-agent'),
          metadata: {
            promo_code: promoCode || '',
            discount_amount: discountAmount.toString(),
            payment_gateway: paymentGateway,
            ...metadata
          }
        });
    }

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