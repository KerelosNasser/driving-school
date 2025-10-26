import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { EnhancedCalendarService } from '@/lib/calendar/enhanced-calendar-service';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { eventId, reason } = body;

    if (!eventId) {
      return NextResponse.json({ 
        error: 'Event ID is required' 
      }, { status: 400 });
    }

    const calendarService = new EnhancedCalendarService();
    const result = await calendarService.cancelBooking(eventId, reason);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error canceling booking:', error);
    return NextResponse.json({ 
      error: 'Failed to cancel booking',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}