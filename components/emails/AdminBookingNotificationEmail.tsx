import * as React from 'react';

interface AdminBookingNotificationEmailProps {
  userName: string;
  userEmail: string;
  userPhone?: string;
  date: string;
  time: string;
  duration: number;
  lessonType: string;
  location?: string;
  notes?: string;
  hoursConsumed: number;
  bookingId: string;
  experienceLevel?: string;
  address?: string;
  suburb?: string;
}

export const AdminBookingNotificationEmail = ({
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
  bookingId,
  experienceLevel,
  address,
  suburb
}: AdminBookingNotificationEmailProps) => {
  const formattedDate = new Date(date).toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/bookings/${bookingId}/cancel`;

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
                  <td style={{ background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', padding: '40px 30px', textAlign: 'center' }}>
                    <h1 style={{ margin: 0, color: '#ffffff', fontSize: '28px', fontWeight: 'bold' }}>
                      📋 New Booking Alert
                    </h1>
                    <p style={{ margin: '10px 0 0 0', color: '#dbeafe', fontSize: '16px' }}>
                      A new lesson has been booked
                    </p>
                  </td>
                </tr>

                {/* Main Content */}
                <tr>
                  <td style={{ padding: '40px 30px' }}>
                    
                    {/* Student Information */}
                    <table width="100%" cellPadding="0" cellSpacing="0" style={{ backgroundColor: '#f0f9ff', borderRadius: '8px', border: '2px solid #3b82f6', marginBottom: '25px' }}>
                      <tr>
                        <td style={{ padding: '25px' }}>
                          <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#1e40af', fontWeight: 'bold' }}>
                            👤 Student Information
                          </h2>
                          
                          <table width="100%" cellPadding="8" cellSpacing="0">
                            <tr>
                              <td style={{ fontSize: '14px', color: '#6b7280', width: '40%' }}>Name:</td>
                              <td style={{ fontSize: '14px', color: '#111827', fontWeight: '600' }}>{userName}</td>
                            </tr>
                            <tr>
                              <td style={{ fontSize: '14px', color: '#6b7280' }}>Email:</td>
                              <td style={{ fontSize: '14px', color: '#111827', fontWeight: '600' }}>
                                <a href={`mailto:${userEmail}`} style={{ color: '#2563eb', textDecoration: 'none' }}>{userEmail}</a>
                              </td>
                            </tr>
                            {userPhone && (
                              <tr>
                                <td style={{ fontSize: '14px', color: '#6b7280' }}>Phone:</td>
                                <td style={{ fontSize: '14px', color: '#111827', fontWeight: '600' }}>
                                  <a href={`tel:${userPhone}`} style={{ color: '#2563eb', textDecoration: 'none' }}>{userPhone}</a>
                                </td>
                              </tr>
                            )}
                            {experienceLevel && (
                              <tr>
                                <td style={{ fontSize: '14px', color: '#6b7280' }}>Experience:</td>
                                <td style={{ fontSize: '14px', color: '#111827', fontWeight: '600' }}>{experienceLevel}</td>
                              </tr>
                            )}
                            {address && (
                              <tr>
                                <td style={{ fontSize: '14px', color: '#6b7280', verticalAlign: 'top' }}>Address:</td>
                                <td style={{ fontSize: '14px', color: '#111827', fontWeight: '600' }}>
                                  {address}{suburb ? `, ${suburb}` : ''}
                                </td>
                              </tr>
                            )}
                          </table>
                        </td>
                      </tr>
                    </table>

                    {/* Lesson Details */}
                    <table width="100%" cellPadding="0" cellSpacing="0" style={{ backgroundColor: '#f0fdf4', borderRadius: '8px', border: '2px solid #059669', marginBottom: '25px' }}>
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
                              <td style={{ fontSize: '14px', color: '#111827', fontWeight: '600' }}>{duration} minutes ({hoursConsumed} hours)</td>
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

                    {/* Action Buttons */}
                    <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '25px' }}>
                      <tr>
                        <td align="center">
                          <table cellPadding="0" cellSpacing="0">
                            <tr>
                              <td style={{ paddingRight: '10px' }}>
                                <a href={`${process.env.NEXT_PUBLIC_APP_URL}/admin`} style={{ display: 'inline-block', padding: '12px 24px', backgroundColor: '#059669', color: '#ffffff', textDecoration: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                                  View in Admin Panel
                                </a>
                              </td>
                              <td style={{ paddingLeft: '10px' }}>
                                <a href={cancelUrl} style={{ display: 'inline-block', padding: '12px 24px', backgroundColor: '#dc2626', color: '#ffffff', textDecoration: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                                  Cancel Booking
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    {/* Booking ID */}
                    <table width="100%" cellPadding="0" cellSpacing="0" style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '15px' }}>
                      <tr>
                        <td style={{ textAlign: 'center' }}>
                          <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                            Booking ID: <strong style={{ color: '#111827' }}>{bookingId}</strong>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                {/* Footer */}
                <tr>
                  <td style={{ backgroundColor: '#f9fafb', padding: '20px', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
                      © 2025 EG Driving School - Admin Notification System
                    </p>
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
