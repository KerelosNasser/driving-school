import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailRequest {
  bookingId: string;
  userEmail: string;
  userName: string;
  status: string;
  date: string;
  time: string;
  packageName?: string;
}

function getEmailContent(status: string, userName: string, date: string, time: string, packageName?: string) {
  const statusMessages = {
    confirmed: {
      subject: 'Booking Confirmed - Brisbane Driving School',
      message: `Great news! Your driving lesson has been confirmed.`,
      color: '#10b981'
    },
    rejected: {
      subject: 'Booking Update - Brisbane Driving School', 
      message: `We're sorry, but your booking request could not be confirmed at this time.`,
      color: '#ef4444'
    },
    cancelled: {
      subject: 'Booking Cancelled - Brisbane Driving School',
      message: `Your driving lesson has been cancelled.`,
      color: '#f59e0b'
    },
    completed: {
      subject: 'Lesson Completed - Brisbane Driving School',
      message: `Thank you for completing your driving lesson!`,
      color: '#8b5cf6'
    }
  };

  const config = statusMessages[status as keyof typeof statusMessages] || statusMessages.confirmed;

  return {
    subject: config.subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${config.color}; color: white; padding: 20px; text-align: center;">
          <h1>Brisbane Driving School</h1>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9;">
          <h2>Hello ${userName},</h2>
          <p style="font-size: 16px; line-height: 1.5;">${config.message}</p>
          
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Booking Details:</h3>
            <p><strong>Date:</strong> ${new Date(date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${time}</p>
            ${packageName ? `<p><strong>Package:</strong> ${packageName}</p>` : ''}
            <p><strong>Status:</strong> <span style="color: ${config.color}; font-weight: bold;">${status.toUpperCase()}</span></p>
          </div>
          
          ${status === 'confirmed' ? `
            <p>Please arrive 10 minutes early for your lesson. If you need to reschedule, please contact us at least 24 hours in advance.</p>
          ` : ''}
          
          <p>If you have any questions, please don't hesitate to contact us:</p>
          <p>📞 Phone: 0400 000 000<br>
          📧 Email: info@brisbanedrivingschool.com</p>
        </div>
        <div style="background-color: #333; color: white; padding: 10px; text-align: center; font-size: 12px;">
          <p>&copy; 2025 Brisbane Driving School. All rights reserved.</p>
        </div>
      </div>
    `
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: EmailRequest = await request.json();
    const { userEmail, userName, status, date, time, packageName } = body;

    if (!userEmail || !userName || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const emailContent = getEmailContent(status, userName, date, time, packageName);

    const { data, error } = await resend.emails.send({
      from: 'EG Driving School <noreply@egdrivingschool.com>',
      to: [userEmail],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}