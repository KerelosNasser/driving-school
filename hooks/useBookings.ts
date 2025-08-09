import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Booking, BookingStatusUpdate } from '@/lib/types';

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

  const updateBookingStatus = useCallback(async (update: BookingStatusUpdate): Promise<boolean> => {
    setIsUpdating(true);
    
    try {
      // Update booking status in database
      const { data, error } = await supabase
        .from('bookings')
        .update({ 
          status: update.status, 
          notes: update.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', update.id)
        .select(`
          *,
          users:user_id(id, email, full_name),
          packages:package_id(id, name)
        `)
        .single();

      if (error) {
        throw error;
      }

      // Send email notification
      await sendStatusEmail(data, update.status);

      // Call callback if provided
      if (onBookingUpdate && data) {
        onBookingUpdate(data);
      }

      toast.success('Booking updated successfully', {
        description: `Status changed to ${update.status}. Email notification sent.`,
      });

      return true;
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [onBookingUpdate]);

  return {
    updateBookingStatus,
    isUpdating,
  };
}