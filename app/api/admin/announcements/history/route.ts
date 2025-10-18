import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
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

    // Fetch announcement history
    const { data: announcements, error: fetchError } = await supabase
      .from('announcements')
      .select('id, subject, content, recipient_count, status, sent_at, scheduled_for, created_at')
      .order('created_at', { ascending: false })
      .limit(50); // Limit to last 50 announcements

    if (fetchError) {
      console.error('Error fetching announcements:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch announcement history' },
        { status: 500 }
      );
    }

    // Format the data for the frontend
    const formattedAnnouncements = (announcements || []).map(announcement => ({
      id: announcement.id,
      subject: announcement.subject,
      content: announcement.content,
      recipient_count: announcement.recipient_count,
      status: announcement.status,
      sent_at: announcement.sent_at || announcement.created_at,
      scheduled_for: announcement.scheduled_for,
    }));

    return NextResponse.json({
      success: true,
      announcements: formattedAnnouncements
    });

  } catch (error) {
    console.error('Announcement history API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}