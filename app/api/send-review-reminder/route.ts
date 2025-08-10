import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { userEmail, userName, bookingId } = await request.json();

    if (!userEmail || !userName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: 'Brisbane Driving School <noreply@brisbanedrivingschool.com>',
      to: [userEmail],
      subject: 'How was your driving lesson? Leave us a review!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #eab308;">Thank you for choosing Brisbane Driving School!</h2>
          <p>Hi ${userName},</p>
          <p>We hope you had a great experience with your recent driving lesson. Your feedback is incredibly valuable to us and helps other students make informed decisions.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/reviews?booking=${bookingId}" 
               style="background: #eab308; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              Leave a Review
            </a>
          </div>
          
          <p>It only takes a minute and would mean the world to us!</p>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Why leave a review?</h3>
            <ul>
              <li>Help other students find quality driving instruction</li>
              <li>Share your success story</li>
              <li>Help us improve our services</li>
            </ul>
          </div>
          
          <p>Thank you for being part of the Brisbane Driving School family!</p>
          
          <p>Best regards,<br>
          The Brisbane Driving School Team</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #6b7280;">
            📧 Email: info@brisbanedrivingschool.com<br>
            📱 Phone: (07) 1234 5678
          </p>
        </div>
      `
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
    console.error('Review reminder API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}