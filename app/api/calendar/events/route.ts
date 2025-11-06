import { NextRequest, NextResponse } from 'next/server';
import { EnhancedCalendarService } from '@/lib/calendar/enhanced-calendar-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const admin = searchParams.get('admin') === 'true';
    const eventType = searchParams.get('eventType') ?? 'events';

    const calendarService = new EnhancedCalendarService();

    let events: any[];
    let startDate: string;
    let endDate: string;

    if (date) {
      // If date is provided, set start and end to the start and end of that day
      const targetDate = new Date(date);
      startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).toISOString();
      endDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1).toISOString();
    } else {
      // Fallback to original logic
      startDate = searchParams.get('startDate') || new Date().toISOString();
      endDate = searchParams.get('endDate') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    if (eventType === 'availability') {
      // For availability, get events and generate slots
      const adminEvents = await calendarService.getAdminEvents(startDate, endDate);
      const bufferMinutesParam = searchParams.get('bufferMinutes');
      const bufferMinutes = bufferMinutesParam ? parseInt(bufferMinutesParam, 10) : 15;
      const dateOnly = date || startDate.split('T')[0];

      // Use the same availability logic as the dedicated availability endpoint
      // This will block the entire day if admin has any events on that date
      const slots = await calendarService.getAvailableSlots(dateOnly, bufferMinutes);

      return NextResponse.json({ events: adminEvents, slots });
    } else if (admin) {
      // For admin events
      events = await calendarService.getAdminEvents(startDate, endDate);
    } else {
      // Regular events
      events = await calendarService.getEvents(startDate, endDate);
    }

    return NextResponse.json({
      success: true,
      events
    });
  } catch (error) {
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
