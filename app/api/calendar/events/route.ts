import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { SimpleCalendarService } from '@/lib/calendar/simple-calendar';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    
    const events = await SimpleCalendarService.getEvents(date);
    return NextResponse.json({ events });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, start, end, description, location } = body;
    
    if (!title || !start || !end) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const event = await SimpleCalendarService.createEvent({
      title,
      start,
      end,
      description,
      location,
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
