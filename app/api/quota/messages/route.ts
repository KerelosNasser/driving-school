import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { withCentralizedStateManagement } from '@/lib/api-middleware';
import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/api/utils';

const resend = new Resend(process.env.RESEND_API_KEY);

// Centralized state management replaces individual rate limiting

async function getOrCreateSupabaseUserId(clerkUserId: string): Promise<string> {
  const { data: existingByClerk } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_id', clerkUserId)
    .maybeSingle();

  if (existingByClerk?.id) return existingByClerk.id as string;

  const ClerkClient = await clerkClient();
  const clerkUser = await ClerkClient.users.getUser(clerkUserId);
  const email =
    clerkUser?.primaryEmailAddress?.emailAddress ||
    clerkUser?.emailAddresses?.[0]?.emailAddress ||
    '';
  const full_name =
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') ||
    clerkUser?.username ||
    'Unknown User';

  // Link by email if exists
  if (email) {
    const { data: existingByEmail } = await supabaseAdmin
      .from('users')
      .select('id, clerk_id')
      .eq('email', email)
      .maybeSingle();

    if (existingByEmail?.id) {
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('users')
        .update({ clerk_id: clerkUserId, full_name })
        .eq('id', existingByEmail.id)
        .select('id')
        .single();
      if (updateError || !updated?.id) {
        throw new Error(`Failed to link existing user to Clerk: ${updateError?.message || 'unknown error'}`);
      }
      return updated.id as string;
    }
  }

  // Insert new and handle race on unique email
  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('users')
    .insert({ clerk_id: clerkUserId, email, full_name })
    .select('id')
    .single();

  if (insertError || !inserted?.id) {
    const message = (insertError as any)?.message || '';
    const code = (insertError as any)?.code || '';
    if (code === '23505' && message.includes('users_email_key') && email) {
      const { data: after } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      if (after?.id) {
        const { data: updated, error: updateError2 } = await supabaseAdmin
          .from('users')
          .update({ clerk_id: clerkUserId, full_name })
          .eq('id', after.id)
          .select('id')
          .single();
        if (updateError2 || !updated?.id) {
          throw new Error(`Failed to finalize user provisioning after conflict: ${updateError2?.message || 'unknown error'}`);
        }
        return updated.id as string;
      }
    }
    throw new Error(`Failed to provision user in Supabase: ${insertError?.message || 'unknown error'}`);
  }

  return inserted.id as string;
}

// GET - Fetch user's messages with instructors
async function handleQuotaMessagesGetRequest(request: NextRequest) {
  try {

    // Get authenticated user
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUserId = await getOrCreateSupabaseUserId(clerkUserId);

    // Get query parameters for pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = (page - 1) * limit;

    // Fetch messages
    const { data: messages, error } = await supabase
      .from('instructor_messages')
      .select('*')
      .eq('user_id', supabaseUserId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('instructor_messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', supabaseUserId);

    if (countError) {
      console.error('Error getting message count:', countError);
      return NextResponse.json({ error: 'Failed to get message count' }, { status: 500 });
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      messages,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_count: count || 0,
        limit,
        has_next: page < totalPages,
        has_prev: page > 1,
      },
    });
  } catch (error) {
    console.error('Messages API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Send message to instructor
async function handleQuotaMessagesPostRequest(request: NextRequest) {
  try {

    // Get authenticated user
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUserId = await getOrCreateSupabaseUserId(clerkUserId);

    // Check if request body is empty before parsing
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      return NextResponse.json({ error: 'Invalid or empty request body' }, { status: 400 });
    }
    
    const { subject, message, instructor_email } = requestBody;

    if (!subject || !message) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 });
    }

    if (subject.length > 200 || message.length > 2000) {
      return NextResponse.json({ error: 'Subject or message too long' }, { status: 400 });
    }

    // Get user details for the email
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('email, full_name, phone')
      .eq('id', supabaseUserId)
      .single();

    if (userError || !user) {
      console.error('Error fetching user:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Store message in database
    const { data: messageRecord, error: insertError } = await supabase
      .from('instructor_messages')
      .insert({
        user_id: supabaseUserId,
        subject,
        message,
        instructor_email: instructor_email || process.env.INSTRUCTOR_EMAIL || 'instructor@drivingschool.com',
        status: 'sent',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error storing message:', insertError);
      return NextResponse.json({ error: 'Failed to store message' }, { status: 500 });
    }

    // Send email to instructor
    try {
      const instructorEmailAddress = instructor_email || process.env.INSTRUCTOR_EMAIL || 'instructor@drivingschool.com';

      await resend.emails.send({
        from: process.env.FROM_EMAIL || 'noreply@drivingschool.com',
        to: instructorEmailAddress,
        subject: `Student Message: ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">New Message from Student</h2>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #555;">Student Details:</h3>
              <p><strong>Name:</strong> ${user.full_name}</p>
              <p><strong>Email:</strong> ${user.email}</p>
              <p><strong>Phone:</strong> ${user.phone || 'Not provided'}</p>
            </div>
            <div style="background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
              <h3 style="margin: 0 0 15px 0; color: #333;">Subject: ${subject}</h3>
              <div style="line-height: 1.6; color: #555;">
                ${message.replace(/\n/g, '<br>')}
              </div>
            </div>
            <div style="margin-top: 20px; padding: 15px; background: #e8f4fd; border-radius: 8px;">
              <p style="margin: 0; font-size: 14px; color: #666;">
                <strong>Note:</strong> Please reply directly to the student's email address: ${user.email}
              </p>
            </div>
          </div>
        `,
        replyTo: user.email,
      });

      // Update message status to delivered
      await supabase
        .from('instructor_messages')
        .update({ status: 'delivered' })
        .eq('id', messageRecord.id);
    } catch (emailError) {
      console.error('Error sending email:', emailError);

      // Update message status to failed
      await supabase
        .from('instructor_messages')
        .update({ status: 'failed' })
        .eq('id', messageRecord.id);

      return NextResponse.json(
        { error: 'Message saved but email delivery failed', message_id: messageRecord.id },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Message sent successfully', message_id: messageRecord.id });
  } catch (error) {
    console.error('Message sending error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withCentralizedStateManagement(handleQuotaMessagesGetRequest, '/api/quota/messages', {
  priority: 'medium',
  maxRetries: 2,
  requireAuth: true
});

export const POST = withCentralizedStateManagement(handleQuotaMessagesPostRequest, '/api/quota/messages', {
  priority: 'high',
  maxRetries: 1,
  requireAuth: true
});