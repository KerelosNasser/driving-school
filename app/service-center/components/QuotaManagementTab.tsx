'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, CheckCircle, ArrowRight } from 'lucide-react';
import GoogleCalendarIntegration from './GoogleCalendarIntegration';
import QuickActions from './QuickActions';
import { format } from 'date-fns';

// Error Alert Component
const ErrorAlert = ({ message }: { message: string | null }) => {
  if (!message) return null;
  return (
    <Alert variant="destructive">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
};

// Success Alert Component
const SuccessAlert = ({ message }: { message: string | null }) => {
  if (!message) return null;
  return (
    <Alert className="border-green-200 bg-green-50">
      <AlertDescription className="text-green-800">{message}</AlertDescription>
    </Alert>
  );
};

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
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
  useQuery({
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
  
  /**
   * Helper functions
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleApiError = (error: any): string => {
    console.error('API Error:', error);
    if (typeof error === 'string') return error;
    return error?.message || 'An unexpected error occurred';
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
      <QuickActions onScrollToBooking={() => {
        const bookingSection = document.querySelector('[data-booking-section]');
        if (bookingSection) {
          bookingSection.scrollIntoView({ behavior: 'smooth' });
        }
      }} />

      {/* Google Calendar Booking */}
      <Card data-booking-section>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Book Your Lesson</span>
          </CardTitle>
          <CardDescription>
            Use Google Calendar integration to schedule your driving lessons
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium">Available Hours:</span>
              <Badge variant="secondary" className="text-lg font-bold">
                {quota?.remaining_hours || 0}
              </Badge>
            </div>
            
            {/* Sync Status */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    Synchronized with Packages Page
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    handleQuotaUpdate();
                    window.dispatchEvent(new CustomEvent('refreshCalendar'));
                  }}
                >
                  <ArrowRight className="h-3 w-3 mr-1" />
                  Sync Now
                </Button>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Bookings made here will automatically update your quota and sync with the packages page
              </p>
            </div>

            <GoogleCalendarIntegration 
              onBookingComplete={(bookingData) => {
                setSuccess(`Lesson booked successfully via Google Calendar for ${format(new Date(bookingData.start), 'MMM dd, yyyy at HH:mm')}`);
                handleQuotaUpdate();
                window.dispatchEvent(new CustomEvent('quotaUpdated', { 
                  detail: { type: 'booking', bookingData } 
                }));
              }}
              onError={(error) => setError(error)}
              userQuota={quota}
              existingBookings={existingBookings}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quota Information */}
      <Card>
        <CardHeader>
          <CardTitle>Your Quota</CardTitle>
          <CardDescription>
            Current lesson hours and package information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {quota?.remaining_hours || 0}
              </div>
              <div className="text-sm text-green-700">Hours Remaining</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {quota?.total_hours || 0}
              </div>
              <div className="text-sm text-blue-700">Total Hours</div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => router.push('/packages')}
              className="w-full"
            >
              View All Packages
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </ErrorBoundary>
  );
}