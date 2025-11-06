import * as React from 'react';

interface BookingCancellationEmailProps {
  userName: string;
  date: string;
  time: string;
  lessonType: string;
  hoursRefunded: number;
  newBalance: number;
  cancellationReason: string;
  bookingId: string;
}

export const BookingCancellationEmail = ({
  userName,
  date,
  time,
  lessonType,
  hoursRefunded,
  newBalance,
  cancellationReason,
  bookingId
}: BookingCancellationEmailProps) => {
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
                  <td style={{ background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)', padding: '40px 30px', textAlign: 'center' }}>
                    <h1 style={{ margin: 0, color: '#ffffff', fontSize: '28px', fontWeight: 'bold' }}>
                      Booking Cancelled
                    </h1>
                    <p style={{ margin: '10px 0 0 0', color: '#fecaca', fontSize: '16px' }}>
                      Your lesson has been cancelled
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
                      We're writing to inform you that your driving lesson has been cancelled by the instructor.
                    </p>

                    {/* Cancelled Lesson Details */}
                    <table width="100%" cellPadding="0" cellSpacing="0" style={{ backgroundColor: '#fef2f2', borderRadius: '8px', border: '2px solid #dc2626', marginBottom: '25px' }}>
                      <tr>
                        <td style={{ padding: '25px' }}>
                          <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#dc2626', fontWeight: 'bold' }}>
                            📅 Cancelled Lesson
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
                              <td style={{ fontSize: '14px', color: '#6b7280' }}>Lesson Type:</td>
                              <td style={{ fontSize: '14px', color: '#111827', fontWeight: '600' }}>{lessonType}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    {/* Cancellation Reason */}
                    <table width="100%" cellPadding="0" cellSpacing="0" style={{ backgroundColor: '#fffbeb', borderRadius: '8px', marginBottom: '25px' }}>
                      <tr>
                        <td style={{ padding: '20px' }}>
                          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#92400e', fontWeight: 'bold' }}>
                            📝 Reason for Cancellation
                          </h3>
                          <p style={{ margin: 0, fontSize: '14px', color: '#78350f', lineHeight: '1.6' }}>
                            {cancellationReason}
                          </p>
                        </td>
                      </tr>
                    </table>

                    {/* Hours Refund */}
                    <table width="100%" cellPadding="0" cellSpacing="0" style={{ backgroundColor: '#d1fae5', borderRadius: '8px', marginBottom: '30px' }}>
                      <tr>
                        <td style={{ padding: '20px' }}>
                          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#065f46', fontWeight: 'bold' }}>
                            ✅ Hours Refunded
                          </h3>
                          <table width="100%" cellPadding="5" cellSpacing="0">
                            <tr>
                              <td style={{ fontSize: '14px', color: '#064e3b' }}>Hours Refunded:</td>
                              <td style={{ fontSize: '14px', color: '#064e3b', fontWeight: '600', textAlign: 'right' }}>+{hoursRefunded} hours</td>
                            </tr>
                            <tr>
                              <td style={{ fontSize: '14px', color: '#064e3b' }}>New Balance:</td>
                              <td style={{ fontSize: '14px', color: '#064e3b', fontWeight: '600', textAlign: 'right' }}>{newBalance} hours</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <p style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#374151', lineHeight: '1.6' }}>
                      Don't worry! Your hours have been fully refunded to your account. You can book a new lesson at your convenience.
                    </p>

                    {/* CTA Button */}
                    <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '30px' }}>
                      <tr>
                        <td align="center">
                          <a href={`${process.env.NEXT_PUBLIC_APP_URL}/service-center`} style={{ display: 'inline-block', padding: '14px 32px', backgroundColor: '#059669', color: '#ffffff', textDecoration: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold' }}>
                            Book Another Lesson
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style={{ margin: '0', fontSize: '14px', color: '#6b7280', lineHeight: '1.6' }}>
                      We apologize for any inconvenience. If you have any questions or concerns, please don't hesitate to contact us.
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
