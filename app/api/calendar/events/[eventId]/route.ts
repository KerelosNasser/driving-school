import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { TokenManager } from '@/lib/oauth/token-manager';

interface RouteParams {
  params: {
    eventId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId } = params;
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // Get user's valid access token
    const accessToken = await TokenManager.getValidAccessToken(userId);
    if (!accessToken) {
      return NextResponse.json({ 
        error: 'Calendar not connected or tokens expired. Please reconnect your calendar.' 
      }, { status: 401 });
    }

    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    const eventResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!eventResponse.ok) {
      if (eventResponse.status === 404) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 });
      }
      const errorText = await eventResponse.text();
      console.error('Failed to fetch calendar event:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch calendar event' },
        { status: eventResponse.status }
      );
    }

    const event = await eventResponse.json();

    return NextResponse.json({
      success: true,
      event
    });

  } catch (error) {
    console.error('Error fetching calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar event' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId } = params;
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // Get user's valid access token
    const accessToken = await TokenManager.getValidAccessToken(userId);
    if (!accessToken) {
      return NextResponse.json({ 
        error: 'Calendar not connected or tokens expired. Please reconnect your calendar.' 
      }, { status: 401 });
    }

    const body = await request.json();
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    // First, get the existing event to preserve fields not being updated
    const existingEventResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!existingEventResponse.ok) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const existingEvent = await existingEventResponse.json();

    // Merge the updates with existing event data
    const updatedEventData = {
      ...existingEvent,
      ...body,
      // Ensure start and end times have proper timezone if they're being updated
      start: body.start ? (typeof body.start === 'string' ? { dateTime: body.start, timeZone: 'Australia/Brisbane' } : body.start) : existingEvent.start,
      end: body.end ? (typeof body.end === 'string' ? { dateTime: body.end, timeZone: 'Australia/Brisbane' } : body.end) : existingEvent.end,
    };

    const updateResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedEventData),
      }
    );

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('Failed to update calendar event:', errorText);
      return NextResponse.json(
        { error: 'Failed to update calendar event' },
        { status: updateResponse.status }
      );
    }

    const updatedEvent = await updateResponse.json();

    return NextResponse.json({
      success: true,
      event: updatedEvent,
      message: 'Event updated successfully'
    });

  } catch (error) {
    console.error('Error updating calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to update calendar event' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId } = params;
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // Get user's valid access token
    const accessToken = await TokenManager.getValidAccessToken(userId);
    if (!accessToken) {
      return NextResponse.json({ 
        error: 'Calendar not connected or tokens expired. Please reconnect your calendar.' 
      }, { status: 401 });
    }

    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    const deleteResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!deleteResponse.ok) {
      if (deleteResponse.status === 404) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 });
      }
      const errorText = await deleteResponse.text();
      console.error('Failed to delete calendar event:', errorText);
      return NextResponse.json(
        { error: 'Failed to delete calendar event' },
        { status: deleteResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to delete calendar event' },
      { status: 500 }
    );
  }
}