import * as React from 'react';

interface BookingConfirmationEmailProps {
  userName: string;
  userEmail: string;
  date: string;
  time: string;
  duration: number;
  lessonType: string;
  location?: string;
  notes?: string;
  hoursConsumed: number;
  remainingHours: number;
  bookingId: string;
}

export const BookingConfirmationEmail = ({
  userName,
  userEmail,
  date,
  time,
  duration,
  lessonType,
  location,
  notes,
  hoursConsumed,
  remainingHours,
  bookingId
}: BookingConfirmationEmailProps) => {
  const formattedDate = new Date(date).toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: 'Arial, sans-serif', backgroundColor: '#f3f4f6' }}>
        <table width="100%" cellPadding="0" cellSpacing="0" style={{ backgroundColor: '#f3f4f6', padding: '40px 20px' }}>
          <tr>
            <td align="center">
              <table width="600" cellPadding="0" cellSpacing="0" style={{ backgroundColor: '#ffffff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
                
                {/* Header */}
                <tr>
                  <td style={{ background: 'linear-gradient(135deg, #059669 0%, #14b8a6 100%)', padding: '40px 30px', textAlign: 'center' }}>
                    <h1 style={{ margin: 0, color: '#ffffff', fontSize: '28px', fontWeight: 'bold' }}>
                      🎉 Booking Confirmed!
                    </h1>
                    <p style={{ margin: '10px 0 0 0', color: '#d1fae5', fontSize: '16px' }}>
                      Your driving lesson is all set
                    </p>
                  </td>
                </tr>

                {/* Main Content */}
                <tr>
                  <td style={{ padding: '40px 30px' }}>
                    <p style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#374151', lineHeight: '1.6' }}>
                      Hi <strong>{userName}</strong>,
                    </p>
                    
                    <p style={{ margin: '0 0 30px 0', fontSize: '16px', color: '#374151', lineHeight: '1.6' }}>
                      Great news! Your driving lesson has been successfully booked. We're excited to help you on your journey to becoming a confident driver! 🚗
                    </p>

                    {/* Booking Details Card */}
                    <table width="100%" cellPadding="0" cellSpacing="0" style={{ backgroundColor: '#f9fafb', borderRadius: '8px', border: '2px solid #059669', marginBottom: '30px' }}>
                      <tr>
                        <td style={{ padding: '25px' }}>
                          <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#059669', fontWeight: 'bold' }}>
                            📅 Lesson Details
                          </h2>
                          
                          <table width="100%" cellPadding="8" cellSpacing="0">
                            <tr>
                              <td style={{ fontSize: '14px', color: '#6b7280', width: '40%' }}>Date:</td>
                              <td style={{ fontSize: '14px', color: '#111827', fontWeight: '600' }}>{formattedDate}</td>
                            </tr>
                            <tr>
                              <td style={{ fontSize: '14px', color: '#6b7280' }}>Time:</td>
                              <td style={{ fontSize: '14px', color: '#111827', fontWeight: '600' }}>{time}</td>
                            </tr>
                            <tr>
                              <td style={{ fontSize: '14px', color: '#6b7280' }}>Duration:</td>
                              <td style={{ fontSize: '14px', color: '#111827', fontWeight: '600' }}>{duration} minutes</td>
                            </tr>
                            <tr>
                              <td style={{ fontSize: '14px', color: '#6b7280' }}>Lesson Type:</td>
                              <td style={{ fontSize: '14px', color: '#111827', fontWeight: '600' }}>{lessonType}</td>
                            </tr>
                            {location && (
                              <tr>
                                <td style={{ fontSize: '14px', color: '#6b7280' }}>Location:</td>
                                <td style={{ fontSize: '14px', color: '#111827', fontWeight: '600' }}>{location}</td>
                              </tr>
                            )}
                            {notes && (
                              <tr>
                                <td style={{ fontSize: '14px', color: '#6b7280', verticalAlign: 'top' }}>Notes:</td>
                                <td style={{ fontSize: '14px', color: '#111827' }}>{notes}</td>
                              </tr>
                            )}
                          </table>
                        </td>
                      </tr>
                    </table>

                    {/* Hours Summary */}
                    <table width="100%" cellPadding="0" cellSpacing="0" style={{ backgroundColor: '#fef3c7', borderRadius: '8px', marginBottom: '30px' }}>
                      <tr>
                        <td style={{ padding: '20px' }}>
                          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#92400e', fontWeight: 'bold' }}>
                            ⏱️ Hours Update
                          </h3>
                          <table width="100%" cellPadding="5" cellSpacing="0">
                            <tr>
                              <td style={{ fontSize: '14px', color: '#78350f' }}>Hours Consumed:</td>
                              <td style={{ fontSize: '14px', color: '#78350f', fontWeight: '600', textAlign: 'right' }}>{hoursConsumed} hours</td>
                            </tr>
                            <tr>
                              <td style={{ fontSize: '14px', color: '#78350f' }}>Remaining Balance:</td>
                              <td style={{ fontSize: '14px', color: '#78350f', fontWeight: '600', textAlign: 'right' }}>{remainingHours} hours</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    {/* Important Reminders */}
                    <table width="100%" cellPadding="0" cellSpacing="0" style={{ backgroundColor: '#dbeafe', borderRadius: '8px', marginBottom: '30px' }}>
                      <tr>
                        <td style={{ padding: '20px' }}>
                          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#1e40af', fontWeight: 'bold' }}>
                            📌 Important Reminders
                          </h3>
                          <ul style={{ margin: 0, paddingLeft: '20px', color: '#1e3a8a', fontSize: '14px', lineHeight: '1.8' }}>
                            <li>Please arrive <strong>10 minutes early</strong> for your lesson</li>
                            <li>Bring your <strong>learner's permit</strong> and any required documents</li>
                            <li>Wear comfortable clothing and closed-toe shoes</li>
                            <li>If you need to reschedule, please contact us at least <strong>24 hours in advance</strong></li>
                          </ul>
                        </td>
                      </tr>
                    </table>

                    {/* CTA Button */}
                    <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '30px' }}>
                      <tr>
                        <td align="center">
                          <a href={`${process.env.NEXT_PUBLIC_APP_URL}/service-center`} style={{ display: 'inline-block', padding: '14px 32px', backgroundColor: '#059669', color: '#ffffff', textDecoration: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold' }}>
                            View My Dashboard
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#6b7280', lineHeight: '1.6' }}>
                      You're making the right choice by investing in your driving skills. We're here to support you every step of the way!
                    </p>
                    
                    <p style={{ margin: '0', fontSize: '14px', color: '#6b7280', lineHeight: '1.6' }}>
                      If you have any questions, feel free to reach out to us anytime.
                    </p>
                  </td>
                </tr>

                {/* Footer */}
                <tr>
                  <td style={{ backgroundColor: '#f9fafb', padding: '30px', borderTop: '1px solid #e5e7eb' }}>
                    <table width="100%" cellPadding="0" cellSpacing="0">
                      <tr>
                        <td style={{ textAlign: 'center', paddingBottom: '15px' }}>
                          <p style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#111827', fontWeight: 'bold' }}>
                            EG Driving School
                          </p>
                          <p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>
                            📞 0431 512 095 | 📧 {process.env.NEXT_PUBLIC_ADMIN_EMAIL}
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ textAlign: 'center', paddingTop: '15px', borderTop: '1px solid #e5e7eb' }}>
                          <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
                            © 2025 EG Driving School. All rights reserved.
                          </p>
                          <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>
                            Booking ID: {bookingId}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  );
};
