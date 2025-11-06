'use client';

import { useState, useEffect, useCallback } from 'react';

import { Calendar, Clock, AlertCircle, CheckCircle, Loader2, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format, addMinutes, parseISO, isWeekend } from 'date-fns';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
}

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
  reason?: string;
}

interface GoogleCalendarIntegrationProps {
  onBookingComplete?: (booking: any) => void;
  quota?: {
    remaining_hours: number;
  } | null;
  bufferTimeMinutes?: number;
}

export default function GoogleCalendarIntegration({ 
  onBookingComplete, 
  quota,
  bufferTimeMinutes = 30 
}: GoogleCalendarIntegrationProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [userStatistics, setUserStatistics] = useState<any>(null);
  
  // Booking form state
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [lessonHours, setLessonHours] = useState<number>(1);
  const [location, setLocation] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [booking, setBooking] = useState(false);

  // Check calendar connection status
  useEffect(() => {
    checkCalendarConnection();
  }, []);

  // Fetch user data for auto-population
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/user');
        const data = await response.json();
        
        if (response.ok && data.statistics?.recentActivity?.preferredLocation) {
          setLocation(data.statistics.recentActivity.preferredLocation);
          setUserStatistics(data.statistics);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };

    fetchUserData();
  }, []);

  const checkCalendarConnection = useCallback(async () => {
    try {
      const response = await fetch('/api/calendar/connection');
      const data = await response.json();
      setCalendarConnected(data.connected || false);

      if (!data.connected && data.message) {
        setError(data.message);
      }
    } catch (err) {
      console.error('Error checking calendar connection:', err);
      setCalendarConnected(false);
      setError('Failed to check calendar connection status');
    }
  }, []);

  // Connect to Google Calendar
  const connectCalendar = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/calendar/oauth/authorize', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.authUrl) {
        // Open OAuth popup
        const popup = window.open(
          data.authUrl, 
          'google-oauth', 
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );
        
        // Poll for connection status
        const pollInterval = setInterval(async () => {
          try {
            // Check if popup was closed
            if (popup?.closed) {
              clearInterval(pollInterval);
              await checkCalendarConnection();
              if (calendarConnected) {
                fetchAvailableSlots();
              }
              return;
            }
            
            const statusResponse = await fetch('/api/calendar/connection');
            const statusData = await statusResponse.json();
            if (statusData.connected) {
              setCalendarConnected(true);
              clearInterval(pollInterval);
              popup?.close();
              fetchAvailableSlots();
            }
          } catch (pollErr) {
            console.error('Error during polling:', pollErr);
          }
        }, 2000);
        
        // Stop polling after 2 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          if (popup && !popup.closed) {
            popup.close();
          }
        }, 120000);
      } else {
        setError(data.error || 'Failed to get authorization URL');
      }
    } catch (err) {
      console.error('Error connecting calendar:', err);
      setError('Failed to connect to Google Calendar');
    } finally {
      setLoading(false);
    }
  };

  // Fetch available time slots with buffer time consideration
  const fetchAvailableSlots = useCallback(async (date?: string) => {
    if (!calendarConnected) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const targetDate = date || selectedDate;
      if (!targetDate) return;
      
      const response = await fetch(`/api/calendar/events?date=${targetDate}&bufferMinutes=${bufferTimeMinutes}&type=availability`);
      const data = await response.json();
      
      if (response.ok) {
        setAvailableSlots(data.slots || []);
        setEvents(data.events || []);
      } else {
        if (response.status === 401) {
          setCalendarConnected(false);
          setError('Calendar connection expired. Please reconnect.');
        } else {
          setError(data.error || 'Failed to fetch availability');
        }
      }
    } catch (err) {
      console.error('Error fetching availability:', err);
      setError('Failed to load calendar availability');
    } finally {
      setLoading(false);
    }
  }, [calendarConnected, selectedDate, bufferTimeMinutes]);

  // Handle date selection
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    if (date) {
      fetchAvailableSlots(date);
    }
  };

  // Book lesson with Google Calendar integration
  const handleBookLesson = async () => {
    if (!selectedSlot || !location || !quota) {
      setError('Please fill in all required fields');
      return;
    }

    if (quota.remaining_hours < lessonHours) {
      setError(`Insufficient quota. You have ${quota.remaining_hours} hours remaining.`);
      return;
    }

    setBooking(true);
    setError(null);
    setSuccess(null);

    try {
      // Calculate lesson end time
      const startTime = parseISO(`${selectedDate}T${selectedSlot.start}`);
      const endTime = addMinutes(startTime, lessonHours * 60);
      
      // Create calendar event and booking
      const response = await fetch('/api/calendar/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `Driving Lesson (${lessonHours}h)`,
          start: startTime.toISOString(),
          end: endTime.toISOString(),
          location: location,
          description: notes || `${lessonHours} hour driving lesson`,
          lessonHours: lessonHours,
          bufferMinutes: bufferTimeMinutes
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Lesson booked successfully! Calendar event created and ${lessonHours} hours deducted from your quota.`);
        
        // Reset form
        setSelectedSlot(null);
        setLocation('');
        setNotes('');
        
        // Refresh availability
        fetchAvailableSlots();
        
        // Notify parent component
        if (onBookingComplete) {
          onBookingComplete(data.booking);
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

  // Auto-refresh availability every 2 minutes for real-time updates
  useEffect(() => {
    if (!calendarConnected || !selectedDate) return;
    
    const interval = setInterval(() => {
      fetchAvailableSlots();
    }, 120000); // 2 minutes
    
    return () => clearInterval(interval);
  }, [calendarConnected, selectedDate, fetchAvailableSlots]);

  // Listen for external refresh requests from packages page or other components
  useEffect(() => {
    const handleRefreshCalendar = () => {
      if (calendarConnected && selectedDate) {
        fetchAvailableSlots();
      }
      checkCalendarConnection();
    };

    window.addEventListener('refreshCalendar', handleRefreshCalendar);
    
    return () => {
      window.removeEventListener('refreshCalendar', handleRefreshCalendar);
    };
  }, [calendarConnected, selectedDate, fetchAvailableSlots, checkCalendarConnection]);

  // Generate next 14 days for date selection (extended range)
  const getNextFourteenDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      // Skip weekends
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        days.push({
          value: format(date, 'yyyy-MM-dd'),
          label: format(date, 'EEEE, MMM dd')
        });
      }
    }
    return days;
  };

  // Filter available slots for better display
  const getAvailableSlots = () => {
    return availableSlots.filter(slot => slot.available);
  };

  // Get unavailable slots with reasons
  const getUnavailableSlots = () => {
    return availableSlots.filter(slot => !slot.available && slot.reason);
  };

  // Friendly time label (e.g., 9:00 AM – 10:00 AM)
  const formatTimeSlot = (slot: TimeSlot) => {
    try {
      const startDt = parseISO(slot.start);
      const endDt = parseISO(slot.end);
      const startStr = format(startDt, 'h:mm a');
      const endStr = format(endDt, 'h:mm a');
      return `${startStr} – ${endStr}`;
    } catch {
      // Fallback to raw string if parsing fails
      return `${slot.start} – ${slot.end}`;
    }
  };

  // Friendly reason mapping
  const friendlyReason = (reason?: string) => {
    if (!reason) return '';
    const lower = reason.toLowerCase();
    if (lower.includes('conflicts') || lower.includes('overlap')) {
      return 'Overlaps with another lesson (including buffer time)';
    }
    if (lower.includes('buffer')) {
      return 'Insufficient buffer time around an existing lesson';
    }
    if (lower.includes('working hours')) {
      return 'Outside working hours';
    }
    return reason;
  };

  // Determine a friendly day-level message when no slots
  const getDayUnavailableMessage = () => {
    if (!selectedDate) return null;
    const dt = parseISO(selectedDate);
    if (events && events.length > 0) {
      return 'This day is blocked due to existing admin events. Please choose another date.';
    }
    if (isWeekend(dt)) {
      return "We’re closed on weekends. Please pick a weekday.";
    }
    return 'No available times left today. Please try a different time or another date.';
  };

  return (
    <div className="space-y-6">
      {/* Error/Success Messages */}
      {error && (
        <Alert className="border-red-300 bg-red-50 shadow-sm">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="border-emerald-300 bg-emerald-50 shadow-sm">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-emerald-800 font-medium">{success}</AlertDescription>
        </Alert>
      )}

      {/* Calendar Connection */}
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-emerald-600" />
            <span className="text-emerald-900">Google Calendar Integration</span>
          </CardTitle>
          <CardDescription className="text-emerald-700">
            Connect your Google Calendar for seamless booking with automatic buffer time management
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!calendarConnected ? (
            <div className="text-center py-6">
              <Calendar className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Connect your Google Calendar to view real-time availability and book lessons directly
              </p>
              <Button onClick={connectCalendar} disabled={loading} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Connect Google Calendar
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-500 rounded-full">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <span className="font-semibold text-emerald-800">Calendar Connected</span>
                    <div className="text-sm text-emerald-600">Real-time sync active</div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fetchAvailableSlots()}
                  disabled={loading}
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
              </div>

              {/* Buffer Time Info */}
              <div className="p-4 bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl border border-teal-200 shadow-sm">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-teal-500 rounded-full">
                    <Clock className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-semibold text-teal-800">Buffer Time: {bufferTimeMinutes} minutes</span>
                </div>
                <p className="text-sm text-teal-700">
                  Automatic rest periods are included between bookings to ensure adequate preparation time.
                </p>
              </div>

              {/* Date Selection */}
              <div>
                <Label htmlFor="date-select">Select Date (Weekdays Only)</Label>
                <Select value={selectedDate} onValueChange={handleDateChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a date for your lesson" />
                  </SelectTrigger>
                  <SelectContent>
                    {getNextFourteenDays().map((day) => (
                      <SelectItem key={day.value} value={day.value}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Real-time Availability Display */}
              {selectedDate && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Available Time Slots</Label>
                    <div className="text-xs text-gray-500">
                      Auto-refreshes every 2 minutes
                    </div>
                  </div>
                  {/* Day-level admin event notice */}
                  {events && events.length > 0 && (
                    <Alert className="border-yellow-300 bg-yellow-50">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        This day has existing admin calendar events. Booking is disabled for this date.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      <span>Loading real-time availability...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Available Slots */}
                      {getAvailableSlots().length > 0 ? (
                        <div>
                          <div className="flex items-center space-x-2 mb-3">
                            <div className="p-1 bg-emerald-500 rounded-full">
                              <CheckCircle className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-sm font-semibold text-emerald-700">
                              Available Slots ({getAvailableSlots().length})
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {getAvailableSlots().map((slot) => (
                              <button
                                key={`${slot.start}-${slot.end}`}
                                onClick={() => setSelectedSlot(slot)}
                                className={`p-3 rounded-xl border text-sm font-medium transition-all duration-200 shadow-sm ${
                                  selectedSlot === slot
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 border-emerald-300 text-white ring-2 ring-emerald-200 shadow-lg transform scale-105'
                                    : 'bg-white border-emerald-200 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 text-emerald-700 hover:border-emerald-300 hover:shadow-md'
                                }`}
                              >
                                {formatTimeSlot(slot)}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-600 space-y-2">
                          <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p>{getDayUnavailableMessage()}</p>
                          <div className="text-xs text-gray-500">
                            Tips: Try another time on this day, or pick a different date. Buffer time between lessons may block adjacent times.
                          </div>
                        </div>
                      )}
                      
                      {/* Unavailable Slots with Reasons */}
                      {getUnavailableSlots().length > 0 && (
                        <div>
                          <div className="flex items-center space-x-2 mb-3">
                            <div className="p-1 bg-gray-400 rounded-full">
                              <AlertCircle className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-sm font-semibold text-gray-600">
                              Unavailable Slots ({getUnavailableSlots().length})
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {getUnavailableSlots().slice(0, 8).map((slot) => (
                              <div
                                key={`unavailable-${slot.start}-${slot.end}`}
                                className="p-3 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-600 shadow-sm"
                              >
                                <div className="font-medium text-gray-700">{formatTimeSlot(slot)}</div>
                                <div className="text-xs mt-1 text-gray-500">{friendlyReason(slot.reason)}</div>
                              </div>
                            ))}
                          </div>
                          {getUnavailableSlots().length > 8 && (
                            <div className="text-xs text-gray-500 mt-3 text-center p-2 bg-gray-50 rounded-lg">
                              +{getUnavailableSlots().length - 8} more unavailable slots
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Booking Form */}
              {selectedSlot && (
                <div className="space-y-6 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-500 rounded-full">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-emerald-900">Complete Your Booking</h4>
                  </div>
                  
                  {/* Lesson Duration */}
                  <div>
                    <Label htmlFor="lesson-hours">Lesson Duration</Label>
                    <Select value={lessonHours.toString()} onValueChange={(value) => setLessonHours(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4].map((hours) => (
                          <SelectItem 
                            key={hours} 
                            value={hours.toString()}
                            disabled={quota ? quota.remaining_hours < hours : true}
                          >
                            {hours} hour{hours > 1 ? 's' : ''}
                            {quota && quota.remaining_hours < hours && ' (Insufficient quota)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Location */}
                  <div>
                    <Label htmlFor="location">Pickup Location *</Label>
                    <Select value={location} onValueChange={setLocation}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select pickup location" />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          'Brisbane CBD', 'South Brisbane', 'West End', 'Fortitude Valley', 
                          'New Farm', 'Paddington', 'Milton', 'Toowong', 'St Lucia', 
                          'Indooroopilly', 'Kelvin Grove', 'Chermside', 'Carindale', 
                          'Mount Gravatt', 'Sunnybank', 'Wynnum', 'Sandgate', 'The Gap'
                        ].map((suburb) => (
                          <SelectItem key={suburb} value={suburb}>
                            {suburb}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Notes */}
                  <div>
                    <Label htmlFor="notes">Additional Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any specific requirements or notes for your lesson..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* Booking Summary */}
                  <div className="p-4 bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl border border-teal-200 shadow-sm">
                    <div className="flex items-center space-x-2 mb-3">
                      <Calendar className="h-5 w-5 text-teal-600" />
                      <h5 className="font-semibold text-teal-900">Booking Summary</h5>
                    </div>
                    <div className="space-y-2 text-sm text-teal-800">
                      <div className="flex justify-between">
                        <span className="font-medium">Date:</span>
                        <span>{format(parseISO(selectedDate), 'EEEE, MMMM dd, yyyy')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Time:</span>
                        <span>{formatTimeSlot(selectedSlot)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Duration:</span>
                        <span>{lessonHours} hour{lessonHours > 1 ? 's' : ''}</span>
                      </div>
                      {location && (
                        <div className="flex justify-between">
                          <span className="font-medium">Location:</span>
                          <span>{location}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs text-teal-600 pt-2 border-t border-teal-200">
                        <span>Buffer time:</span>
                        <span>{bufferTimeMinutes} minutes included</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <Button 
                      onClick={handleBookLesson}
                      disabled={!location || booking}
                      className="flex-1 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg font-semibold"
                    >
                      {booking ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Booking Lesson...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Confirm Booking
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedSlot(null)}
                      disabled={booking}
                      className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    >
                      Cancel
                    </Button>
                  </div>
                  {/* Helper: find next available slot */}
                  <div className="pt-2 text-xs text-gray-500">
                    Can’t find a suitable time? Try another date or adjust duration. We include {bufferTimeMinutes} minutes buffer between lessons to keep things smooth.
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
