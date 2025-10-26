import { NextRequest, NextResponse } from 'next/server';
import { EnhancedCalendarService } from '@/lib/calendar/enhanced-calendar-service';

export async function POST(_request: NextRequest) {
  try {
    const calendarService = new EnhancedCalendarService();
    const result = await calendarService.syncCalendar();
    
    return NextResponse.json({
      success: true,
      message: 'Calendar sync completed',
      result
    });
  } catch (error) {
    console.error('Error syncing calendar:', error);
    return NextResponse.json({ 
      error: 'Failed to sync calendar',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || new Date().toISOString();
    const endDate = searchParams.get('endDate') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const calendarService = new EnhancedCalendarService();
    const events = await calendarService.getEvents(startDate, endDate);
    
    return NextResponse.json({
      success: true,
      events
    });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch calendar events',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
