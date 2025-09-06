import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, start, end, location, description, lessonHours, bufferMinutes } = body;

    // Validate required fields
    if (!title || !start || !end || !location || !lessonHours) {
      return NextResponse.json(
        { error: 'Missing required booking fields' },
        { status: 400 }
      );
    }

    const accessToken = process.env.GOOGLE_OAUTH_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Calendar not connected' },
        { status: 401 }
      );
    }

    // Create calendar event
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
    const eventData = {
      summary: title,
      description: description || `${lessonHours} hour driving lesson`,
      location: location,
      start: {
        dateTime: start,
        timeZone: 'Australia/Brisbane'
      },
      end: {
        dateTime: end,
        timeZone: 'Australia/Brisbane'
      },
      attendees: [
        {
          email: process.env.NEXT_PUBLIC_ADMIN_EMAIL,
          responseStatus: 'accepted'
        }
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 24 hours before
          { method: 'popup', minutes: 30 }       // 30 minutes before
        ]
      }
    };

    const createEventResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      }
    );

    if (!createEventResponse.ok) {
      const errorText = await createEventResponse.text();
      console.error('Calendar event creation failed:', errorText);
      return NextResponse.json(
        { error: 'Failed to create calendar event' },
        { status: createEventResponse.status }
      );
    }

    const createdEvent = await createEventResponse.json();

    // TODO: Here you would also:
    // 1. Deduct lesson hours from user's quota
    // 2. Save booking details to your database
    // 3. Send confirmation email to user
    
    // For now, we'll simulate the quota deduction
    const quotaResponse = await fetch('/api/quota/consume', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify({
        hours: lessonHours,
        reason: 'Lesson booking',
        details: {
          calendarEventId: createdEvent.id,
          date: new Date(start).toISOString().split('T')[0],
          time: new Date(start).toTimeString().slice(0, 5),
          location: location,
          title: title
        }
      }),
    });

    const booking = {
      id: createdEvent.id,
      title,
      start,
      end,
      location,
      description,
      lessonHours,
      bufferMinutes,
      calendarEventId: createdEvent.id,
      calendarEventLink: createdEvent.htmlLink,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      booking,
      message: `Lesson booked successfully! ${lessonHours} hours have been deducted from your quota.`
    });

  } catch (error) {
    console.error('Error booking calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to book lesson' },
      { status: 500 }
    );
  }
}
