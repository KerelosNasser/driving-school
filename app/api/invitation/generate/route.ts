import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { generateEncryptedInvitationCode, generateSimpleInvitationCode } from '@/lib/invitation-crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get or create user in database
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('id, invitation_code')
      .eq('clerk_id', clerkUserId)
      .single();

    if (userError && userError.code === 'PGRST116') {
      // User doesn't exist, create them
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          clerk_id: clerkUserId,
          email: 'temp@example.com', // Will be updated when profile is completed
          full_name: 'User',
          completed_onboarding: false
        })
        .select('id, invitation_code')
        .single();

      if (createError) {
        console.error('Error creating user:', createError);
        return NextResponse.json(
          { message: 'Failed to create user' },
          { status: 500 }
        );
      }
      
      user = newUser;
    } else if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json(
        { message: 'Database error' },
        { status: 500 }
      );
    }

    // Generate new encrypted invitation code
    let invitationCode: string;
    
    try {
      // Try to generate encrypted code
      invitationCode = generateEncryptedInvitationCode(user.id);
    } catch (error) {
      console.warn('Encryption failed, using simple code:', error);
      // Fallback to simple code if encryption fails
      invitationCode = generateSimpleInvitationCode();
    }

    // Update user with new invitation code
    const { error: updateError } = await supabase
      .from('users')
      .update({ invitation_code: invitationCode })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating user invitation code:', updateError);
      return NextResponse.json(
        { message: 'Failed to update invitation code' },
        { status: 500 }
      );
    }

    // Try to create or update invitation_codes table if it exists
    try {
      // First check if table exists
      const { data: tableExists } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'invitation_codes')
        .single();

      if (tableExists) {
        // Deactivate old invitation codes
        await supabase
          .from('invitation_codes')
          .update({ is_active: false })
          .eq('user_id', user.id);

        // Create new invitation code record
        await supabase
          .from('invitation_codes')
          .insert({
            user_id: user.id,
            code: invitationCode,
            is_active: true,
            current_uses: 0,
            max_uses: null // Unlimited
          });
      }
    } catch (invitationTableError) {
      // Table doesn't exist or error occurred - that's okay, continue
      console.info('Invitation codes table not available:', invitationTableError);
    }

    return NextResponse.json({
      success: true,
      invitationCode,
      message: 'Invitation code generated successfully'
    });

  } catch (error) {
    console.error('Generate invitation code error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's current invitation code
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, invitation_code')
      .eq('clerk_id', clerkUserId)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // If user doesn't have an invitation code, generate one
    if (!user.invitation_code) {
      let invitationCode: string;
      
      try {
        invitationCode = generateEncryptedInvitationCode(user.id);
      } catch (error) {
        console.warn('Encryption failed, using simple code:', error);
        invitationCode = generateSimpleInvitationCode();
      }

      // Update user with new invitation code
      const { error: updateError } = await supabase
        .from('users')
        .update({ invitation_code: invitationCode })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating user invitation code:', updateError);
        return NextResponse.json(
          { message: 'Failed to generate invitation code' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        invitationCode,
        isNew: true
      });
    }

    return NextResponse.json({
      invitationCode: user.invitation_code,
      isNew: false
    });

  } catch (error) {
    console.error('Get invitation code error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
