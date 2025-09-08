import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  // Get the body
  const payload = await request.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.error('CLERK_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const wh = new Webhook(webhookSecret);

  let evt: any;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  // Handle the webhook
  const eventType = evt.type;
  console.log(`Clerk webhook received: ${eventType}`);

  try {
    switch (eventType) {
      case 'user.created':
        await handleUserCreated(evt.data);
        break;
      case 'user.updated':
        await handleUserUpdated(evt.data);
        break;
      case 'user.deleted':
        await handleUserDeleted(evt.data);
        break;
      default:
        console.log(`Unhandled webhook event: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`Error handling ${eventType}:`, error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleUserCreated(userData: any) {
  console.log('Handling user created:', userData.id);
  
  const email = userData.email_addresses?.[0]?.email_address || '';
  const firstName = userData.first_name || '';
  const lastName = userData.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim() || userData.username || '';

  try {
    // Insert or update user in Supabase
    const { error } = await supabase
      .from('users')
      .upsert({
        clerk_id: userData.id,
        email: email,
        full_name: fullName,
        first_name: firstName,
        last_name: lastName,
        profile_image_url: userData.profile_image_url || null,
        created_at: new Date(userData.created_at).toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'clerk_id'
      });

    if (error) {
      console.error('Error creating/updating user in Supabase:', error);
      throw error;
    }

    console.log('User successfully synced to Supabase:', userData.id);
  } catch (error) {
    console.error('Failed to sync user to Supabase:', error);
    throw error;
  }
}

async function handleUserUpdated(userData: any) {
  console.log('Handling user updated:', userData.id);
  
  const email = userData.email_addresses?.[0]?.email_address || '';
  const firstName = userData.first_name || '';
  const lastName = userData.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim() || userData.username || '';

  try {
    // Update user in Supabase
    const { error } = await supabase
      .from('users')
      .update({
        email: email,
        full_name: fullName,
        first_name: firstName,
        last_name: lastName,
        profile_image_url: userData.profile_image_url || null,
        updated_at: new Date().toISOString()
      })
      .eq('clerk_id', userData.id);

    if (error) {
      console.error('Error updating user in Supabase:', error);
      throw error;
    }

    console.log('User successfully updated in Supabase:', userData.id);
  } catch (error) {
    console.error('Failed to update user in Supabase:', error);
    throw error;
  }
}

async function handleUserDeleted(userData: any) {
  console.log('Handling user deleted:', userData.id);
  
  try {
    // Soft delete or hard delete user from Supabase
    // Using soft delete to preserve referential integrity
    const { error } = await supabase
      .from('users')
      .update({
        deleted_at: new Date().toISOString(),
        active: false
      })
      .eq('clerk_id', userData.id);

    if (error) {
      console.error('Error soft-deleting user in Supabase:', error);
      throw error;
    }

    console.log('User successfully soft-deleted in Supabase:', userData.id);
  } catch (error) {
    console.error('Failed to delete user from Supabase:', error);
    throw error;
  }
}
