import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { EnhancedCalendarService } from '@/lib/calendar/enhanced-calendar-service';
import { createClient } from '@supabase/supabase-js';


export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { date, time, duration = 60, lessonType, location, notes, studentName, studentEmail } = body;

    if (!date || !time || !lessonType) {
      return NextResponse.json(
        { error: 'Date, time, and lesson type are required' },
        { status: 400 }
      );
    }

    // Parse the date and time
    const bookingDate = new Date(date);
    const [hours, minutes] = time.split(':').map(Number);
    
    const startDateTime = new Date(bookingDate);
    startDateTime.setHours(hours, minutes, 0, 0);
    
    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + duration);

    const calendarService = new EnhancedCalendarService();

    // Check for conflicts with admin calendar
    const adminEvents = await calendarService.getAdminEvents(
      startDateTime.toISOString(),
      endDateTime.toISOString()
    );

    const hasConflict = adminEvents.some(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      return startDateTime < eventEnd && endDateTime > eventStart;
    });

    if (hasConflict) {
      return NextResponse.json(
        { error: 'Time slot is no longer available due to a scheduling conflict' },
        { status: 409 }
      );
    }

    // Create the booking request
    const bookingRequest = {
      date: date,
      time: time,
      duration: duration,
      studentName: studentName || 'Student',
      studentEmail: studentEmail || '',
      lessonType: lessonType,
      notes: notes || ''
    };

    // Create booking in admin calendar
    const adminEvent = await calendarService.createBooking(bookingRequest);

    // Also create event in user's calendar if they have Google Calendar connected
    let userEvent = null;
    try {
      userEvent = await calendarService.createEvent({
        title: `Driving Lesson - ${lessonType}`,
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        description: `Lesson Type: ${lessonType}\nNotes: ${notes || 'No additional notes'}`,
        location: location || 'TBD'
      });
    } catch (userEventError) {
      console.warn('Could not create event in user calendar:', userEventError);
      // Continue even if user event creation fails
    }

    // Save booking to database
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: booking, error: dbError } = await supabase
      .from('bookings')
      .insert({
        user_id: userId,
        date: date,
        time: time,
        duration: duration,
        lesson_type: lessonType,
        location: location,
        notes: notes,
        status: 'confirmed',
        google_calendar_event_id: adminEvent.id,
        user_calendar_event_id: userEvent?.id || null
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Try to clean up the calendar events if database save fails
      try {
        await calendarService.cancelBooking(adminEvent.id);
        if (userEvent) {
          await calendarService.cancelBooking(userEvent.id);
        }
      } catch (cleanupError) {
        console.error('Failed to cleanup calendar events:', cleanupError);
      }
      
      return NextResponse.json(
        { error: 'Failed to save booking to database' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: booking,
      adminEvent: adminEvent,
      userEvent: userEvent,
      message: 'Booking created successfully'
    });

  } catch (error: any) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create booking', 
        details: error.message,
        type: error.constructor.name
      },
      { status: 500 }
    );
  }
}
