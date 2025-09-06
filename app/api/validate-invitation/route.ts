import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { invitationCode } = await request.json();

    if (!invitationCode || typeof invitationCode !== 'string') {
      return NextResponse.json(
        { error: 'Invalid invitation code format' },
        { status: 400 }
      );
    }

    // Check if invitation code exists and belongs to an active user
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, invitation_code')
      .eq('invitation_code', invitationCode.trim())
      .eq('active', true)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { valid: false, error: 'Invalid invitation code' },
        { status: 200 }
      );
    }

    // Return success with referrer info (without sensitive data)
    return NextResponse.json({
      valid: true,
      referrer: {
        id: user.id,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Error validating invitation code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}