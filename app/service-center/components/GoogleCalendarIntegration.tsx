'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, AlertCircle, CheckCircle, Loader2, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format, addMinutes, parseISO, } from 'date-fns';

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

  const checkCalendarConnection = async () => {
    try {
      const response = await fetch('/api/calendar/status');
      const data = await response.json();
      setCalendarConnected(data.connected || false);
    } catch (err) {
      console.error('Error checking calendar connection:', err);
      setCalendarConnected(false);
    }
  };

  // Connect to Google Calendar
  const connectCalendar = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/calendar/connect', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.authUrl) {
        window.open(data.authUrl, '_blank', 'width=500,height=600');
        // Poll for connection status
        const pollInterval = setInterval(async () => {
          const statusResponse = await fetch('/api/calendar/status');
          const statusData = await statusResponse.json();
          if (statusData.connected) {
            setCalendarConnected(true);
            clearInterval(pollInterval);
            fetchAvailableSlots();
          }
        }, 2000);
        
        // Stop polling after 2 minutes
        setTimeout(() => clearInterval(pollInterval), 120000);
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
      
      const response = await fetch(`/api/calendar/availability?date=${targetDate}&bufferMinutes=${bufferTimeMinutes}`);
      const data = await response.json();
      
      if (response.ok) {
        setAvailableSlots(data.slots || []);
        setEvents(data.events || []);
      } else {
        setError(data.error || 'Failed to fetch availability');
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

  const formatTimeSlot = (slot: TimeSlot) => {
    return `${slot.start} - ${slot.end}`;
  };

  return (
    <div className="space-y-6">
      {/* Error/Success Messages */}
      {error && (
        <Alert className="border-red-300 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="border-green-300 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Calendar Connection */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <span className="text-blue-900">Google Calendar Integration</span>
          </CardTitle>
          <CardDescription className="text-blue-700">
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
              <Button onClick={connectCalendar} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
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
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">Calendar Connected</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fetchAvailableSlots()}
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
              </div>

              {/* Buffer Time Info */}
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center space-x-2 mb-1">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Buffer Time: {bufferTimeMinutes} minutes</span>
                </div>
                <p className="text-sm text-yellow-700">
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
                          <div className="text-sm font-medium text-green-700 mb-2">
                            ✓ Available Slots ({getAvailableSlots().length})
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {getAvailableSlots().map((slot, index) => (
                              <motion.button
                                key={`${slot.start}-${slot.end}`}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2, delay: index * 0.05 }}
                                onClick={() => setSelectedSlot(slot)}
                                className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                                  selectedSlot === slot
                                    ? 'bg-green-100 border-green-300 text-green-800 ring-2 ring-green-200'
                                    : 'bg-white border-green-200 hover:bg-green-50 text-green-700 hover:border-green-300'
                                }`}
                              >
                                {formatTimeSlot(slot)}
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p>No available slots for this date</p>
                        </div>
                      )}
                      
                      {/* Unavailable Slots with Reasons */}
                      {getUnavailableSlots().length > 0 && (
                        <div>
                          <div className="text-sm font-medium text-gray-600 mb-2">
                            ⚠️ Unavailable Slots ({getUnavailableSlots().length})
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {getUnavailableSlots().slice(0, 8).map((slot, index) => (
                              <div
                                key={`unavailable-${slot.start}-${slot.end}`}
                                className="p-2 rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-500"
                              >
                                <div className="font-medium">{formatTimeSlot(slot)}</div>
                                <div className="text-xs mt-1">{slot.reason}</div>
                              </div>
                            ))}
                          </div>
                          {getUnavailableSlots().length > 8 && (
                            <div className="text-xs text-gray-500 mt-2">
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
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 p-4 bg-gray-50 rounded-lg"
                >
                  <h4 className="font-semibold text-gray-900">Complete Your Booking</h4>
                  
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
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <h5 className="font-medium text-blue-900 mb-2">Booking Summary</h5>
                    <div className="space-y-1 text-sm text-blue-800">
                      <div>Date: {format(parseISO(selectedDate), 'EEEE, MMMM dd, yyyy')}</div>
                      <div>Time: {formatTimeSlot(selectedSlot)}</div>
                      <div>Duration: {lessonHours} hour{lessonHours > 1 ? 's' : ''}</div>
                      {location && <div>Location: {location}</div>}
                      <div>Buffer time: {bufferTimeMinutes} minutes included</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Button 
                      onClick={handleBookLesson}
                      disabled={!location || booking}
                      className="flex-1"
                    >
                      {booking ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Booking...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Confirm Booking
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedSlot(null)}
                      disabled={booking}
                    >
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}