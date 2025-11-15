/**
 * User Profile API Route
 * Handles GET and PATCH requests for user profile data
 */
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
      personalInfo: !!(user.full_name),
      contactInfo: !!(user.email && user.phone),
      emergencyContact: !!(user.emergency_contact?.name && user.emergency_contact?.phone),
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
      suburb: user.suburb || undefined,
      experienceLevel: user.experience_level || undefined,
      emergencyContact: user.emergency_contact || undefined,
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

// PATCH - Update user profile data
async function handleUserProfileUpdate(request: NextRequest) {
  try {
    // Get authenticated user (Clerk)
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Map or provision user in Supabase
    const supabaseUserId = await getOrCreateSupabaseUserId(clerkUserId);

    // Parse request body
    const body = await request.json();
    const {
      phone,
      address,
      full_name,
      suburb,
      date_of_birth,
      experience_level,
      emergency_contact,
      invitationCode,
    } = body;

    // Build update object (only include provided fields)
    const updateData: Record<string, any> = {};
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (full_name !== undefined) updateData.full_name = full_name;
    if (suburb !== undefined) updateData.suburb = suburb;
    // Note: date_of_birth field doesn't exist in database, skipping
    if (experience_level !== undefined) updateData.experience_level = experience_level;
    if (emergency_contact !== undefined) updateData.emergency_contact = emergency_contact;

    // Update timestamp
    updateData.updated_at = new Date().toISOString();

    // Update user profile
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', supabaseUserId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user profile:', updateError);
      return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 });
    }

    // Process invitation code if provided
    // Note: Referral processing endpoint not yet implemented
    if (invitationCode) {
      console.log('Invitation code provided:', invitationCode.toUpperCase());
      console.log('Referral processing will be implemented in future update');
      // TODO: Implement referral processing logic
      // For now, just store the invitation code in user metadata if needed
    }

    // Return updated profile in the same format as GET
    const completionStatus = {
      personalInfo: !!(updatedUser.full_name && updatedUser.first_name && updatedUser.last_name),
      contactInfo: !!(updatedUser.email && updatedUser.phone),
      emergencyContact: !!(updatedUser.emergency_contact?.name && updatedUser.emergency_contact?.phone),
      drivingLicense: false,
      medicalInfo: false,
      preferences: false,
    };

    const userProfile = {
      id: updatedUser.id,
      email: updatedUser.email,
      fullName: updatedUser.full_name,
      phone: updatedUser.phone || undefined,
      dateOfBirth: updatedUser.date_of_birth || undefined,
      address: updatedUser.address || undefined,
      suburb: updatedUser.suburb || undefined,
      experienceLevel: updatedUser.experience_level || undefined,
      emergencyContact: updatedUser.emergency_contact || undefined,
      drivingLicense: undefined,
      medicalConditions: undefined,
      preferences: undefined,
      submittedAt: updatedUser.created_at,
      lastUpdated: updatedUser.updated_at,
      completionStatus
    };

    return NextResponse.json(userProfile);
  } catch (error) {
    console.error('User profile update API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withCentralizedStateManagement(handleUserProfileRequest, '/api/user/profile', {
  priority: 'high',
  maxRetries: 2,
  requireAuth: true
});

export const PATCH = withCentralizedStateManagement(handleUserProfileUpdate, '/api/user/profile', {
  priority: 'high',
  maxRetries: 1,
  requireAuth: true
});