import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

const resend = new Resend(process.env.RESEND_API_KEY);

interface AnnouncementRequest {
  subject: string;
  content: string;
  scheduled: boolean;
  scheduledFor?: string;
}

function getAnnouncementEmailHtml(subject: string, content: string, userName: string = 'Valued Customer') {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">EG Driving School</h1>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">Important Announcement</p>
      </div>
      <div style="padding: 30px 20px; background-color: #f9fafb;">
        <h2 style="color: #1f2937; margin-top: 0; font-size: 20px;">${subject}</h2>
        <div style="font-size: 16px; line-height: 1.6; color: #374151; white-space: pre-wrap; margin: 20px 0;">${content}</div>
        
        <div style="margin-top: 30px; padding: 20px; background-color: white; border-radius: 8px; border-left: 4px solid #10b981; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <p style="margin: 0; font-size: 14px; color: #6b7280;">
            If you have any questions about this announcement, please don't hesitate to contact us:<br><br>
            📞 <strong>Phone:</strong> 0400 000 000<br>
            📧 <strong>Email:</strong> info@egdrivingschool.com<br>
            🌐 <strong>Website:</strong> www.egdrivingschool.com
          </p>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background-color: #f0f9ff; border-radius: 6px; border: 1px solid #bae6fd;">
          <p style="margin: 0; font-size: 13px; color: #0369a1; text-align: center;">
            Thank you for choosing EG Driving School for your driving education needs!
          </p>
        </div>
      </div>
      <div style="background-color: #1f2937; color: #9ca3af; padding: 15px 20px; text-align: center; font-size: 12px;">
        <p style="margin: 0;">&copy; 2025 EG Driving School. All rights reserved.</p>
        <p style="margin: 5px 0 0 0;">
          You received this announcement because you are a registered user of EG Driving School.
        </p>
      </div>
    </div>
  `;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify admin role
    const { data: userData, error: userError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body: AnnouncementRequest = await request.json();
    const { subject, content, scheduled, scheduledFor } = body;

    // Validation
    if (!subject?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: 'Subject and content are required' },
        { status: 400 }
      );
    }

    if (scheduled && !scheduledFor) {
      return NextResponse.json(
        { error: 'Scheduled date is required for scheduled announcements' },
        { status: 400 }
      );
    }

    // Get all users with email addresses
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('email, full_name')
      .not('email', 'is', null);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch recipients' },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: 'No users found to send announcements to' },
        { status: 400 }
      );
    }

    let announcementId: string;
    let status: 'sent' | 'scheduled' = 'sent';
    let sentCount = 0;

    if (scheduled) {
      // Store scheduled announcement
      status = 'scheduled';
      const { data: announcementData, error: insertError } = await supabase
        .from('announcements')
        .insert({
          subject,
          content,
          recipient_count: users.length,
          status: 'scheduled',
          scheduled_for: scheduledFor,
          sent_by: userId,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error storing scheduled announcement:', insertError);
        return NextResponse.json(
          { error: 'Failed to schedule announcement' },
          { status: 500 }
        );
      }

      announcementId = announcementData.id;

      return NextResponse.json({
        success: true,
        message: 'Announcement scheduled successfully',
        announcementId,
        scheduledFor,
        recipientCount: users.length
      });

    } else {
      // Send immediately
      const emailPromises = users.map(async (user) => {
        try {
          const emailHtml = getAnnouncementEmailHtml(subject, content, user.full_name || 'Valued Customer');
          
          const { error } = await resend.emails.send({
            from: 'EG Driving School <noreply@egdrivingschool.com>',
            to: [user.email],
            subject: `${subject} - EG Driving School`,
            html: emailHtml,
          });

          if (error) {
            console.error(`Failed to send email to ${user.email}:`, error);
            return { success: false, email: user.email, error };
          }

          return { success: true, email: user.email };
        } catch (error) {
          console.error(`Error sending email to ${user.email}:`, error);
          return { success: false, email: user.email, error };
        }
      });

      const emailResults = await Promise.all(emailPromises);
      sentCount = emailResults.filter(result => result.success).length;

      // Store announcement record
      const { data: announcementData, error: insertError } = await supabase
        .from('announcements')
        .insert({
          subject,
          content,
          recipient_count: sentCount,
          status: 'sent',
          sent_at: new Date().toISOString(),
          sent_by: userId,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error storing announcement record:', insertError);
        // Don't fail the request since emails were already sent
      } else {
        announcementId = announcementData.id;
      }

      // Log failed emails
      const failedEmails = emailResults.filter(result => !result.success);
      if (failedEmails.length > 0) {
        console.error('Failed to send emails to:', failedEmails);
      }

      return NextResponse.json({
        success: true,
        message: 'Announcement sent successfully',
        recipientCount: sentCount,
        totalUsers: users.length,
        failedCount: failedEmails.length,
        announcementId
      });
    }

  } catch (error) {
    console.error('Announcement API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}