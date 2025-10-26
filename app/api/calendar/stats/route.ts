import { NextRequest, NextResponse } from 'next/server';
import { EnhancedCalendarService } from '@/lib/calendar/enhanced-calendar-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || new Date().toISOString();
    const endDate = searchParams.get('endDate') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const calendarService = new EnhancedCalendarService();
    const stats = await calendarService.getBookingStats(startDate, endDate);
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching booking stats:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch booking statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
