import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
  reason?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const bufferMinutes = parseInt(searchParams.get('bufferMinutes') || '30');

    if (!date) {
      return NextResponse.json({ error: 'Date parameter required' }, { status: 400 });
    }

    // Validate date format
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    const accessToken = process.env.GOOGLE_OAUTH_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Calendar not connected' },
        { status: 401 }
      );
    }

    // Set up time range for the day
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch events from Google Calendar
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
    const eventsUrl = new URL('https://www.googleapis.com/calendar/v3/calendars/' + encodeURIComponent(calendarId) + '/events');
    eventsUrl.searchParams.set('timeMin', startOfDay.toISOString());
    eventsUrl.searchParams.set('timeMax', endOfDay.toISOString());
    eventsUrl.searchParams.set('singleEvents', 'true');
    eventsUrl.searchParams.set('orderBy', 'startTime');

    const eventsResponse = await fetch(eventsUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!eventsResponse.ok) {
      const errorText = await eventsResponse.text();
      console.error('Google Calendar API error:', eventsResponse.status, errorText);
      return NextResponse.json(
        { error: 'Failed to fetch calendar events' },
        { status: eventsResponse.status }
      );
    }

    const eventsData = await eventsResponse.json();
    const events: CalendarEvent[] = (eventsData.items || []).map((event: any) => ({
      id: event.id,
      title: event.summary || 'Untitled Event',
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
      location: event.location,
      description: event.description,
      status: event.status === 'confirmed' ? 'confirmed' : 
              event.status === 'tentative' ? 'tentative' : 'cancelled'
    }));

    // Generate available time slots with enhanced real-time capabilities
    const workingHours = {
      start: 8,  // 8 AM
      end: 20,   // 8 PM (extended hours)
      interval: 60, // 1 hour slots
      breakStart: 12, // 12 PM lunch break
      breakEnd: 13,   // 1 PM
      minAdvanceHours: 2 // Minimum 2 hours advance booking
    };

    const slots: TimeSlot[] = [];
    const now = new Date();
    const minBookingTime = new Date(now.getTime() + workingHours.minAdvanceHours * 60 * 60 * 1000);
    
    // Generate slots with 30-minute intervals for better availability
    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        // Skip lunch break
        if (hour >= workingHours.breakStart && hour < workingHours.breakEnd) {
          continue;
        }

        const slotStart = new Date(targetDate);
        slotStart.setHours(hour, minute, 0, 0);
        
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotStart.getMinutes() + workingHours.interval);

        // Enhanced conflict detection with buffer time
        const hasConflict = events.some(event => {
          if (event.status === 'cancelled') return false;
          
          const eventStart = new Date(event.start);
          const eventEnd = new Date(event.end);
          
          // Add buffer time to event boundaries
          const bufferedStart = new Date(eventStart.getTime() - bufferMinutes * 60000);
          const bufferedEnd = new Date(eventEnd.getTime() + bufferMinutes * 60000);
          
          return (slotStart < bufferedEnd && slotEnd > bufferedStart);
        });

        // Check if it's too soon to book or in the past
        const isTooSoon = slotStart <= minBookingTime;
        const isPast = slotEnd <= now;
        const isWeekend = targetDate.getDay() === 0 || targetDate.getDay() === 6;

        // Determine availability and reason
        const available = !hasConflict && !isPast && !isTooSoon && !isWeekend;
        let reason: string | undefined;
        
        if (isPast) reason = 'Past time';
        else if (isTooSoon) reason = `Requires ${workingHours.minAdvanceHours}h advance booking`;
        else if (hasConflict) reason = 'Conflicting appointment';
        else if (isWeekend) reason = 'Weekend - No lessons available';

        slots.push({
          start: slotStart.toTimeString().slice(0, 5), // HH:MM format
          end: slotEnd.toTimeString().slice(0, 5),
          available,
          reason
        });
      }
    }

    return NextResponse.json({
      slots,
      events,
      date,
      bufferMinutes
    });

  } catch (error) {
    console.error('Error fetching calendar availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar availability' },
      { status: 500 }
    );
  }
}
