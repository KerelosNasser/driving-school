import { NextRequest, NextResponse } from 'next/server';
import { EnhancedCalendarService } from '@/lib/calendar/enhanced-calendar-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const month = searchParams.get('month'); // YYYY-MM
    const admin = searchParams.get('admin') === 'true';
    const eventType = searchParams.get('eventType') ?? 'events';

    console.log('📅 [CALENDAR EVENTS API] Request received:', {
      date,
      month,
      admin,
      eventType,
      url: request.url
    });

    const calendarService = new EnhancedCalendarService();

    let events: any[];
    let startDate: string;
    let endDate: string;

    if (month) {
      // Month range: first day 00:00 to first day of next month 00:00
      const [yyyyStr, mmStr] = month.split('-');
      const yyyy = parseInt(yyyyStr, 10);
      const mm = parseInt(mmStr, 10) - 1; // JS months 0-based
      const firstOfMonth = new Date(yyyy, mm, 1);
      const firstOfNextMonth = new Date(yyyy, mm + 1, 1);
      startDate = firstOfMonth.toISOString();
      endDate = firstOfNextMonth.toISOString();
      console.log('📅 [CALENDAR EVENTS API] Month range:', { month, startDate, endDate });
    } else if (date) {
      // Day range: exact day
      const targetDate = new Date(date);
      startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).toISOString();
      endDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1).toISOString();
      console.log('📅 [CALENDAR EVENTS API] Day range:', { date, startDate, endDate });
    } else {
      // Generic range from provided params or default 30 days
      startDate = searchParams.get('startDate') || new Date().toISOString();
      endDate = searchParams.get('endDate') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      console.log('📅 [CALENDAR EVENTS API] Generic range:', { startDate, endDate });
    }

    if (eventType === 'availability') {
      console.log('📅 [CALENDAR EVENTS API] Fetching availability...');
      // For availability, get events and generate slots
      const adminEvents = await calendarService.getAdminEvents(startDate, endDate);
      console.log('📅 [CALENDAR EVENTS API] Admin events fetched:', {
        count: adminEvents.length,
        events: adminEvents.map(e => ({
          id: e.id,
          title: e.title,
          start: e.start,
          end: e.end
        }))
      });
      
      const bufferMinutesParam = searchParams.get('bufferMinutes');
      const settings = await calendarService.getSettings();
      const bufferMinutes = bufferMinutesParam ? parseInt(bufferMinutesParam, 10) : settings.bufferTimeMinutes;
      const dateOnly = date || startDate.split('T')[0];

      // Use the same availability logic as the dedicated availability endpoint
      // This will block the entire day if admin has any events on that date
      const slots = await calendarService.getAvailableSlots(dateOnly, bufferMinutes);

      return NextResponse.json({ events: adminEvents, slots });
    } else if (admin) {
      // For admin events
      console.log('📅 [CALENDAR EVENTS API] Fetching admin events...');
      events = await calendarService.getAdminEvents(startDate, endDate);
      console.log('📅 [CALENDAR EVENTS API] Admin events fetched:', {
        count: events.length,
        events: events.map(e => ({
          id: e.id,
          title: e.title,
          start: e.start,
          end: e.end,
          timestamp: new Date(e.start).toLocaleString()
        }))
      });
    } else {
      // Public events (anonymized)
      console.log('📅 [CALENDAR EVENTS API] Fetching public events...');
      events = await calendarService.getPublicEvents(startDate, endDate);
      console.log('📅 [CALENDAR EVENTS API] Public events fetched:', {
        count: events.length
      });
    }

    console.log('📅 [CALENDAR EVENTS API] Returning response:', {
      success: true,
      eventCount: events.length
    });

    return NextResponse.json({
      success: true,
      events
    });
  } catch (error) {
    console.error('❌ [CALENDAR EVENTS API] Error:', error);
    return NextResponse.json({
      error: 'Failed to fetch calendar events',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const calendarService = new EnhancedCalendarService();
    const event = await calendarService.createEvent(body);
    
    return NextResponse.json({
      success: true,
      event
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to create calendar event',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({ 
        error: 'Event ID is required' 
      }, { status: 400 });
    }
    
    const calendarService = new EnhancedCalendarService();
    const event = await calendarService.updateEvent(id, updateData);
    
    return NextResponse.json({
      success: true,
      event
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to update calendar event',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ 
        error: 'Event ID is required' 
      }, { status: 400 });
    }
    
    const calendarService = new EnhancedCalendarService();
    await calendarService.deleteEvent(id);
    
    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to delete calendar event',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
