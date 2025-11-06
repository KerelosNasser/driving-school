import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { BookingConfirmationEmail } from '@/components/emails/BookingConfirmationEmail';
import { AdminBookingNotificationEmail } from '@/components/emails/AdminBookingNotificationEmail';
import { BookingCancellationEmail } from '@/components/emails/BookingCancellationEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body;

    if (type === 'confirmation') {
      // Send booking confirmation to user and notification to admin
      const {
        userName,
        userEmail,
        userPhone,
        date,
        time,
        duration,
        lessonType,
        location,
        notes,
        hoursConsumed,
        remainingHours,
        bookingId,
        experienceLevel,
        address,
        suburb
      } = body;

      if (!userEmail || !userName || !date || !time) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      // Send confirmation email to user
      const userEmailHtml = render(
        BookingConfirmationEmail({
          userName,
          userEmail,
          date,
          time,
          duration: duration || 60,
          lessonType: lessonType || 'Standard',
          location,
          notes,
          hoursConsumed: hoursConsumed || 1,
          remainingHours: remainingHours || 0,
          bookingId
        })
      );

      const { error: userEmailError } = await resend.emails.send({
        from: 'EG Driving School <noreply@egdrivingschool.com>',
        to: [userEmail],
        subject: '🎉 Booking Confirmed - EG Driving School',
        html: userEmailHtml,
      });

      if (userEmailError) {
        console.error('Failed to send user confirmation email:', userEmailError);
      }

      // Send notification email to admin
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'emealghobrial@gmail.com';
      const adminEmailHtml = render(
        AdminBookingNotificationEmail({
          userName,
          userEmail,
          userPhone,
          date,
          time,
          duration: duration || 60,
          lessonType: lessonType || 'Standard',
          location,
          notes,
          hoursConsumed: hoursConsumed || 1,
          bookingId,
          experienceLevel,
          address,
          suburb
        })
      );

      const { error: adminEmailError } = await resend.emails.send({
        from: 'EG Driving School <noreply@egdrivingschool.com>',
        to: [adminEmail],
        subject: `📋 New Booking: ${userName} - ${new Date(date).toLocaleDateString('en-AU')}`,
        html: adminEmailHtml,
      });

      if (adminEmailError) {
        console.error('Failed to send admin notification email:', adminEmailError);
      }

      return NextResponse.json({ 
        success: true, 
        userEmailSent: !userEmailError,
        adminEmailSent: !adminEmailError
      });

    } else if (type === 'cancellation') {
      // Send cancellation email to user
      const {
        userName,
        userEmail,
        date,
        time,
        lessonType,
        hoursRefunded,
        newBalance,
        cancellationReason,
        bookingId
      } = body;

      if (!userEmail || !userName || !date || !time || !cancellationReason) {
        return NextResponse.json(
          { error: 'Missing required fields for cancellation email' },
          { status: 400 }
        );
      }

      const emailHtml = render(
        BookingCancellationEmail({
          userName,
          date,
          time,
          lessonType: lessonType || 'Standard',
          hoursRefunded: hoursRefunded || 0,
          newBalance: newBalance || 0,
          cancellationReason,
          bookingId
        })
      );

      const { error } = await resend.emails.send({
        from: 'EG Driving School <noreply@egdrivingschool.com>',
        to: [userEmail],
        subject: 'Booking Cancelled - EG Driving School',
        html: emailHtml,
      });

      if (error) {
        console.error('Resend error:', error);
        return NextResponse.json(
          { error: 'Failed to send cancellation email' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });

    } else {
      return NextResponse.json(
        { error: 'Invalid email type' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}