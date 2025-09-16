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
  const handleQuotaUpdate = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    refreshQuotaData();
    onQuotaUpdate();
    setIsRefreshing(false);
  };

  // Calculate progress for visual elements
  const totalHours = quota?.total_hours || 0;
  const usedHours = totalHours - (quota?.remaining_hours || 0);
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

        {/* Compact Stats - Single Row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-3 gap-3"
        >
          <div className="bg-gradient-to-br from-emerald-500 to-green-600 text-white p-3 rounded-lg text-center">
            <div className="text-xl sm:text-2xl font-bold">{quota?.remaining_hours || 0}</div>
            <div className="text-xs text-emerald-100 flex items-center justify-center mt-1">
              <Clock className="h-3 w-3 mr-1" />
              Available
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-3 rounded-lg text-center">
            <div className="text-xl sm:text-2xl font-bold">{quota?.total_hours || 0}</div>
            <div className="text-xs text-blue-100 flex items-center justify-center mt-1">
              <BookOpen className="h-3 w-3 mr-1" />
              Total
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-violet-600 text-white p-3 rounded-lg text-center">
            <div className="text-xl sm:text-2xl font-bold">{Math.round(progressPercentage)}%</div>
            <div className="text-xs text-purple-100 mt-1">Progress</div>
          </div>
        </motion.div>

        {/* Quick Actions - Compact */}
        <QuickActions onScrollToBooking={() => {
          const bookingSection = document.querySelector('[data-booking-section]');
          if (bookingSection) {
            bookingSection.scrollIntoView({ behavior: 'smooth' });
          }
        }} />

        {/* Booking Section - Compact */}
        <Card data-booking-section className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white pb-3">
            <CardTitle className="flex items-center text-lg">
              <Calendar className="h-5 w-5 mr-2" />
              Book Your Lesson
            </CardTitle>
            <CardDescription className="text-blue-100 text-sm">
              Schedule driving lessons with Google Calendar
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 space-y-3">
            {/* Sync Status - Compact */}
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Synced with Packages</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                disabled={isRefreshing}
                onClick={() => {
                  handleQuotaUpdate();
                  window.dispatchEvent(new CustomEvent('refreshCalendar'));
                }}
                className="h-8 px-3 text-xs"
              >
                {isRefreshing ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <ArrowRight className="h-3 w-3" />
                  </motion.div>
                ) : (
                  <ArrowRight className="h-3 w-3" />
                )}
              </Button>
            </div>

            {/* Available Hours Badge */}
            <div className="text-center p-2 bg-emerald-50 rounded-lg border border-emerald-200">
              <Badge className="bg-emerald-500 text-white px-3 py-1">
                {quota?.remaining_hours || 0} Hours Available
              </Badge>
            </div>

            {/* Google Calendar Integration - Compact Container */}
            <div className="bg-gray-50 rounded-lg p-3">
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