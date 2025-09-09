import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Check authentication
    const { userId: clerkUserId } = auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { completed: false, authenticated: false },
        { status: 200 }
      );
    }
    
    // Check if user has completed onboarding
    const { data: user, error } = await supabase
      .from('users')
      .select('id, completed_onboarding, invitation_code')
      .eq('clerk_id', clerkUserId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error checking user profile:', error);
      return NextResponse.json(
        { completed: false, authenticated: true, error: 'Database error' },
        { status: 500 }
      );
    }
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkUserId);
    const profileCompletedInClerk = clerkUser.publicMetadata?.profileCompleted === true;
    
    // If user doesn't exist or hasn't completed onboarding in either system
    if (!user || !user.completed_onboarding || !profileCompletedInClerk) {
      return NextResponse.json({
        completed: false,
        authenticated: true,
        needsProfileCompletion: true
      });
    }
    
    return NextResponse.json({
      completed: true,
      authenticated: true,
      userId: user.id,
      invitationCode: user.invitation_code
    });
    
  } catch (error) {
    console.error('Profile completion check error:', error);
    return NextResponse.json(
      { completed: false, authenticated: true, error: 'Internal server error' },
      { status: 500 }
    );
  }
}