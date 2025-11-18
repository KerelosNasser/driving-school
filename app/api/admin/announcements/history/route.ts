import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { isUserAdmin } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const admin = await isUserAdmin(userId);
    if (!admin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { data: announcements, error: fetchError } = await supabase
      .from('announcements')
      .select('id, subject, content, recipient_count, status, sent_at, scheduled_for, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (fetchError) {
      console.error('Error fetching announcements:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch announcement history' },
        { status: 500 }
      );
    }

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