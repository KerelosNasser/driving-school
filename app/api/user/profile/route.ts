import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/api/utils';
import { withCentralizedStateManagement } from '@/lib/api-middleware';

async function getOrCreateSupabaseUserId(clerkUserId: string): Promise<string> {
  // Try to find by clerk_id
  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_id', clerkUserId)
    .single();

  if (existing && existing.id) return existing.id;

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(clerkUserId);
  const email = clerkUser?.primaryEmailAddress?.emailAddress || clerkUser?.emailAddresses?.[0]?.emailAddress || '';
  const full_name = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') || clerkUser?.username || 'Unknown User';

  // Upsert user
  const { data: upserted, error: upsertError } = await supabaseAdmin
    .from('users')
    .upsert({ clerk_id: clerkUserId, email, full_name }, { onConflict: 'clerk_id' })
    .select('id')
    .single();

  if (upsertError || !upserted) {
    throw new Error(`Failed to provision user in Supabase: ${upsertError?.message || 'unknown error'}`);
  }

  return upserted.id as string;
}

// GET - Fetch user profile data for data review
async function handleUserProfileRequest(_request: NextRequest) {
  try {
    // Get authenticated user (Clerk)
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Map or provision user in Supabase
    const supabaseUserId = await getOrCreateSupabaseUserId(clerkUserId);

    // Get user profile data
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', supabaseUserId)
      .single();

    if (userError) {
      console.error('Error fetching user profile:', userError);
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }

    // Get additional profile information (if you have additional tables)
    // This could be extended to include emergency contacts, medical conditions, etc.

    // Calculate completion status based on available data
    const completionStatus = {
      personalInfo: !!(user.full_name && user.first_name && user.last_name),
      contactInfo: !!(user.email && user.phone),
      emergencyContact: false, // Set to true if you have emergency contact data
      drivingLicense: false, // Set to true if you have license data
      medicalInfo: false, // Set to true if you have medical data
      preferences: false, // Set to true if you have preference data
    };

    // Create a structured response that matches the expected UserProfile interface
    const userProfile = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone || undefined,
      dateOfBirth: user.date_of_birth || undefined,
      address: user.address || undefined,
      emergencyContact: undefined, // Add if you have this data
      drivingLicense: undefined, // Add if you have this data
      medicalConditions: undefined, // Add if you have this data
      preferences: undefined, // Add if you have this data
      submittedAt: user.created_at,
      lastUpdated: user.updated_at,
      completionStatus
    };

    return NextResponse.json(userProfile);
  } catch (error) {
    console.error('User profile API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withCentralizedStateManagement(handleUserProfileRequest, '/api/user/profile', {
  priority: 'high',
  maxRetries: 2,
  requireAuth: true
});