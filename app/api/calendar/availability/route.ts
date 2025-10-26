import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { EnhancedCalendarService } from '@/lib/calendar/enhanced-calendar-service';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    
    const calendarService = new EnhancedCalendarService();
    const slots = await calendarService.getAvailableSlots(date);
    
    return NextResponse.json(slots);
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
  }
}
