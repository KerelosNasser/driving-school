'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

interface User {
  id: string;
  email: string;
  full_name: string;
}

interface Package {
  id: string;
  name: string;
  hours: number;
}

interface Booking {
  id: string;
  user_id: string;
  package_id: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  google_calendar_event_id: string;
  package: Package;
  user: User;
}

interface CalendarTabProps {
  bookings: Booking[];
}

export const CalendarTab = ({ bookings }: CalendarTabProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const handleEventClick = (clickInfo: any) => {
    const bookingId = clickInfo.event.id;
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      setSelectedBooking(booking);
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Booking Calendar</CardTitle>
          <CardDescription>View all scheduled lessons</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[1000px]">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              events={bookings.map(booking => ({
                id: booking.id,
                title: `${booking.user ? booking.user.full_name : 'Unknown User'} - ${booking.package ? booking.package.name : 'Unknown Package'}`,
                start: `${booking.date}T${booking.time}`,
                end: new Date(new Date(`${booking.date}T${booking.time}`).getTime() + (booking.package ? booking.package.hours : 1) * 60 * 60 * 1000).toISOString(),
                backgroundColor:
                  booking.status === 'completed' ? '#10b981' :
                  booking.status === 'pending' ? '#eab308' :
                  booking.status === 'cancelled' ? '#ef4444' : '#3b82f6',
                extendedProps: {
                  ...booking
                }
              }))}
              eventClick={handleEventClick}
            />
          </div>
        </CardContent>
      </Card>

      {isModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Booking Details</h2>
            <p><strong>Student:</strong> {selectedBooking.user ? selectedBooking.user.full_name : 'N/A'}</p>
            <p><strong>Email:</strong> {selectedBooking.user ? selectedBooking.user.email : 'N/A'}</p>
            <p><strong>Package:</strong> {selectedBooking.package ? selectedBooking.package.name : 'N/A'}</p>
            <p><strong>Date:</strong> {new Date(selectedBooking.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> {selectedBooking.time}</p>
            <p><strong>Status:</strong> {selectedBooking.status}</p>
            {selectedBooking.google_calendar_event_id && (
              <a 
                href={`https://calendar.google.com/event?eid=${selectedBooking.google_calendar_event_id}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline mt-4 inline-block"
              >
                View on Google Calendar
              </a>
            )}
            <div className="mt-6 text-right">
              <Button onClick={closeModal}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};