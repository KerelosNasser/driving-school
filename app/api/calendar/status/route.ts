import { NextRequest, NextResponse } from 'next/server';
import { EnhancedCalendarService } from '@/lib/calendar/enhanced-calendar-service';

export async function GET(_request: NextRequest) {
  try {
    const calendarService = new EnhancedCalendarService();
    const status = await calendarService.getCalendarStatus();
    
    return NextResponse.json(status);
  } catch (error) {
    console.error('Error fetching calendar status:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch calendar status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
