'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
interface QuotaManagementTabProps {
  userId: string;
  onQuotaUpdate: () => void;
}

interface ExistingBooking {
  start: string;
  end: string;
  type?: string;
}

export default function QuotaManagementTab({ userId, onQuotaUpdate }: QuotaManagementTabProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // State variables
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [existingBookings, setExistingBookings] = useState<ExistingBooking[]>([]);
  
  // Booking form state
  const [showBookingForm, setShowBookingForm] = useState<boolean>(false);
  
  // Fetch user quota
  const { data: quota } = useQuery({
    queryKey: ['user-quota', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_quota')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) return null;
      return data;
    },
    enabled: !!userId
  });
  
  // Local function to refresh quota data
  const refreshQuotaData = () => {
    queryClient.invalidateQueries({ queryKey: ['user-quota', userId] });
  };

  // Fetch existing bookings for calendar
  const fetchExistingBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('date, time, hours_used')
        .eq('user_id', userId)
        .eq('status', 'confirmed');
      
      if (error) throw error;
      
      // Transform to the format needed by the calendar
      const bookings = data.map((booking: any) => ({
        start: `${booking.date}T${booking.time}`,
        end: `${booking.date}T${booking.time}`,
        type: 'lesson'
      }));
      
      setExistingBookings(bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };
  
  // Fetch existing bookings on component mount
  useQuery({
    queryKey: ['existing-bookings', userId],
    queryFn: fetchExistingBookings,
    enabled: !!userId
  });

  // Use React Query for user data fetching
  const { data: userData } = useQuery({
    queryKey: ['userData'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/user');
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        return await response.json();
      } catch (err) {
        console.error('Error fetching user data:', err);
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Fetch existing bookings when quota changes
  useEffect(() => {
    if (quota?.user_id) {
      fetchExistingBookings();
    }
  }, [quota?.user_id]);

  // Handle quota updates from child components
  const handleQuotaUpdate = () => {
    // Refresh quota data
    refreshQuotaData();
    onQuotaUpdate();
  };
  
  // Handle booking success
  const handleBookingSuccess = (message: string) => {
    setSuccess(message);
    
    // Refresh quota
    refreshQuotaData();
    onQuotaUpdate();
  };
  
  // Handle errors from child components
  const handleError = (message: string) => {
    setError(message);
  };
  
  // Handle success messages from child components
  const handleSuccess = (message: string) => {
    setSuccess(message);
  };
  
  // Reset all form states
  const resetState = () => {
    setError(null);
    setSuccess(null);
  };

  // Handle package purchase success
  const handlePackagePurchaseSuccess = (message: string) => {
    setSuccess(message);
    refreshQuotaData();
    onQuotaUpdate();
  };
  
  /**
   * Helper functions
   */
  const handleApiError = (error: any): string => {
    console.error('API Error:', error);
    if (typeof error === 'string') return error;
    return error?.message || 'An unexpected error occurred';
  };

  const handleCalendarSync = () => {
    refreshQuotaData();
    onQuotaUpdate();
    window.dispatchEvent(new CustomEvent('refreshCalendar'));
  };

  /**
   * Component rendering
   */
  return (
    <ErrorBoundary
      fallback={<div className="p-4 border border-red-300 bg-red-50 rounded-md">Something went wrong. Please try refreshing the page.</div>}
    >
      <div className="space-y-6">
      <ErrorAlert message={error} />
      <SuccessAlert message={success} />

      {/* Quick Actions */}
      <QuickActions 
        onBookLesson={() => setShowBookingForm(!showBookingForm)} 
        onPurchaseHours={() => router.push('/packages')} 
      />

      {/* Booking Form */}
      {showBookingForm && (
        <BookingForm
          quota={quota}
          onQuotaUpdate={handleQuotaUpdate}
          onSuccess={(message) => {
            setSuccess(message);
            setShowBookingForm(false);
          }}
          onError={(message) => setError(message)}
          existingBookings={existingBookings}
          userId={userId}
        />
      )}

      {/* Calendar Integration */}
      <CalendarIntegrationCard 
        onSuccess={handleCalendarSync} 
        onError={handleApiError} 
      />

      {/* Package Display */}
      <PackageDisplay 
        userId={userId} 
        quota={quota} 
        onQuotaUpdate={handleQuotaUpdate} 
        onSuccess={(message) => {
          setSuccess(message);
          setTimeout(() => setSuccess(null), 3000);
          queryClient.invalidateQueries({ queryKey: ['bookings'] });
        }}
        onError={(message) => setError(message)}
        onViewAllPackages={() => router.push('/packages')}
      />
      </div>
    </ErrorBoundary>
  );
}