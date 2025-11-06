import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/api/utils';
import { EnhancedCalendarService } from '@/lib/calendar/enhanced-calendar-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    const { data: adminUser } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('clerk_id', userId)
      .single();

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const bookingId = params.id;
    const body = await request.json();
    const { cancellationReason } = body;

    if (!cancellationReason || cancellationReason.trim().length < 10) {
      return NextResponse.json(
        { error: 'Cancellation reason must be at least 10 characters' },
        { status: 400 }
      );
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        users!inner(id, email, full_name, clerk_id)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    if (booking.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Booking is already cancelled' },
        { status: 400 }
      );
    }

    // Cancel the Google Calendar event
    if (booking.google_calendar_event_id) {
      try {
        const calendarService = new EnhancedCalendarService();
        await calendarService.cancelBooking(booking.google_calendar_event_id);
      } catch (calendarError) {
        console.error('Failed to cancel calendar event:', calendarError);
        // Continue with cancellation even if calendar deletion fails
      }
    }

    // Update booking status
    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({
        status: 'cancelled',
        notes: `${booking.notes ? booking.notes + '\n\n' : ''}CANCELLED BY ADMIN\nReason: ${cancellationReason}`
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Failed to update booking:', updateError);
      return NextResponse.json(
        { error: 'Failed to cancel booking' },
        { status: 500 }
      );
    }

    // Refund hours to user
    const hoursToRefund = booking.hours_used || 1;
    
    try {
      const { error: refundError } = await supabaseAdmin.rpc('update_user_quota', {
        p_user_id: booking.user_id,
        p_hours_change: hoursToRefund,
        p_transaction_type: 'refund',
        p_description: `Refund for cancelled lesson (Admin cancelled)`,
        p_package_id: null,
        p_payment_id: null,
        p_booking_id: bookingId
      });

      if (refundError) {
        console.error('Failed to refund hours:', refundError);
        // Log but don't fail the cancellation
      }
    } catch (refundError) {
      console.error('Error refunding hours:', refundError);
    }

    // Get updated quota
    const { data: updatedQuota } = await supabaseAdmin
      .from('user_quotas')
      .select('available_hours')
      .eq('user_id', booking.user_id)
      .single();

    // Send cancellation email to user
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-booking-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'cancellation',
          userName: booking.users.full_name,
          userEmail: booking.users.email,
          date: booking.date,
          time: booking.time,
          lessonType: booking.lesson_type,
          hoursRefunded: hoursToRefund,
          newBalance: updatedQuota?.available_hours || 0,
          cancellationReason: cancellationReason,
          bookingId: bookingId
        })
      });
    } catch (emailError) {
      console.error('Failed to send cancellation email:', emailError);
      // Don't fail the cancellation if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
      hoursRefunded: hoursToRefund,
      newBalance: updatedQuota?.available_hours || 0
    });

  } catch (error: any) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json(
      { 
        error: 'Failed to cancel booking', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}
