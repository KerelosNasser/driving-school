import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Booking, BookingStatusUpdate } from '@/lib/types';
import { geocodeAddress } from '@/lib/geocoding';

interface UseBookingsReturn {
  updateBookingStatus: (update: BookingStatusUpdate) => Promise<boolean>;
  isUpdating: boolean;
}

export function useBookings(onBookingUpdate?: (booking: Booking) => void): UseBookingsReturn {
  const [isUpdating, setIsUpdating] = useState(false);

  const sendStatusEmail = async (booking: Booking, newStatus: string) => {
    try {
      const response = await fetch('/api/send-booking-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: booking.id,
          userEmail: booking.users?.email,
          userName: booking.users?.full_name,
          status: newStatus,
          date: booking.date,
          time: booking.start_time,
          packageName: booking.packages?.name,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      // Don't throw here - email failure shouldn't block status update
    }
  };

  const updateBookingStatus = async (update: BookingStatusUpdate): Promise<boolean> => {
    try {
      setIsUpdating(true);
      
      // Update booking status in Supabase
      const { data, error } = await supabase
        .from('bookings')
        .update({ 
          status: update.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', update.id)
        .select(`
          *,
          users:user_id(id, email, full_name),
          packages:package_id(id, name, hours, price)
        `)
        .single();

      if (error) throw error;

      // If booking is confirmed, add coordinates to user record
      if (update.status === 'confirmed' && data.location) {
        await addLocationCoordinates(data);
      }

      // Send email notification
      await sendStatusEmail(data, update.status);
      
      // Schedule review reminder if booking is completed
      if (update.status === 'completed') {
        await scheduleReviewReminder(data);
      }

      onBookingUpdate?.(data);

      toast.success("Booking Updated", {
        description: `Status changed to ${update.status}. Email notification sent.`,
      });
      return true;
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error("Failed to update booking status. Please try again.");
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const addLocationCoordinates = async (booking: any) => {
    if (!booking.location) return;
    
    try {
      const geoResult = await geocodeAddress(booking.location);
      if (geoResult) {
        await supabase
          .from('users')
          .update({
            latitude: geoResult.lat,
            longitude: geoResult.lng,
            address: booking.location
          })
          .eq('id', booking.user_id);
      }
    } catch (error) {
      console.error('Error adding location coordinates:', error);
    }
  };

  const scheduleReviewReminder = async (booking: any) => {
    // Schedule review reminder for 1 day after the booking date
    const bookingDate = new Date(`${booking.date}T${booking.time}`);
    const reminderDate = new Date(bookingDate.getTime() + 24 * 60 * 60 * 1000);
    
    // In a production environment, you'd use a job queue like Bull or a cron job
    // For now, we'll create a simple API call
    setTimeout(async () => {
      await fetch('/api/send-review-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: booking.users.email,
          userName: booking.users.full_name,
          bookingId: booking.id
        })
      });
    }, reminderDate.getTime() - Date.now());
  };

  return {
    updateBookingStatus,
    isUpdating,
  };
}