import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { PaymentIdService } from '@/lib/payment-id-service';

// Server admin client (use only on server & keep env secret)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// Input validation schema
const checkoutSchema = z.object({
  packageId: z.string().min(1, 'Package ID is required'),
  paymentGateway: z.string().optional().default('payid'),
  acceptedTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions to proceed',
  }),
});

export async function POST(request: NextRequest) {
  console.log('🚀 Checkout API called');

  try {
    // Authentication check (Clerk)
    const { userId: clerkUserId } = await auth();
    console.log('👤 Clerk User ID:', clerkUserId);

    if (!clerkUserId) {
      console.log('❌ No Clerk user ID found');
      return NextResponse.json(
        {
          error: 'Please sign in to continue',
          step: 'authentication',
        },
        { status: 401 }
      );
    }

    // Input validation
    const body = await request.json();
    console.log('📦 Request body:', body);

    const validatedInput = checkoutSchema.parse(body);
    const { packageId, paymentGateway, acceptedTerms } = validatedInput;
    console.log('✅ Package ID validated:', packageId);

    // Get package details (packages table is public-selectable)
    console.log('🔍 Looking up package in database...');
    const { data: packageData, error: packageError } = await supabase
      .from('packages')
      .select('*')
      .eq('id', packageId)
      .single();

    console.log('📊 Package query result:', {
      found: !!packageData,
      error: packageError?.message,
      code: packageError?.code,
    });

    if (packageError || !packageData) {
      console.log('❌ Package lookup failed');
      return NextResponse.json(
        {
          error: 'Package not found',
          details: packageError?.message || 'Package does not exist',
          step: 'package_lookup',
          packageId: packageId,
        },
        { status: 404 }
      );
    }

    // Map Clerk user ID to Supabase UUID and fetch user details using admin client
    console.log('🔍 Looking up user in database (admin client)...');
    let { data: userRow, error: userLookupError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name')
      .eq('clerk_id', clerkUserId)
      .maybeSingle();

    console.log('👥 User query result (admin):', {
      found: !!userRow,
      error: userLookupError?.message,
      code: userLookupError?.code,
    });

    // If user doesn't exist, create one automatically (use admin client to bypass RLS)
    if (!userRow && !userLookupError) {
      console.log('🔧 User not found, creating user record (admin)...');

      try {
        const { currentUser } = await import('@clerk/nextjs/server');
        const clerkUser = await currentUser();

        if (clerkUser) {
          const email = clerkUser.emailAddresses[0]?.emailAddress;
          const fullName =
            `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() ||
            'User';
          const phone = clerkUser.phoneNumbers[0]?.phoneNumber || null;

          console.log('📝 Creating user with:', { email, fullName, clerkUserId });

          if (email) {
            // Try upsert-like behavior to avoid race / unique constraint failures
            const { data: newUser, error: createError } = await supabaseAdmin
              .from('users')
              .upsert(
                {
                  clerk_id: clerkUserId,
                  email,
                  full_name: fullName,
                  phone,
                },
                { onConflict: 'clerk_id', ignoreDuplicates: false }
              )
              .select('id, email, full_name')
              .maybeSingle();

            if (!createError && newUser) {
              console.log('✅ User created/returned successfully (admin):', newUser.id);
              userRow = newUser;
              userLookupError = null;
            } else {
              // Log detailed DB error for debugging
              console.log('❌ Failed to create/upsert user:', createError?.message, createError?.code);

              // If unique constraint conflict happened, fetch existing user
              if (createError && createError.code === '23505') {
                const { data: existing } = await supabaseAdmin
                  .from('users')
                  .select('id, email, full_name')
                  .eq('clerk_id', clerkUserId)
                  .maybeSingle();
                if (existing) {
                  userRow = existing;
                }
              }
            }
          } else {
            console.log('❌ Clerk user has no email; cannot create user record');
          }
        } else {
          console.log('❌ Could not fetch clerk currentUser()');
        }
      } catch (createUserError) {
        console.log('❌ Error creating user (admin):', createUserError);
      }
    }

    if (!userRow) {
      console.log('❌ User lookup/creation failed');
      return NextResponse.json(
        {
          error: 'User profile setup required',
          details: userLookupError?.message || 'Unable to create user profile',
          step: 'user_lookup',
          clerkUserId: clerkUserId,
          suggestion: 'Please try refreshing the page or contact support',
        },
        { status: 404 }
      );
    }

    // Create payment ID for the transaction
    console.log('💳 Creating payment ID...');
    const paymentId = PaymentIdService.generatePaymentId();
    
    // Store payment record in database
    const { error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        payment_id: paymentId,
        user_id: userRow.id,
        package_id: packageId,
        amount: packageData.price,
        currency: 'AUD',
        payment_method: paymentGateway,
        status: 'pending',
        metadata: {
          type: 'quota_purchase',
          package_name: packageData.name,
          hours: packageData.hours,
          user_email: userRow.email,
          user_name: userRow.full_name,
        }
      });

    if (paymentError) {
      console.log('❌ Error creating payment record:', paymentError);
      return NextResponse.json(
        {
          error: 'Payment initialization failed',
          details: paymentError.message,
          step: 'payment_creation',
        },
        { status: 500 }
      );
    }

    console.log('✅ Payment ID created successfully:', paymentId);

    return NextResponse.json({
      paymentId: paymentId,
      amount: packageData.price,
      currency: 'AUD',
      paymentMethod: paymentGateway,
      success: true,
      redirectUrl: `/service-center?payment_id=${paymentId}&status=pending`,
    });
  } catch (error) {
    console.error('💥 Checkout API Error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      console.log('❌ Validation error:', error.issues);
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.issues,
          step: 'validation',
        },
        { status: 400 }
      );
    }

    // Handle payment ID errors
    if (error instanceof Error) {
      if (error.message.includes('payment_id') || error.message.includes('PaymentId')) {
        console.log('❌ Payment ID error:', error.message);
        return NextResponse.json(
          {
            error: 'Payment ID generation failed',
            details: error.message,
            step: 'payment_id',
          },
          { status: 503 }
        );
      }

      console.log('❌ General error:', error.message);
      return NextResponse.json(
        {
          error: 'Checkout failed',
          details: error.message,
          step: 'general',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Unknown error occurred',
        step: 'unknown',
      },
      { status: 500 }
    );
  }
}