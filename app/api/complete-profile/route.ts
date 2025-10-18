import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { validatePhoneNumber, isTestPhoneBypassEnabled, isBypassPhoneNumber, formatForStorage } from '@/lib/phone';
import { generateEncryptedInvitationCode, generateSimpleInvitationCode } from '@/lib/invitation-crypto';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Rate limiting configuration

interface CompleteProfileRequest {
  fullName: string;
  phone: string;
  location: string;
  invitationCode?: string;
  deviceFingerprint: string;
  userAgent: string;
}

interface ValidationErrors {
  fullName?: string;
  phone?: string;
  location?: string;
  invitationCode?: string;
  general?: string;
}

// Server-side validation functions
function validateFullName(name: string): string | undefined {
  if (!name || !name.trim()) return 'Full name is required';
  if (name.trim().length < 2) return 'Full name must be at least 2 characters';
  if (name.trim().length > 100) return 'Full name must be less than 100 characters';
  if (!/^[a-zA-Z\s'-]+$/.test(name.trim())) {
    return 'Full name can only contain letters, spaces, hyphens, and apostrophes';
  }
  return undefined;
}

function validatePhone(phone: string): string | undefined {
  if (!phone || !phone.trim()) return 'Phone number is required';
  // Dev/Test bypass: allow reserved test numbers when enabled
  if (isTestPhoneBypassEnabled(true) && isBypassPhoneNumber(phone)) {
    return undefined;
  }
  const phoneValidation = validatePhoneNumber(phone);
  if (!phoneValidation.isValid) {
    return phoneValidation.error || 'Please enter a valid phone number';
  }
  return undefined;
}

function validateLocation(location: string): string | undefined {
  if (!location || !location.trim()) return 'Location is required';
  if (location.trim().length < 3) return 'Please enter a more specific location';
  if (location.trim().length > 200) return 'Location must be less than 200 characters';
  return undefined;
}

function validateInvitationCode(code: string): string | undefined {
  if (!code) return undefined; // Optional field
  
  const trimmedCode = code.trim();
  
  // Check for encrypted invitation codes (longer format)
  if (trimmedCode.length > 20 && /^[A-Za-z0-9_-]+$/.test(trimmedCode)) {
    return undefined;
  }
  
  // Check for simple invitation codes (DRV prefix)
  if (trimmedCode.startsWith('DRV') && trimmedCode.length >= 6 && /^[A-Z0-9]+$/.test(trimmedCode.toUpperCase())) {
    return undefined;
  }
  
  // Legacy 8-character codes
  if (trimmedCode.length === 8 && /^[A-Z0-9]{8}$/.test(trimmedCode.toUpperCase())) {
    return undefined;
  }
  
  return 'Invalid invitation code format';
}

// Get client IP address
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');

  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(',')[0].trim();

  return '127.0.0.1'; // Fallback
}

// Helper function to check device fingerprint for duplicates
async function checkDeviceFingerprint(_fingerprint: string, _excludeUserId?: string): Promise<boolean> {
  try {
    // This is a placeholder - implement based on your fraud detection needs
    console.log('Checking device fingerprint');
    return false; // No duplicates found
  } catch (error) {
    console.error('Error checking device fingerprint:', error);
    return false;
  }
}

// Helper function to store device fingerprint
async function storeDeviceFingerprint(
  _userId: string,
  _fingerprint: string,
  _ipAddress: string,
  _userAgent: string
): Promise<void> {
  try {
    // This is a placeholder - implement based on your fraud detection needs
    console.log('Storing device fingerprint');
  } catch (error) {
    console.error('Error storing device fingerprint:', error);
    throw error;
  }
}

// Helper function to send referral notification
async function sendReferralNotification(referralId: string, referredUserName: string): Promise<void> {
  try {
    // This is a placeholder - implement email/notification sending
    console.log('Sending referral notification for referral:', referralId, 'User:', referredUserName);

    // You can implement actual email sending here using your notification service
    // await sendEmailNotification(referrerEmail, 'New Referral!', `Someone used your invitation code!`);
  } catch (error) {
    console.error('Error sending referral notification:', error);
    throw error;
  }
}

async function processProfileCompletion(request: NextRequest, clerkUserId: string) {
  console.log('Processing profile completion for user:', clerkUserId);
  
  // Parse request body
  console.log('Parsing request body...');
  let body: CompleteProfileRequest;
  try {
    body = await request.json();
    console.log('Request body parsed:', {
      fullName: body.fullName,
      phone: body.phone,
      location: body.location,
      invitationCode: body.invitationCode ? '***PROVIDED***' : undefined,
      hasDeviceFingerprint: !!body.deviceFingerprint,
      hasUserAgent: !!body.userAgent
    });
  } catch (parseError) {
    console.error('Error parsing request body:', parseError);
    return NextResponse.json(
      { message: 'Invalid request body' },
      { status: 400 }
    );
  }
  const { fullName, phone, location, invitationCode, deviceFingerprint, userAgent } = body;

  // Server-side validation
  console.log('Validating form data...');
  const errors: ValidationErrors = {};
  
  const fullNameError = validateFullName(fullName);
  if (fullNameError) errors.fullName = fullNameError;
  
  const phoneError = validatePhone(phone);
  if (phoneError) errors.phone = phoneError;
  
  const locationError = validateLocation(location);
  if (locationError) errors.location = locationError;
  
  const invitationCodeError = validateInvitationCode(invitationCode || '');
  if (invitationCodeError) errors.invitationCode = invitationCodeError;
  
  if (Object.keys(errors).length > 0) {
    console.log('Validation errors:', errors);
    return NextResponse.json(
      { message: 'Validation failed', errors },
      { status: 400 }
    );
  }
  
  console.log('Validation passed, proceeding with profile completion...');

  // Get client IP
  const clientIP = getClientIP(request);
  
  // For debug mode, create a simple response
  if (clerkUserId.startsWith('debug-user-')) {
    console.log('DEBUG MODE: Returning success without database operations');
    return NextResponse.json({
      message: 'Profile completed successfully (DEBUG MODE)',
      invitationCode: 'DEBUG123',
      userId: clerkUserId,
      debug: true
    });
  }
  
  // Continue with normal database operations for real users
  console.log('Processing real user profile completion...');
  
  // Check if user already exists
  console.log('Checking if user exists in database...');
  const { data: existingUser, error: userCheckError } = await supabase
    .from('users')
    .select('id, completed_onboarding')
    .eq('clerk_id', clerkUserId)
    .single();
  
  if (userCheckError && userCheckError.code !== 'PGRST116') {
    console.error('Error checking existing user:', userCheckError);
    return NextResponse.json(
      { message: 'Database error while checking user' },
      { status: 500 }
    );
  }
  
  // If user already completed onboarding, prevent duplicate submission
  if (existingUser?.completed_onboarding) {
    console.log('User already completed onboarding');
    return NextResponse.json(
      { message: 'Profile already completed' },
      { status: 400 }
    );
  }
  
  // Check device fingerprint for duplicate accounts (if we have fingerprint)
  if (body.deviceFingerprint) {
    console.log('Checking device fingerprint for duplicates...');
    try {
      const hasDuplicateDevice = await checkDeviceFingerprint(
        body.deviceFingerprint,
        existingUser?.id || ''
      );
      
      if (hasDuplicateDevice) {
        console.log('Duplicate device detected');
        return NextResponse.json(
          { message: 'Multiple accounts from the same device are not allowed' },
          { status: 400 }
        );
      }
    } catch (fingerprintError) {
      console.error('Error checking device fingerprint (non-critical):', fingerprintError);
      // Continue anyway
    }
  }
  
  let userId: string;
  
  if (existingUser) {
    // Update existing user
    console.log('Updating existing user:', existingUser.id);
    userId = existingUser.id;
    
    const { error: updateError } = await supabase
      .from('users')
      .update({
        full_name: fullName.trim(),
        phone: formatForStorage(phone.trim()),
        location: location.trim(),
        completed_onboarding: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json(
        { message: 'Failed to update profile' },
        { status: 500 }
      );
    }
  } else {
    // Create new user
    console.log('Creating new user in database...');
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        clerk_id: clerkUserId,
        email: '', // Will be updated by webhook or can be fetched from Clerk
        full_name: fullName.trim(),
        phone: formatForStorage(phone.trim()),
        location: location.trim(),
        completed_onboarding: true
      })
      .select('id')
      .single();
    
    if (createError || !newUser) {
      console.error('Error creating user:', createError);
      return NextResponse.json(
        { message: 'Failed to create profile' },
        { status: 500 }
      );
    }
    
    userId = newUser.id;
    console.log('New user created with ID:', userId);
  }
  
  // Store device fingerprint (if available)
  if (body.deviceFingerprint) {
    console.log('Storing device fingerprint...');
    try {
      await storeDeviceFingerprint(userId, deviceFingerprint, clientIP, userAgent);
    } catch (error) {
      console.error('Error storing device fingerprint (non-critical):', error);
      // Don't fail the entire request for this
    }
  }
  
  // Process referral if invitation code provided
  if (invitationCode) {
    console.log('Processing referral with invitation code...');
    try {
      // Call the new process-referral API endpoint
      const referralResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/process-referral`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` // Use service role for internal API calls
        },
        body: JSON.stringify({
          invitationCode: invitationCode.toUpperCase(),
          newUserId: userId,
          newUserEmail: '', // Will be filled by webhook or can be fetched from Clerk
          deviceFingerprint: deviceFingerprint,
          ipAddress: clientIP,
          userAgent: userAgent
        })
      });

      if (referralResponse.ok) {
        const referralData = await referralResponse.json();
        console.log('Referral processed successfully:', referralData);

        // Send notification to referrer if we have a referral ID
        if (referralData.referral_id) {
          try {
            console.log('Sending notification to referrer...');
            await sendReferralNotification(referralData.referral_id, fullName.trim());
          } catch (notificationError) {
            console.error('Error sending referral notification (non-critical):', notificationError);
            // Don't fail the entire request for notification errors
          }
        }
      } else {
        const errorData = await referralResponse.json();
        console.error('Referral processing failed:', errorData);
        // Don't fail the entire request for referral processing errors
        console.warn('Referral processing failed, but allowing profile completion to continue');
      }
    } catch (error: any) {
      console.error('Error calling process-referral endpoint:', error);
      // Instead of failing the entire request, just log the error and continue
      // This allows the user to complete their profile even if referral processing fails
      console.warn('Referral processing failed, but allowing profile completion to continue');
    }
  }
  
  // Generate invitation code for the user
  console.log('Generating invitation code for user...');
  let userInvitationCode: string;
  try {
    // Try encrypted invitation code first
    userInvitationCode = generateEncryptedInvitationCode(userId);
    console.log('Encrypted invitation code generated:', userInvitationCode);
  } catch (error) {
    console.warn('Encryption failed, using simple code:', error);
    // Fallback to simple invitation code
    try {
      userInvitationCode = generateSimpleInvitationCode();
      console.log('Simple invitation code generated:', userInvitationCode);
    } catch (fallbackError) {
      console.error('All invitation code generation failed:', fallbackError);
      userInvitationCode = 'DRV' + Math.random().toString(36).substring(2, 9).toUpperCase();
    }
  }

  // Create invitation code record in invitation_codes table
  try {
    await supabase
      .from('invitation_codes')
      .insert({
        user_id: userId,
        code: userInvitationCode,
        is_active: true,
        current_uses: 0,
        max_uses: null
      });
    console.log('Invitation code record created successfully');
  } catch (inviteError) {
    console.warn('Could not create invitation code record (non-critical):', inviteError);
  }
  
  // Initialize user quota (optional - don't fail if quota table doesn't exist)
  console.log('Initializing user quota...');
  try {
    const { error: quotaError } = await supabase
      .from('user_quotas')
      .upsert({
        user_id: userId,
        total_hours: 0,
        used_hours: 0
      }, {
        onConflict: 'user_id'
      });
    
    if (quotaError) {
      console.error('Error initializing user quota (non-critical):', quotaError);
    }
  } catch (error) {
    console.error('Error initializing quota (non-critical):', error);
    // This is non-critical, so we continue
  }

  // Update Clerk user metadata to mark profile as completed
  console.log('Updating Clerk user metadata...');
  try {
    const { clerkClient } = await import('@clerk/nextjs/server');
    const client = await clerkClient();
    await client.users.updateUserMetadata(clerkUserId, {
      publicMetadata: {
        profileCompleted: true
      }
    });
    console.log('Clerk user metadata updated successfully');
  } catch (clerkError) {
    console.error('Error updating Clerk metadata (non-critical):', clerkError);
    // Don't fail the entire request for this
  }
  
  console.log('Profile completion successful!');
  return NextResponse.json({
    message: 'Profile completed successfully',
    invitationCode: userInvitationCode,
    userId: userId
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== Complete Profile API Called ===');
    
    // Rate limiting
    const identifier = getClientIP(request);
    console.log('Client IP:', identifier);
    // Check authentication with detailed debugging
    console.log('Checking authentication...');
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    
    try {
      const authResult = await auth();
      console.log('Full auth result:', authResult);

      const { userId: clerkUserId, sessionId, orgId } = authResult;
      
      console.log('Auth details:', {
        userId: clerkUserId,
        sessionId: sessionId,
        orgId: orgId,
        hasUserId: !!clerkUserId
      });
      
      if (!clerkUserId) {
        console.log('No authenticated user found - userId is null/undefined');
        console.log('Session ID:', sessionId);
        console.log('This might be a session/cookie issue');
        
        // TEMPORARY DEBUG MODE: Allow the request to proceed without auth for debugging
        const debugMode = process.env.NODE_ENV === 'development';
        if (debugMode) {
          console.log('🚨 DEBUG MODE: Proceeding without authentication for debugging');
          // Create a temporary user ID for testing
          const tempUserId = 'debug-user-' + Date.now();
          console.log('Using temporary user ID:', tempUserId);
          
          // Continue with a mock user ID
          return await processProfileCompletion(request, tempUserId);
        }
        
        return NextResponse.json(
          { 
            message: 'Unauthorized - Please sign in again', 
            debug: {
              hasUserId: !!clerkUserId,
              hasSessionId: !!sessionId,
              timestamp: new Date().toISOString()
            }
          },
          { status: 401 }
        );
      }
      
      console.log('Successfully authenticated user ID:', clerkUserId);
      
      // Process the profile completion
      return await processProfileCompletion(request, clerkUserId);
      
    } catch (authError) {
      console.error('Authentication error:', authError);
      return NextResponse.json(
        { message: 'Authentication failed' },
        { status: 401 }
      );
    }
    
  } catch (error) {
    console.error('Complete profile error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
