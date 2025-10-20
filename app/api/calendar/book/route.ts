import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { SimpleCalendarService } from '@/lib/calendar/simple-calendar';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { date, time, duration = 60, title = 'Driving Lesson', description, location } = body;
    
    if (!date || !time) {
      return NextResponse.json({ error: 'Date and time are required' }, { status: 400 });
    }

    // Create start and end times
    const startDateTime = new Date(`${date}T${time}:00`);
    const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

    const event = await SimpleCalendarService.createEvent({
      title,
      start: startDateTime.toISOString(),
      end: endDateTime.toISOString(),
      description,
      location,
    });

    return NextResponse.json({ 
      success: true, 
      booking: event 
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}
