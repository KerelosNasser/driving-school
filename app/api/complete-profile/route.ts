import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '@/lib/rate-limit';
import { validatePhoneNumber, formatForStorage } from '@/lib/phone';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Rate limiting configuration
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Allow 500 unique tokens per interval
});

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
  if (!/^[A-Z0-9]{8}$/.test(code.toUpperCase())) {
    return 'Invitation code must be 8 characters (letters and numbers only)';
  }
  return undefined;
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

// Check for existing device fingerprint
async function checkDeviceFingerprint(fingerprint: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('device_fingerprints')
    .select('user_id')
    .eq('fingerprint_hash', fingerprint)
    .neq('user_id', userId)
    .limit(1);
  
  if (error) {
    console.error('Error checking device fingerprint:', error);
    return false;
  }
  
  return data && data.length > 0;
}

// Store device fingerprint
async function storeDeviceFingerprint(
  userId: string,
  fingerprint: string,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  const { error } = await supabase
    .from('device_fingerprints')
    .upsert({
      user_id: userId,
      fingerprint_hash: fingerprint,
      ip_address: ipAddress,
      user_agent: userAgent,
      screen_resolution: null, // Can be added later if needed
      timezone: null,
      language: null,
      last_seen_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,fingerprint_hash'
    });
  
  if (error) {
    console.error('Error storing device fingerprint:', error);
    throw new Error('Failed to store device fingerprint');
  }
}

// Generate and store invitation code for user
async function generateUserInvitationCode(userId: string): Promise<string> {
  const { data, error } = await supabase
    .rpc('create_user_invitation_code', { p_user_id: userId });
  
  if (error) {
    console.error('Error generating invitation code:', error);
    throw new Error('Failed to generate invitation code');
  }
  
  return data;
}

// Process referral if invitation code is provided
async function processReferral(
  userId: string,
  invitationCode: string,
  deviceFingerprint: string,
  ipAddress: string
): Promise<void> {
  const { error } = await supabase
    .rpc('process_referral', {
      p_referred_user_id: userId,
      p_invitation_code: invitationCode,
      p_device_fingerprint: deviceFingerprint,
      p_ip_address: ipAddress
    });
  
  if (error) {
    console.error('Error processing referral:', error);
    throw new Error(error.message || 'Failed to process referral');
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIP(request);
    const { success } = await limiter.check(request,5, identifier); // 5 requests per minute per IP
    if (!success) {
      return NextResponse.json(
        { message: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
    
    // Check authentication
    const { userId: clerkUserId } = auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body: CompleteProfileRequest = await request.json();
    const { fullName, phone, location, invitationCode, deviceFingerprint, userAgent } = body;
    
    // Server-side validation
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
      return NextResponse.json(
        { message: 'Validation failed', errors },
        { status: 400 }
      );
    }
    
    // Get client IP
    const clientIP = getClientIP(request);
    
    // Check if user already exists
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('id, completed_onboarding')
      .eq('clerk_id', clerkUserId)
      .single();
    
    if (userCheckError && userCheckError.code !== 'PGRST116') {
      console.error('Error checking existing user:', userCheckError);
      return NextResponse.json(
        { message: 'Database error' },
        { status: 500 }
      );
    }
    
    // If user already completed onboarding, prevent duplicate submission
    if (existingUser?.completed_onboarding) {
      return NextResponse.json(
        { message: 'Profile already completed' },
        { status: 400 }
      );
    }
    
    // Check device fingerprint for duplicate accounts
    if (deviceFingerprint) {
      const hasDuplicateDevice = await checkDeviceFingerprint(
        deviceFingerprint,
        existingUser?.id || ''
      );
      
      if (hasDuplicateDevice) {
        return NextResponse.json(
          { message: 'Multiple accounts from the same device are not allowed' },
          { status: 400 }
        );
      }
    }
    
    let userId: string;
    
    if (existingUser) {
      // Update existing user
      userId = existingUser.id;
      
      const { error: updateError } = await supabase
        .from('users')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim(),
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
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          clerk_id: clerkUserId,
          email: '', // Will be updated by webhook
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
    }
    
    // Store device fingerprint
    if (deviceFingerprint) {
      try {
        await storeDeviceFingerprint(userId, deviceFingerprint, clientIP, userAgent);
      } catch (error) {
        console.error('Error storing device fingerprint:', error);
        // Don't fail the entire request for this
      }
    }
    
    // Process referral if invitation code provided
    if (invitationCode) {
      try {
        await processReferral(userId, invitationCode.toUpperCase(), deviceFingerprint, clientIP);
      } catch (error: any) {
        console.error('Error processing referral:', error);
        return NextResponse.json(
          { message: error.message || 'Invalid invitation code' },
          { status: 400 }
        );
      }
    }
    
    // Generate invitation code for the user
    let userInvitationCode: string;
    try {
      userInvitationCode = await generateUserInvitationCode(userId);
    } catch (error) {
      console.error('Error generating invitation code:', error);
      // Don't fail the entire request for this
      userInvitationCode = '';
    }
    
    // Initialize user quota
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
        console.error('Error initializing user quota:', quotaError);
      }
    } catch (error) {
      console.error('Error initializing quota:', error);
    }
    
    return NextResponse.json({
      message: 'Profile completed successfully',
      invitationCode: userInvitationCode,
      userId: userId
    });
    
  } catch (error) {
    console.error('Complete profile error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}