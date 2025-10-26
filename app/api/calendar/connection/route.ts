import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { EnhancedCalendarService } from '@/lib/calendar/enhanced-calendar-service';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const calendarService = new EnhancedCalendarService();
    const status = await calendarService.getCalendarStatus();

    return NextResponse.json({
      connected: status.connected,
      status: status.connected ? 'connected' : 'disconnected',
      message: status.message,
      calendar: status.calendar
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to check connection' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ 
      success: true,
      message: 'Calendar disconnected successfully'
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to disconnect calendar' }, { status: 500 });
  }
}
