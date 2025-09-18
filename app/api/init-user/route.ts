import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('Initializing user...');
    
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get full user details from Clerk
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return NextResponse.json({ error: 'Clerk user not found' }, { status: 404 });
    }

    console.log('Clerk user:', {
      id: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName
    });

    // Check if user already exists in Supabase
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', clerkUserId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking user:', checkError);
      return NextResponse.json({
        error: 'Failed to check existing user',
        details: checkError.message
      }, { status: 500 });
    }

    if (existingUser) {
      return NextResponse.json({
        message: 'User already exists',
        user: existingUser
      });
    }

    // Create user in Supabase
    const email = clerkUser.emailAddresses[0]?.emailAddress;
    const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Unknown User';
    const phone = clerkUser.phoneNumbers[0]?.phoneNumber || null;

    if (!email) {
      return NextResponse.json({
        error: 'No email found for user'
      }, { status: 400 });
    }

    const { data: createdUser, error: createError } = await supabase
      .from('users')
      .insert({
        clerk_id: clerkUserId,
        email: email,
        full_name: fullName,
        phone: phone
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating user:', createError);
      return NextResponse.json({
        error: 'Failed to create user',
        details: createError.message
      }, { status: 500 });
    }

    console.log('User created successfully:', createdUser);

    return NextResponse.json({
      message: 'User created successfully',
      user: createdUser
    });

  } catch (error) {
    console.error('Init user error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}