'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  CheckCircle, 
  ArrowRight, 
  Clock, 
  BookOpen, 
  Package,
  AlertCircle
} from 'lucide-react';
import GoogleCalendarIntegration from './GoogleCalendarIntegration';
import QuickActions from './QuickActions';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

// Compact Error Alert Component
const ErrorAlert = ({ message }: { message: string | null }) => {
  if (!message) return null;
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
};

// Compact Success Alert Component
const SuccessAlert = ({ message }: { message: string | null }) => {
  if (!message) return null;
  return (
    <Alert className="border-green-200 bg-green-50 mb-4">
      <CheckCircle className="h-4 w-4 text-green-600" />
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Fetch user quota from API
  const { data: quotaResponse } = useQuery({
    queryKey: ['user-quota', userId],
    queryFn: async () => {
      const response = await fetch('/api/quota');
      if (!response.ok) {
        throw new Error('Failed to fetch quota');
      }
      return response.json();
    },
    enabled: !!userId
  });
  
  const quota = quotaResponse?.quota;
  
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
      const bookings = data?.map((booking: any) => ({
        start: `${booking.date}T${booking.time}`,
        end: `${booking.date}T${booking.time}`,
        type: 'lesson'
      })) || [];
      
      setExistingBookings(bookings);
      return bookings;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return [];
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
  const handleQuotaUpdate = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    refreshQuotaData();
    onQuotaUpdate();
    setIsRefreshing(false);
  };

  // Calculate progress for visual elements
  const totalHours = quota?.total_hours || 0;
  const usedHours = quota?.used_hours || 0;
  const remainingHours = quota?.remaining_hours || 0;
  const progressPercentage = totalHours > 0 ? (usedHours / totalHours) * 100 : 0;

  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 border border-red-300 bg-red-50 rounded-md">
          Something went wrong. Please try refreshing the page.
        </div>
      }
    >
      <div className="space-y-4">
        <ErrorAlert message={error} />
        <SuccessAlert message={success} />

        {/* Clean Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-4 rounded-xl text-center shadow-lg">
            <div className="text-2xl sm:text-3xl font-bold mb-1">{remainingHours}</div>
            <div className="text-xs text-emerald-100 font-medium">Available Hours</div>
          </div>
          
          <div className="bg-gradient-to-br from-teal-500 to-blue-600 text-white p-4 rounded-xl text-center shadow-lg">
            <div className="text-2xl sm:text-3xl font-bold mb-1">{totalHours}</div>
            <div className="text-xs text-teal-100 font-medium">Total Hours</div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500 to-emerald-600 text-white p-4 rounded-xl text-center shadow-lg">
            <div className="text-2xl sm:text-3xl font-bold mb-1">{Math.round(progressPercentage)}%</div>
            <div className="text-xs text-blue-100 font-medium">Complete</div>
          </div>
        </div>

        {/* Quick Actions - Compact */}
        <QuickActions onScrollToBooking={() => {
          const bookingSection = document.querySelector('[data-booking-section]');
          if (bookingSection) {
            bookingSection.scrollIntoView({ behavior: 'smooth' });
          }
        }} />

        {/* Booking Section */}
        <Card data-booking-section className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
            <CardTitle className="flex items-center text-xl font-bold">
              <Calendar className="h-6 w-6 mr-3" />
              Book Your Lesson
            </CardTitle>
            <CardDescription className="text-emerald-100">
              Schedule driving lessons with Google Calendar integration
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Status Bar */}
            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-500 rounded-full">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-emerald-800">Ready to Book</div>
                  <div className="text-sm text-emerald-600">{remainingHours} hours available</div>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                disabled={isRefreshing}
                onClick={() => {
                  handleQuotaUpdate();
                  window.dispatchEvent(new CustomEvent('refreshCalendar'));
                }}
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
              >
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>

            {/* Calendar Integration */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <GoogleCalendarIntegration 
                onBookingComplete={(bookingData) => {
                  setSuccess(`Lesson booked for ${format(new Date(bookingData.start), 'MMM dd, yyyy at HH:mm')}`);
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
      </div>
    </ErrorBoundary>
  );
}