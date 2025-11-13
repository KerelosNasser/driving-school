import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { EnhancedCalendarService } from '@/lib/calendar/enhanced-calendar-service';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/api/utils';

// Helper to map Clerk user ID -> Supabase users.id (UUID)
async function getOrCreateSupabaseUserId(clerkUserId: string): Promise<string> {
  // Try to find by clerk_id
  const { data: existingByClerk } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_id', clerkUserId)
    .maybeSingle();
  if (existingByClerk?.id) return existingByClerk.id as string;

  // Get Clerk user details
  const clerkUser = await clerkClient.users.getUser(clerkUserId);
  const email =
    clerkUser?.primaryEmailAddress?.emailAddress ||
    clerkUser?.emailAddresses?.[0]?.emailAddress ||
    '';
  const full_name =
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') ||
    clerkUser?.username ||
    'Unknown User';

  // Try link by email first
  if (email) {
    const { data: existingByEmail } = await supabaseAdmin
      .from('users')
      .select('id, clerk_id')
      .eq('email', email)
      .maybeSingle();
    if (existingByEmail?.id) {
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('users')
        .update({ clerk_id: clerkUserId, full_name })
        .eq('id', existingByEmail.id)
        .select('id')
        .single();
      if (updateError || !updated?.id) {
        throw new Error(`Failed to link existing user to Clerk: ${updateError?.message || 'unknown error'}`);
      }
      return updated.id as string;
    }
  }

  // Create new user row
  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('users')
    .insert({ clerk_id: clerkUserId, email, full_name })
    .select('id')
    .single();

  if (insertError || !inserted?.id) {
    const message = (insertError as any)?.message || '';
    const code = (insertError as any)?.code || '';
    if (code === '23505' && message.includes('users_email_key') && email) {
      const { data: after } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      if (after?.id) {
        const { data: updated, error: updateError2 } = await supabaseAdmin
          .from('users')
          .update({ clerk_id: clerkUserId, full_name })
          .eq('id', after.id)
          .select('id')
          .single();
        if (updateError2 || !updated?.id) {
          throw new Error(`Failed to finalize user provisioning after conflict: ${updateError2?.message || 'unknown error'}`);
        }
        return updated.id as string;
      }
    }
    throw new Error(`Failed to provision user in Supabase: ${insertError?.message || 'unknown error'}`);
  }

  return inserted.id as string;
}


export async function POST(request: NextRequest) {
  try {
    console.log('=== BOOKING API DEBUG ===');
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    
    const authResult = await auth();
    console.log('Auth result:', authResult);
    
    const { userId } = authResult;
    console.log('Extracted userId:', userId);
    
    if (!userId) {
      console.log('No userId found, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    // Support both legacy payload (date/time/lessonType) and new payload (start/end/title/description)
    let date: string | undefined = body.date;
    let time: string | undefined = body.time;
    let duration: number = body.duration ?? (body.lessonHours ? body.lessonHours * 60 : 60);
    let lessonType: string | undefined = body.lessonType;
    const location: string | undefined = body.location;
    let notes: string | undefined = body.notes ?? body.description;
    const studentName: string | undefined = body.studentName || 'Student';
    const studentEmail: string | undefined = body.studentEmail || '';

    // If start/end are provided, derive date/time/duration
    if (!date || !time) {
      if (body.start && body.end) {
        const startTime = new Date(body.start);
        const endTime = new Date(body.end);
        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
          return NextResponse.json(
            { error: 'Invalid start or end time provided' },
            { status: 400 }
          );
        }
        // Derive ISO date (yyyy-mm-dd) and HH:mm in local time
        const yyyy = startTime.getFullYear();
        const mm = String(startTime.getMonth() + 1).padStart(2, '0');
        const dd = String(startTime.getDate()).padStart(2, '0');
        date = `${yyyy}-${mm}-${dd}`;
        const hh = String(startTime.getHours()).padStart(2, '0');
        const min = String(startTime.getMinutes()).padStart(2, '0');
        time = `${hh}:${min}`;
        // Use provided lessonHours or compute from end-start
        duration = body.lessonHours ? body.lessonHours * 60 : Math.max(1, Math.round((endTime.getTime() - startTime.getTime()) / 60000));
        // Default lesson type if not provided
        lessonType = lessonType || 'Standard';
      }
    }

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

    // Precise conflict detection using free/busy with buffer
    const { bufferTimeMinutes } = await calendarService.getSettings();
    const isBusy = await calendarService.isAdminBusy(
      startDateTime.toISOString(),
      endDateTime.toISOString(),
      bufferTimeMinutes
    );
    if (isBusy) {
      return NextResponse.json(
        { error: 'Time slot is unavailable due to an admin calendar conflict' },
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

    // Resolve Supabase user ID (UUID) from Clerk user ID and validate quota
    const supabaseUserId = await getOrCreateSupabaseUserId(userId);
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Calculate hours used (duration in minutes -> hours)
    const hoursUsed = Math.ceil((duration || 60) / 60);

    // Pre-check quota before creating calendar events
    try {
      const { data: currentQuota, error: quotaError } = await supabase
        .from('user_quotas')
        .select('available_hours')
        .eq('user_id', supabaseUserId)
        .single();

      if (quotaError) {
        console.error('Error fetching current quota:', quotaError);
        return NextResponse.json({ error: 'Failed to check quota balance' }, { status: 500 });
      }

      if (!currentQuota || Number(currentQuota.available_hours) < hoursUsed) {
        return NextResponse.json({ 
          error: 'Insufficient quota balance',
          available_hours: currentQuota?.available_hours || 0,
          required_hours: hoursUsed
        }, { status: 400 });
      }
    } catch (quotaCheckError) {
      console.error('Quota pre-check error:', quotaCheckError);
      return NextResponse.json({ error: 'Failed to verify quota' }, { status: 500 });
    }

    // Create events in admin and user calendars
    const { adminEvent, userEvent } = await calendarService.createDualEvents(userId, {
      title: `Driving Lesson - ${lessonType}`,
      start: startDateTime.toISOString(),
      end: endDateTime.toISOString(),
      description: `Lesson Type: ${lessonType}\nNotes: ${notes || 'No additional notes'}`,
      location: location || 'TBD'
    });

    // Save booking to database
    const { data: booking, error: dbError } = await supabase
      .from('bookings')
      .insert({
        user_id: supabaseUserId,
        date: date,
        time: time,
        duration: duration,
        lesson_type: lessonType,
        location: location,
        notes: notes,
        status: 'confirmed',
        google_calendar_event_id: adminEvent.id,
        hours_used: hoursUsed
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

    // Consume quota using RPC function
    try {
      const { error: quotaConsumeError } = await supabase.rpc('update_user_quota', {
        p_user_id: supabaseUserId,
        p_hours_change: -hoursUsed,
        p_transaction_type: 'booking',
        p_description: `Booked ${hoursUsed} hour lesson${lessonType ? ` (${lessonType})` : ''}`,
        p_package_id: null,
        p_payment_id: null,
        p_booking_id: booking.id
      });

      if (quotaConsumeError) {
        console.error('Error consuming quota after booking:', quotaConsumeError);
        // Roll back calendar event and mark booking cancelled to maintain consistency
        try {
          await calendarService.cancelBooking(adminEvent.id);
          if (userEvent) {
            await calendarService.cancelBooking(userEvent.id);
          }
        } catch (cleanupError) {
          console.error('Failed to cleanup calendar events after quota error:', cleanupError);
        }
        await supabase
          .from('bookings')
          .update({ status: 'cancelled', notes: `${notes ? notes + '\n' : ''}Quota consumption failed: ${quotaConsumeError.message}` })
          .eq('id', booking.id);

        // If insufficient quota, report 400; otherwise 500
        if (quotaConsumeError.message?.includes('Insufficient quota hours')) {
          return NextResponse.json({ 
            error: 'Insufficient quota balance',
            details: quotaConsumeError.message 
          }, { status: 400 });
        }
        return NextResponse.json({ 
          error: 'Failed to consume quota for booking',
          details: quotaConsumeError.message 
        }, { status: 500 });
      }
    } catch (rpcError: any) {
      console.error('RPC error consuming quota:', rpcError);
      // Non-specific error: cancel booking to prevent inconsistency
      try {
        await calendarService.cancelBooking(adminEvent.id);
        if (userEvent) {
          await calendarService.cancelBooking(userEvent.id);
        }
      } catch (cleanupError) {
        console.error('Failed to cleanup calendar events after RPC error:', cleanupError);
      }
      await supabase
        .from('bookings')
        .update({ status: 'cancelled', notes: `${notes ? notes + '\n' : ''}Quota consumption RPC failed: ${rpcError?.message || 'Unknown error'}` })
        .eq('id', booking.id);
      return NextResponse.json({ error: 'Failed to consume quota for booking' }, { status: 500 });
    }

    // Get updated quota and user details for email
    const { data: updatedQuota } = await supabase
      .from('user_quotas')
      .select('available_hours')
      .eq('user_id', supabaseUserId)
      .single();

    const { data: userData } = await supabase
      .from('users')
      .select('email, full_name, phone, address, suburb, experience_level')
      .eq('id', supabaseUserId)
      .single();

    // Send confirmation emails
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-booking-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'confirmation',
          userName: userData?.full_name || studentName,
          userEmail: userData?.email || studentEmail,
          userPhone: userData?.phone,
          date: date,
          time: time,
          duration: duration,
          lessonType: lessonType,
          location: location,
          notes: notes,
          hoursConsumed: hoursUsed,
          remainingHours: updatedQuota?.available_hours || 0,
          bookingId: booking.id,
          experienceLevel: userData?.experience_level,
          address: userData?.address,
          suburb: userData?.suburb
        })
      });
    } catch (emailError) {
      console.error('Failed to send confirmation emails:', emailError);
      // Don't fail the booking if email fails
    }

    return NextResponse.json({
      success: true,
      booking: booking,
      adminEvent: adminEvent,
      userEvent: userEvent,
      consumed_hours: hoursUsed,
      remaining_hours: updatedQuota?.available_hours || 0,
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
