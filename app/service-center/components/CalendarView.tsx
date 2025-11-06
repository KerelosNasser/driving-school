"use client";

import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus, RefreshCw, Calendar, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, isSameDay } from "date-fns";
import { toast } from "sonner";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
}

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
  reason?: string;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  onDateSelect: (date: Date) => void;
  selectedDate?: Date;
  onBookingRequest?: (date: Date, timeSlot: TimeSlot) => void;
  isAdmin?: boolean;
  showBookingInterface?: boolean;
  onRefresh?: () => void;
  loading?: boolean;
}

export default function CalendarView({ 
  events, 
  onDateSelect, 
  selectedDate,
  onBookingRequest,
  isAdmin = false,
  showBookingInterface = false,
  onRefresh,
  loading = false
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [findingNext, setFindingNext] = useState(false);

  // Get events for a specific date
  const getEventsForDate = useCallback((date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return isSameDay(eventDate, date);
    });
  }, [events]);

  // Fetch available time slots for selected date
  const fetchAvailableSlots = useCallback(async (date: Date) => {
    if (!showBookingInterface) return;
    
    setLoadingSlots(true);
    try {
      // Use the unified events endpoint with availability mode
      const response = await fetch(`/api/calendar/events?eventType=availability&date=${format(date, 'yyyy-MM-dd')}`);
      if (response.ok) {
        const data = await response.json();
        const slots = Array.isArray(data) ? data : (data.slots || []);
        setAvailableSlots(slots);
      } else {
        toast.error('Failed to load available time slots');
      }
    } catch (error) {
      console.error('Error fetching available slots:', error);
      toast.error('Error loading time slots');
    } finally {
      setLoadingSlots(false);
    }
  }, [showBookingInterface]);

  // Handle date selection
  const handleDateSelect = useCallback((date: Date) => {
    onDateSelect(date);
    if (showBookingInterface) {
      fetchAvailableSlots(date);
    }
  }, [onDateSelect, showBookingInterface, fetchAvailableSlots]);

  // Handle booking request
  const handleBookingRequest = useCallback((timeSlot: TimeSlot) => {
    if (selectedDate && onBookingRequest) {
      onBookingRequest(selectedDate, timeSlot);
    }
  }, [selectedDate, onBookingRequest]);

  // Get CSS classes for calendar day
  const getDayClasses = useCallback((date: Date) => {
    const baseClasses = "h-10 w-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors cursor-pointer";
    const dayEvents = getEventsForDate(date);
    
    let classes = baseClasses;
    
    if (!isSameMonth(date, currentMonth)) {
      classes += " text-gray-400 hover:text-gray-600";
    } else if (isToday(date)) {
      classes += " bg-blue-500 text-white hover:bg-blue-600";
    } else if (selectedDate && isSameDay(date, selectedDate)) {
      classes += " bg-blue-100 text-blue-700 hover:bg-blue-200";
    } else {
      classes += " text-gray-700 hover:bg-gray-100";
    }
    
    // Add event indicators
    if (dayEvents.length > 0) {
      const hasConfirmed = dayEvents.some(e => e.status === 'confirmed');
      const hasTentative = dayEvents.some(e => e.status === 'tentative');
      
      if (hasConfirmed) {
        classes += " ring-2 ring-green-400";
      } else if (hasTentative) {
        classes += " ring-2 ring-yellow-400";
      }
    }
    
    return classes;
  }, [currentMonth, selectedDate, getEventsForDate]);

  // Navigation functions
  const goToPreviousMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const goToNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    handleDateSelect(today);
  };

  // Find the next available slot across upcoming days
  const findNextAvailableSlot = useCallback(async () => {
    if (!showBookingInterface) return;
    setFindingNext(true);
    try {
      const start = new Date();
      const startDate = selectedDate && selectedDate > start ? selectedDate : start;
      // Search up to 30 days ahead
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
        const dateStr = format(checkDate, 'yyyy-MM-dd');
        const res = await fetch(`/api/calendar/events?eventType=availability&date=${dateStr}`);
        if (!res.ok) continue;
        const data = await res.json();
        const slots: TimeSlot[] = Array.isArray(data) ? data : (data.slots || []);
        const available = slots.filter(s => s.available);
        if (available.length > 0) {
          // Jump calendar to this date and select it
          setCurrentMonth(checkDate);
          onDateSelect(checkDate);
          // Preload slots into side panel
          setAvailableSlots(available);
          toast.success(`Next available: ${format(checkDate, 'EEE, MMM d')} at ${format(new Date(available[0].start), 'h:mm a')}`);
          return;
        }
      }
      toast.error('No available slots found in the next 30 days');
    } catch (err) {
      console.error('Error searching for next available slot:', err);
      toast.error('Failed to search for available slots');
    } finally {
      setFindingNext(false);
    }
  }, [showBookingInterface, selectedDate, onDateSelect]);

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </Button>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          {showBookingInterface && (
            <Button
              variant="default"
              size="sm"
              onClick={findNextAvailableSlot}
              disabled={findingNext}
              className="ml-2"
            >
              {findingNext ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-2">Find next available</span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="h-10 flex items-center justify-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map(date => {
                  const dayEvents = getEventsForDate(date);
                  return (
                    <div key={date.toISOString()} className="relative">
                      <div
                        className={getDayClasses(date)}
                        onClick={() => handleDateSelect(date)}
                      >
                        {format(date, 'd')}
                      </div>
                      {/* Event indicators */}
                      {dayEvents.length > 0 && (
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex space-x-1">
                          {dayEvents.slice(0, 3).map((event, idx) => (
                            <div
                              key={idx}
                              className={`w-1.5 h-1.5 rounded-full ${
                                event.status === 'confirmed' ? 'bg-green-500' :
                                event.status === 'tentative' ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                            />
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          {/* Selected Date Info */}
          {selectedDate && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Events for selected date */}
                <div className="space-y-3">
                  {getEventsForDate(selectedDate).map(event => (
                    <div key={event.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">
                          {isAdmin ? event.title : 'Appointment'}
                        </h4>
                        <Badge variant={
                          event.status === 'confirmed' ? 'default' :
                          event.status === 'tentative' ? 'secondary' :
                          'destructive'
                        }>
                          {event.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {format(new Date(event.start), 'h:mm a')} - {format(new Date(event.end), 'h:mm a')}
                      </p>
                      {isAdmin && event.attendees && (
                        <div className="flex items-center space-x-1 mt-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {getEventsForDate(selectedDate).length === 0 && (
                    <p className="text-gray-500 text-center py-4">No events scheduled</p>
                  )}
                </div>

                {/* Available Time Slots for Booking */}
                {showBookingInterface && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-medium text-gray-900 mb-3">Available Times</h4>
                    {loadingSlots ? (
                      <div className="flex items-center justify-center py-4">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span className="ml-2 text-sm text-gray-600">Loading...</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {availableSlots.filter(slot => slot.available).map((slot, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            className="w-full justify-between"
                            onClick={() => handleBookingRequest(slot)}
                          >
                            <span>{format(new Date(slot.start), 'h:mm a')}</span>
                            <Plus className="h-4 w-4" />
                          </Button>
                        ))}
                        
                        {availableSlots.filter(slot => slot.available).length === 0 && (
                          <p className="text-gray-500 text-center py-4 text-sm">
                            No available times
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle>Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm">Confirmed</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm">Tentative</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm">Cancelled</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm">Today</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}