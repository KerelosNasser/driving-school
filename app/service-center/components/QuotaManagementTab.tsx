"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Search, RefreshCw } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, isBefore, startOfDay } from "date-fns";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import ProfileCompletionModal from "@/components/ProfileCompletionModal";
import { useCalendarSettings } from "@/hooks/useCalendarSettings";

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

export const CalendarView: React.FC<CalendarViewProps> = ({
  selectedDate,
  onDateSelect,
  calendarSettings
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [findingNext, setFindingNext] = useState(false);

  // Generate calendar days with proper alignment
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  // Get the first day of the week for the month (0 = Sunday, 6 = Saturday)
  const startDayOfWeek = monthStart.getDay();
  
  // Calculate how many days from previous month to show
  const daysFromPrevMonth = startDayOfWeek;
  
  // Calculate how many days from next month to show (to fill the grid)
  const totalDaysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd }).length;
  const totalCells = Math.ceil((daysFromPrevMonth + totalDaysInMonth) / 7) * 7;
  const daysFromNextMonth = totalCells - daysFromPrevMonth - totalDaysInMonth;
  
  // Generate all calendar days including prev/next month
  const calendarDays: Date[] = [];
  
  // Add days from previous month
  for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
    const day = new Date(monthStart);
    day.setDate(day.getDate() - (i + 1));
    calendarDays.push(day);
  }
  
  // Add days from current month
  const currentMonthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  calendarDays.push(...currentMonthDays);
  
  // Add days from next month
  for (let i = 0; i < daysFromNextMonth; i++) {
    const day = new Date(monthEnd);
    day.setDate(day.getDate() + (i + 1));
    calendarDays.push(day);
  }

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

    if (!calendarSettings) {
      console.log('⚠️ No calendar settings loaded yet');
      return false;
    }

    // Check if it's a working day using day-specific enabled flags
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = date.getDay();
    const dayName = dayNames[dayOfWeek];
    const dayEnabledKey = `${dayName}Enabled`;
    
    const isDayEnabled = calendarSettings[dayEnabledKey];
    
    console.log(`🔍 Checking ${date.toDateString()} (${dayName}, day ${dayOfWeek}):`, {
      dayEnabledKey,
      isDayEnabled,
      settingsKeys: Object.keys(calendarSettings).filter(k => k.includes('Enabled'))
    });
    
    // If explicitly false, disable the day
    if (isDayEnabled === false) {
      console.log(`❌ ${dayName} is disabled`);
      return true;
    }
    
    // If undefined or true, it's enabled
    if (isDayEnabled === true || isDayEnabled === undefined) {
      console.log(`✅ ${dayName} is enabled`);
    }

    // Check vacation days
    if (calendarSettings.vacationDays && Array.isArray(calendarSettings.vacationDays)) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      if (calendarSettings.vacationDays.includes(dateStr)) {
        console.log(`🏖️ ${dateStr} is a vacation day`);
        return true;
      }
    }

    return false;
  };

  // Get CSS classes for calendar day
  const getDayClasses = (date: Date) => {
    const baseClasses = "h-10 w-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors";
    
    // Days from other months - lighter and not clickable
    if (!isSameMonth(date, currentMonth)) {
      return `${baseClasses} text-gray-300 cursor-default opacity-40`;
    }

    // Disabled days (past, non-working, vacation)
    if (isDateDisabled(date)) {
      return `${baseClasses} text-gray-400 cursor-not-allowed bg-gray-100 line-through`;
    }

    // Today
    if (isToday(date)) {
      return `${baseClasses} bg-blue-500 text-white hover:bg-blue-600 cursor-pointer font-bold ring-2 ring-blue-300`;
    }

    // Selected date
    if (selectedDate && isSameDay(date, selectedDate)) {
      return `${baseClasses} bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer font-bold ring-2 ring-emerald-300`;
    }

    // Available dates
    return `${baseClasses} text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer hover:ring-1 hover:ring-emerald-200`;
  };

  return (
    <div className="bg-white border border-emerald-100 rounded-xl p-5 shadow-sm">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xl font-bold text-gray-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
      <div className="flex items-center space-x-2">
        <button
          onClick={goToToday}
          className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
        >
          Today
        </button>
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <button
          onClick={findNextAvailableDate}
          disabled={findingNext}
          className="ml-2 px-4 py-2 text-sm font-medium bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
        >
          {findingNext ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          <span>Find next available</span>
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
        {calendarDays.map((date, index) => {
          const isCurrentMonth = isSameMonth(date, currentMonth);
          const isDisabled = isDateDisabled(date);
          const canClick = isCurrentMonth && !isDisabled;
          
          return (
            <div key={`${date.toISOString()}-${index}`} className="relative">
              <button
                className={getDayClasses(date)}
                onClick={() => canClick && onDateSelect(date)}
                disabled={!canClick}
                type="button"
              >
                {format(date, 'd')}
              </button>
            </div>
          );
        })}
      </div>
      
      {/* Calendar Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-500 ring-2 ring-blue-300"></div>
            <span className="text-gray-600">Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-emerald-500 ring-2 ring-emerald-300"></div>
            <span className="text-gray-600">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gray-100 text-gray-400 flex items-center justify-center line-through">X</div>
            <span className="text-gray-600">Unavailable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border border-emerald-200 hover:bg-emerald-50"></div>
            <span className="text-gray-600">Available</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Time Slots View Component
interface TimeSlotsViewProps {
  selectedDate: Date;
  selectedTimeSlots: string[];
  onTimeSlotsChange: (times: string[]) => void;
  calendarSettings?: any;
  remainingHours: number;
}

export const TimeSlotsView: React.FC<TimeSlotsViewProps> = ({
  selectedDate,
  selectedTimeSlots,
  onTimeSlotsChange,
  calendarSettings,
  remainingHours
}) => {
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Check if time slots are consecutive
  const areConsecutive = (slots: string[]): boolean => {
    if (slots.length <= 1) return true;
    const sorted = slots.sort();
    for (let i = 0; i < sorted.length - 1; i++) {
      const currentParts = sorted[i]?.split(':');
      const nextParts = sorted[i + 1]?.split(':');
      if (!currentParts || !nextParts) return false;
      const current = parseInt(currentParts[0] || '0');
      const next = parseInt(nextParts[0] || '0');
      if (next - current !== 1) return false;
    }
    return true;
  };

  // Handle slot click
  const handleSlotClick = (time: string) => {
    const slot = timeSlots.find(s => s.time === time);
    if (!slot?.available) return;

    const isSelected = selectedTimeSlots.includes(time);

    if (isSelected) {
      // Deselect
      onTimeSlotsChange(selectedTimeSlots.filter(t => t !== time));
    } else {
      // Check consecutive
      const newSlots = [...selectedTimeSlots, time];
      if (!areConsecutive(newSlots)) {
        alert('Please select consecutive time slots only');
        return;
      }
      // Check hours
      if (newSlots.length > remainingHours) {
        alert(`You only have ${remainingHours} hours remaining`);
        return;
      }
      onTimeSlotsChange(newSlots);
    }
  };

  // Fetch available time slots with caching
  const { data: slotsData, isLoading: slotsLoading } = useQuery({
    queryKey: ['time-slots', selectedDate?.toISOString().split('T')[0], calendarSettings?.bufferTimeMinutes],
    queryFn: async () => {
      if (!selectedDate) return [];
      
      const dateStr = selectedDate.toISOString().split('T')[0];
      console.log(`🔄 Fetching slots for ${dateStr}`);
      
      // Fetch admin events for the selected date
      const response = await fetch(`/api/calendar/events?date=${dateStr}&admin=true`);
      if (!response.ok) {
        throw new Error('Failed to fetch calendar events');
      }
      
      const data = await response.json();
      const adminEvents = data.events || [];
      
      console.log(`📅 Found ${adminEvents.length} admin events for ${dateStr}`);
      
      // Generate time slots and check availability
      const slots = generateTimeSlotsWithAvailability(dateStr, adminEvents, calendarSettings);
      return slots;
    },
    enabled: !!selectedDate && !!calendarSettings,
    staleTime: 60000, // Cache for 1 minute
    gcTime: 300000, // Keep in cache for 5 minutes
  });

  // Update local state when query data changes
  useEffect(() => {
    if (slotsData) {
      setTimeSlots(slotsData);
      setLoading(false);
    } else if (slotsLoading) {
      setLoading(true);
    }
  }, [slotsData, slotsLoading]);

  // Generate time slots with real availability checking
  const generateTimeSlotsWithAvailability = (date: string, adminEvents: Array<{start: string; end: string; title?: string}>, settings?: any) => {
    const slots = [];
    
    if (!settings) {
      return [];
    }
    
    // Get day of week
    const dateObj = new Date(date + 'T00:00:00');
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dateObj.getDay()];
    
    // Check if day is enabled
    const dayEnabledKey = `${dayName}Enabled`;
    const dayStartKey = `${dayName}Start`;
    const dayEndKey = `${dayName}End`;
    
    if (settings[dayEnabledKey] === false) {
      return [];
    }
    
    // Get working hours
    const workingHoursStart = settings[dayStartKey] || '09:00';
    const workingHoursEnd = settings[dayEndKey] || '17:00';
    const lessonDuration = settings.lessonDurationMinutes || 60;
    const bufferTime = settings.bufferTimeMinutes || 30;

    // Parse times
    const [startHour, startMinute] = workingHoursStart.split(':').map(Number);
    const [endHour, endMinute] = workingHoursEnd.split(':').map(Number);
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    // Generate slots
    for (let time = startTime; time < endTime; time += lessonDuration) {
      const hour = Math.floor(time / 60);
      const minute = time % 60;
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      const slotStart = new Date(`${date}T${timeString}:00`);
      const slotEnd = new Date(slotStart.getTime() + lessonDuration * 60000);
      
      let available = true;
      let reason = '';
      
      // Check conflicts
      for (const event of adminEvents) {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        const eventStartWithBuffer = new Date(eventStart.getTime() - bufferTime * 60000);
        const eventEndWithBuffer = new Date(eventEnd.getTime() + bufferTime * 60000);
        
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
    <div>
      <div className="text-xs text-gray-600 mb-3">
        💡 Tip: Select multiple consecutive hours for longer lessons
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {timeSlots.map((slot, index) => {
          const isSelected = selectedTimeSlots.includes(slot.time);
          const isDisabled = !slot.available || remainingHours < 1;
          
          return (
            <button
              key={index}
              disabled={isDisabled}
              onClick={() => handleSlotClick(slot.time)}
              className={`p-3 rounded-lg border-2 text-center transition-all duration-200 ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-500 text-white shadow-md'
                  : isDisabled
                  ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
              }`}
            >
              <div className="font-semibold text-lg">{slot.time}</div>
              {!slot.available && slot.reason && (
                <div className="text-xs mt-1 opacity-75">{slot.reason}</div>
              )}
              {isSelected && (
                <div className="text-xs mt-1">✓ Selected</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default function QuotaManagementTab({
  userId,
  onQuotaUpdate: _onQuotaUpdate,
}: QuotaManagementTabProps) {
  const queryClient = useQueryClient();

  // Profile completion hook
  const { 
    profileData, 
    canBook, 
    missingFields, 
    refreshProfile,
    loading: profileLoading
  } = useProfileCompletion();

  // State variables
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileCheckPending, setProfileCheckPending] = useState(false);

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

  // Fetch calendar settings
  const { settings: calendarSettings, refetch: refetchCalendarSettings } = useCalendarSettings();

  // Debug: Log settings when they change
  useEffect(() => {
    if (calendarSettings) {
      console.log('📊 Calendar settings loaded:', {
        sundayEnabled: calendarSettings.sundayEnabled,
        mondayEnabled: calendarSettings.mondayEnabled,
        tuesdayEnabled: calendarSettings.tuesdayEnabled,
        wednesdayEnabled: calendarSettings.wednesdayEnabled,
        thursdayEnabled: calendarSettings.thursdayEnabled,
        fridayEnabled: calendarSettings.fridayEnabled,
        saturdayEnabled: calendarSettings.saturdayEnabled,
        vacationDays: calendarSettings.vacationDays?.length || 0
      });
    }
  }, [calendarSettings]);

  const quota = quotaResponse?.quota;

  // Local function to refresh quota data
  const _refreshQuotaData = () => {
    queryClient.invalidateQueries({ queryKey: ["user-quota", userId] });
  };

  // Auto-sync calendar on mount and refresh calendar settings
  useEffect(() => {
    const syncCalendar = async () => {
      try {
        console.log('🔄 [QuotaManagementTab] Syncing calendar...');
        
        // Refresh calendar settings first
        await refetchCalendarSettings();
        
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
          console.log('✅ [QuotaManagementTab] Calendar events loaded:', events);
        }
      } catch (err) {
        console.error("❌ [QuotaManagementTab] Calendar sync failed:", err);
      }
    };

    if (userId) syncCalendar();
  }, [userId, refetchCalendarSettings]);

  // Calculate progress for visual elements
  const totalHours = quota?.total_hours || 0;
  const usedHours = quota?.used_hours || 0;
  const remainingHours = quota?.remaining_hours || 0;
  const progressPercentage =
    totalHours > 0 ? (usedHours / totalHours) * 100 : 0;

  // Handle booking submission
  const handleBooking = async () => {
    if (selectedTimeSlots.length === 0 || !selectedDate) {
      setError('Please select a date and time slots first');
      return;
    }

    // Check if profile is complete using the hook
    if (!canBook) {
      console.warn('⚠️ Profile incomplete - showing completion modal');
      console.log('Missing critical fields:', missingFields.critical);
      console.log('Missing important fields:', missingFields.important);
      setShowProfileModal(true);
      setProfileCheckPending(true);
      return;
    }

    setBooking(true);
    setError(null);
    setSuccess(null);

    try {
      // Format date as YYYY-MM-DD
      const dateStr = selectedDate.toISOString().split('T')[0];
      const startTime = selectedTimeSlots.sort()[0];
      const duration = selectedTimeSlots.length * 60; // minutes

      const response = await fetch('/api/calendar/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: dateStr,
          time: startTime,
          duration: duration,
          lessonType: 'Standard',
          location: 'Brisbane CBD',
          notes: `${selectedTimeSlots.length} hour lesson - Booked via Service Center`
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Lesson booked successfully for ${selectedDate.toLocaleDateString()} at ${startTime}! ${selectedTimeSlots.length} hour(s) deducted from your quota.`);
        setSelectedTimeSlots([]);
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

  // Handle profile completion
  const handleProfileComplete = async () => {
    await refreshProfile();
    setShowProfileModal(false);
    
    // If there was a pending booking, proceed with it
    if (profileCheckPending) {
      setProfileCheckPending(false);
      // Retry booking after profile completion
      setTimeout(() => {
        handleBooking();
      }, 500);
    }
  };

  return (
    <>
      {/* Only render modal when profile data is loaded */}
      {!profileLoading && (
        <ProfileCompletionModal
          open={showProfileModal}
          onOpenChange={setShowProfileModal}
          missingFields={missingFields}
          onComplete={handleProfileComplete}
          initialData={profileData}
        />
      )}
      
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
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-4 rounded-xl shadow-md text-center">
            <div className="text-2xl font-bold">{remainingHours}</div>
            <div className="text-xs font-medium opacity-90">Available</div>
          </div>
          <div className="bg-gradient-to-br from-teal-500 to-teal-600 text-white p-4 rounded-xl shadow-md text-center">
            <div className="text-2xl font-bold">{totalHours}</div>
            <div className="text-xs font-medium opacity-90">Total</div>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-xl shadow-md text-center">
            <div className="text-2xl font-bold">
              {Math.round(progressPercentage)}%
            </div>
            <div className="text-xs font-medium opacity-90">Progress</div>
          </div>
        </div>

        {/* Enhanced Calendar Booking Interface */}
        <Card className="border-emerald-200/60 shadow-lg rounded-xl">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 pb-4 rounded-t-xl">
            <CardTitle className="flex items-center gap-3 text-xl font-bold text-emerald-700">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Calendar className="h-5 w-5 text-emerald-600" />
              </div>
              Schedule Lessons
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
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
                    selectedTimeSlots={selectedTimeSlots}
                    onTimeSlotsChange={setSelectedTimeSlots}
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
                {selectedTimeSlots.length > 0 && selectedDate && (
                  <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200/60 shadow-md">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-xl font-bold text-emerald-800 mb-2 flex items-center gap-2">
                          <CheckCircle className="h-5 w-5" />
                          Confirm Booking
                        </div>
                        <div className="text-sm font-medium text-emerald-700">
                          {selectedDate.toLocaleDateString()} at {selectedTimeSlots.sort()[0]} • {selectedTimeSlots.length} hour lesson
                        </div>
                        <div className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Will consume {selectedTimeSlots.length} hour(s) from quota
                        </div>
                      </div>
                      <button
                        onClick={handleBooking}
                        disabled={booking}
                        className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2"
                      >
                        {booking ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Booking...
                          </>
                        ) : (
                          <>
                            <Calendar className="h-5 w-5" />
                            Book Lesson
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Booking Policies */}
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/60 shadow-sm">
              <div className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
                <div className="p-1 bg-blue-100 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                </div>
                Booking Policies
              </div>
              <div className="space-y-2 text-sm text-blue-700">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>Each lesson consumes 1 hour from your quota</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>{calendarSettings?.bufferTimeMinutes || 30}-minute buffer time between lessons</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>Working hours vary by day (check calendar for details)</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>Cancellations must be made 24 hours in advance</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
    </>
  );
}
