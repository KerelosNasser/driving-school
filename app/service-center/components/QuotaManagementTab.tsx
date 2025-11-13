"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Search, RefreshCw } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, isBefore, startOfDay } from "date-fns";

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
  userEmail?: string;
}

// Calendar View Component
interface CalendarViewProps {
  selectedDate: Date | undefined;
  onDateSelect: (date: Date) => void;
  calendarSettings?: any;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  selectedDate,
  onDateSelect,
  calendarSettings
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [findingNext, setFindingNext] = useState(false);

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
      return newMonth;
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
      return newMonth;
    });
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    if (isToday(today)) {
      onDateSelect(today);
    }
  };

  // Find the next available date with at least one slot
  const findNextAvailableDate = async () => {
    setFindingNext(true);
    try {
      const start = new Date();
      const startDate = selectedDate && selectedDate > start ? selectedDate : start;
      const res = await fetch(`/api/calendar/availability/next?startDate=${startDate.toISOString()}`);
      if (!res.ok) throw new Error('Failed to query next availability');
      const data = await res.json();
      if (!data?.next) return;
      const nextStart = new Date(data.next.start);
      setCurrentMonth(nextStart);
      onDateSelect(nextStart);
    } catch (err) {
      console.error('Failed to search next available date:', err);
    } finally {
      setFindingNext(false);
    }
  };

  // Check if date is disabled (past dates, vacation days, non-working days)
  const isDateDisabled = (date: Date) => {
    const today = startOfDay(new Date());

    // Disable past dates
    if (isBefore(date, today)) {
      return true;
    }

    // Check if it's a working day
    if (calendarSettings?.workingDays && !calendarSettings.workingDays.includes(date.getDay())) {
      return true;
    }

    // Check vacation days (would need to fetch from vacation_days table)
    // For now, just check if it's a weekend
    if (date.getDay() === 0 || date.getDay() === 6) {
      return true;
    }

    return false;
  };

  // Get CSS classes for calendar day
  const getDayClasses = (date: Date) => {
    const baseClasses = "h-10 w-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors cursor-pointer";

    if (!isSameMonth(date, currentMonth)) {
      return `${baseClasses} text-gray-400 hover:text-gray-600`;
    }

    if (isDateDisabled(date)) {
      return `${baseClasses} text-gray-300 cursor-not-allowed bg-gray-50`;
    }

    if (isToday(date)) {
      return `${baseClasses} bg-blue-500 text-white hover:bg-blue-600`;
    }

    if (selectedDate && isSameDay(date, selectedDate)) {
      return `${baseClasses} bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-2 border-emerald-300`;
    }

    return `${baseClasses} text-gray-700 hover:bg-gray-100`;
  };

  return (
    <div className="bg-white border rounded-lg p-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
      <div className="flex items-center space-x-2">
        <button
          onClick={goToToday}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Today
        </button>
        <button
          onClick={goToPreviousMonth}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={goToNextMonth}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          onClick={findNextAvailableDate}
          disabled={findingNext}
          className="ml-2 px-3 py-1 text-sm bg-emerald-500 text-white rounded hover:bg-emerald-600 flex items-center"
        >
          {findingNext ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          <span className="ml-2">Find next available</span>
        </button>
      </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map(date => (
          <div key={date.toISOString()} className="relative">
            <button
              className={getDayClasses(date)}
              onClick={() => !isDateDisabled(date) && onDateSelect(date)}
              disabled={isDateDisabled(date)}
            >
              {format(date, 'd')}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Time Slots View Component
interface TimeSlotsViewProps {
  selectedDate: Date;
  selectedTimeSlot: string | null;
  onTimeSlotSelect: (time: string) => void;
  calendarSettings?: any;
  remainingHours: number;
}

const TimeSlotsView: React.FC<TimeSlotsViewProps> = ({
  selectedDate,
  selectedTimeSlot,
  onTimeSlotSelect,
  calendarSettings,
  remainingHours
}) => {
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch available time slots from admin calendar
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!selectedDate) return;
      
      setLoading(true);
      try {
        const dateStr = selectedDate.toISOString().split('T')[0];
        
        // Fetch admin events for the selected date
        const response = await fetch(`/api/calendar/events?date=${dateStr}&admin=true`);
        if (!response.ok) {
          throw new Error('Failed to fetch calendar events');
        }
        
        const data = await response.json();
        const adminEvents = data.events || [];
        
        // Generate time slots and check availability
        const slots = generateTimeSlotsWithAvailability(dateStr, adminEvents, calendarSettings);
        setTimeSlots(slots);
      } catch (error) {
        console.error('Error fetching available slots:', error);
        // Fallback to mock data if API fails
        setTimeSlots(generateMockTimeSlots());
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableSlots();
  }, [selectedDate, calendarSettings]);

  // Generate time slots with real availability checking
  const generateTimeSlotsWithAvailability = (date: string, adminEvents: any[], settings?: any) => {
    const slots = [];
    const [startHour, startMinute] = settings?.workingHours?.start?.split(':').map(Number) || [9, 0];
    const [endHour, endMinute] = settings?.workingHours?.end?.split(':').map(Number) || [17, 0];
    const lessonDuration = settings?.lessonDurationMinutes || 60;
    const bufferTime = settings?.bufferTimeMinutes || 30;

    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    for (let time = startTime; time < endTime; time += lessonDuration) {
      const hour = Math.floor(time / 60);
      const minute = time % 60;
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      // Check if this time slot conflicts with admin events
      const slotStart = new Date(`${date}T${timeString}:00`);
      const slotEnd = new Date(slotStart.getTime() + lessonDuration * 60000);
      
      let available = true;
      let reason = '';
      
      // Check for conflicts with admin events
      for (const event of adminEvents) {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        
        // Add buffer time to event boundaries
        const eventStartWithBuffer = new Date(eventStart.getTime() - bufferTime * 60000);
        const eventEndWithBuffer = new Date(eventEnd.getTime() + bufferTime * 60000);
        
        // Check for overlap
        if (
          (slotStart >= eventStartWithBuffer && slotStart < eventEndWithBuffer) ||
          (slotEnd > eventStartWithBuffer && slotEnd <= eventEndWithBuffer) ||
          (slotStart <= eventStartWithBuffer && slotEnd >= eventEndWithBuffer)
        ) {
          available = false;
          reason = event.title || 'Unavailable';
          break;
        }
      }
      
      slots.push({
        time: timeString,
        available,
        reason: available ? undefined : reason
      });
    }

    return slots;
  };

  // Fallback mock time slots
  const generateMockTimeSlots = () => {
    return [
      { time: '09:00', available: true },
      { time: '10:00', available: false, reason: 'Booked' },
      { time: '11:00', available: true },
      { time: '14:00', available: true },
      { time: '15:00', available: true },
      { time: '16:00', available: false, reason: 'Unavailable' }
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        <span className="ml-2 text-gray-600">Loading available slots...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {timeSlots.map((slot, index) => (
        <button
          key={index}
          disabled={!slot.available || remainingHours < 1}
          onClick={() => onTimeSlotSelect(slot.time)}
          className={`w-full p-3 rounded-lg border text-left transition-all duration-200 ${
            selectedTimeSlot === slot.time
              ? 'border-emerald-400 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-200'
              : slot.available && remainingHours >= 1
              ? 'border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-700 hover:border-emerald-300'
              : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{slot.time}</div>
              <div className="text-xs text-gray-500">1 hour lesson</div>
            </div>
            <div className="text-right">
              {slot.available && remainingHours >= 1 ? (
                <div className="text-emerald-600 text-sm">Available</div>
              ) : !slot.available ? (
                <div className="text-gray-500 text-sm">{slot.reason}</div>
              ) : (
                <div className="text-red-500 text-sm">No quota</div>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default function QuotaManagementTab({
  userId,
  onQuotaUpdate: _onQuotaUpdate,
}: QuotaManagementTabProps) {
  const queryClient = useQueryClient();

  // State variables
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Fetch user quota from API
  const { data: quotaResponse } = useQuery({
    queryKey: ["user-quota", userId],
    queryFn: async () => {
      const response = await fetch("/api/quota");
      if (!response.ok) {
        throw new Error("Failed to fetch quota");
      }
      return response.json();
    },
    enabled: !!userId,
  });

  // Fetch calendar settings from admin dashboard
  const { data: calendarSettingsResponse } = useQuery({
    queryKey: ["calendar-settings"],
    queryFn: async () => {
      const response = await fetch("/api/calendar/settings");
      if (!response.ok) {
        throw new Error("Failed to fetch calendar settings");
      }
      return response.json();
    },
  });

  const quota = quotaResponse?.quota;
  const calendarSettings = calendarSettingsResponse;

  // Local function to refresh quota data
  const _refreshQuotaData = () => {
    queryClient.invalidateQueries({ queryKey: ["user-quota", userId] });
  };

  // Auto-sync calendar on mount
  useEffect(() => {
    const syncCalendar = async () => {
      try {
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString();
        
        await fetch("/api/calendar/sync", { 
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            startDate,
            endDate
          })
        });
        const { data } = await supabase
          .from("bookings")
          .select("date, time")
          .eq("user_id", userId)
          .eq("status", "confirmed");

        if (data) {
          const events = data.map((booking: any) => ({
            id: `${booking.date}-${booking.time}`,
            date: booking.date,
            time: booking.time,
            title: "Lesson",
            type: "lesson",
          }));
          // Events data available for future use
          console.log('Calendar events loaded:', events);
        }
      } catch (err) {
        console.error("Calendar sync failed:", err);
      }
    };

    if (userId) syncCalendar();
  }, [userId]);

  // Calculate progress for visual elements
  const totalHours = quota?.total_hours || 0;
  const usedHours = quota?.used_hours || 0;
  const remainingHours = quota?.remaining_hours || 0;
  const progressPercentage =
    totalHours > 0 ? (usedHours / totalHours) * 100 : 0;

  // Handle time slot selection
  const handleTimeSlotClick = (time: string) => {
    if (remainingHours < 1) {
      setError('Insufficient quota. You need at least 1 hour remaining to book a lesson.');
      return;
    }
    setSelectedTimeSlot(time);
    setError(null);
  };

  // Handle booking submission
  const handleBooking = async () => {
    if (!selectedTimeSlot || !selectedDate) {
      setError('Please select a date and time slot first');
      return;
    }

    setBooking(true);
    setError(null);
    setSuccess(null);

    try {
      // Format date as YYYY-MM-DD
      const dateStr = selectedDate.toISOString().split('T')[0];

      const response = await fetch('/api/calendar/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: dateStr,
          time: selectedTimeSlot,
          duration: 60,
          lessonType: 'Standard',
          location: 'Brisbane CBD', // Default location
          notes: 'Booked via Service Center'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Lesson booked successfully for ${selectedDate.toLocaleDateString()} at ${selectedTimeSlot}! 1 hour deducted from your quota.`);
        setSelectedTimeSlot(null);
        setSelectedDate(undefined);

        // Refresh quota data
        queryClient.invalidateQueries({ queryKey: ["user-quota", userId] });

        // Call parent callback to refresh data
        if (_onQuotaUpdate) {
          _onQuotaUpdate();
        }
      } else {
        setError(data.error || 'Failed to book lesson');
      }
    } catch (err) {
      console.error('Error booking lesson:', err);
      setError('Failed to book lesson');
    } finally {
      setBooking(false);
    }
  };

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

        {/* Compact Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-emerald-500 text-white p-2 rounded text-center">
            <div className="text-lg font-bold">{remainingHours}</div>
            <div className="text-xs">Available</div>
          </div>
          <div className="bg-teal-500 text-white p-2 rounded text-center">
            <div className="text-lg font-bold">{totalHours}</div>
            <div className="text-xs">Total</div>
          </div>
          <div className="bg-blue-500 text-white p-2 rounded text-center">
            <div className="text-lg font-bold">
              {Math.round(progressPercentage)}%
            </div>
            <div className="text-xs">Progress</div>
          </div>
        </div>

        {/* Enhanced Calendar Booking Interface */}
        <Card className="border-emerald-200">
          <CardHeader className="bg-emerald-50 pb-3">
            <CardTitle className="flex items-center text-lg">
              <Calendar className="h-5 w-5 mr-2 text-emerald-600" />
              Schedule Lessons
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Side - Calendar View */}
              <div className="space-y-4">
                <div className="text-sm font-medium text-gray-700 mb-3">
                  Select Date
                </div>
                <CalendarView
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                  calendarSettings={calendarSettings}
                />
              </div>

              {/* Right Side - Time Slots */}
              <div className="space-y-4">
                <div className="text-sm font-medium text-gray-700 mb-3">
                  Available Time Slots
                  {selectedDate && (
                    <span className="text-emerald-600 ml-2">
                      for {selectedDate.toLocaleDateString()}
                    </span>
                  )}
                </div>

                {selectedDate ? (
                  <TimeSlotsView
                    selectedDate={selectedDate}
                    selectedTimeSlot={selectedTimeSlot}
                    onTimeSlotSelect={handleTimeSlotClick}
                    calendarSettings={calendarSettings}
                    remainingHours={remainingHours}
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Select a date to view available time slots</p>
                  </div>
                )}

                {/* Selected Booking Confirmation */}
                {selectedTimeSlot && selectedDate && (
                  <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-lg font-bold text-emerald-800 mb-1">
                          Confirm Booking
                        </div>
                        <div className="text-sm text-emerald-700">
                          {selectedDate.toLocaleDateString()} at {selectedTimeSlot} • 1 hour lesson
                        </div>
                        <div className="text-xs text-emerald-600 mt-1">
                          Will consume 1 hour from quota
                        </div>
                      </div>
                      <button
                        onClick={handleBooking}
                        disabled={booking}
                        className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                      >
                        {booking ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Booking...
                          </div>
                        ) : (
                          'Book Lesson'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Booking Policies */}
            <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-xs font-medium text-blue-800 mb-2">
                Booking Policies
              </div>
              <div className="space-y-1 text-xs text-blue-700">
                <div>• Each lesson consumes 1 hour from your quota</div>
                <div>• {calendarSettings?.bufferTimeMinutes || 30}-minute buffer time between lessons</div>
                <div>• Working hours: {calendarSettings?.workingHours?.start || '09:00'} - {calendarSettings?.workingHours?.end || '17:00'}</div>
                <div>• Cancellations must be made 24 hours in advance</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
}
