'use client';

import { useState } from 'react';
import { format, addDays, isAfter, isBefore } from 'date-fns';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import GoogleCalendarIntegration from './GoogleCalendarIntegration';

interface BookingFormData {
  lessonType: string;
  lessonHours: number;
  selectedDate: Date | undefined;
  selectedTime: string | null;
  selectedLocation: string | null;
  notes: string;
}

interface UserQuota {
  user_id: string;
  total_hours: number;
  used_hours: number;
  remaining_hours: number;
  created_at: string;
  updated_at: string;
}

interface BookingFormProps {
  quota: UserQuota | null;
  onQuotaUpdate: () => void;
  onSuccess: (message: string) => void;
  onError: (error: Error) => void;
  onCancel: () => void;
  userStatistics?: any;
}

// Available time slots for booking
const timeSlots = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
];

// Brisbane suburbs for lesson locations
const brisbaneSuburbs = [
  'Brisbane CBD', 'South Brisbane', 'West End', 'Fortitude Valley', 'New Farm', 
  'Paddington', 'Milton', 'Toowong', 'St Lucia', 'Indooroopilly', 'Kelvin Grove',
  'Chermside', 'Carindale', 'Mount Gravatt', 'Sunnybank', 'Wynnum', 'Sandgate', 'The Gap'
];

export default function BookingForm({ 
  quota, 
  onQuotaUpdate, 
  onSuccess, 
  onError, 
  onCancel,
  userStatistics 
}: BookingFormProps) {
  const queryClient = useQueryClient();
  
  // Booking form state
  const [bookingLoading, setBookingLoading] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(
    userStatistics?.recentActivity?.preferredLocation || null
  );
  const [lessonType, setLessonType] = useState<string>('standard');
  const [lessonHours, setLessonHours] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');

  // Minimum date is tomorrow
  const minDate = addDays(new Date(), 1);
  // Maximum date is 3 months from now
  const maxDate = addDays(new Date(), 90);

  // Use React Query mutation for booking lessons
  const bookLessonMutation = useMutation({
    mutationFn: async (formData: BookingFormData) => {
      // Validate form data
      if (!formData.selectedDate || !formData.selectedTime || !formData.selectedLocation || !formData.lessonHours) {
        throw new Error('Please fill in all required fields');
      }

      if (!quota || quota.remaining_hours < formData.lessonHours) {
        throw new Error(`Insufficient quota. You have ${quota?.remaining_hours || 0} hours remaining.`);
      }
      
      // First create the booking record
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: quota.user_id,
          package_id: null, // No package since using quota
          date: format(formData.selectedDate, 'yyyy-MM-dd'),
          time: formData.selectedTime,
          location: formData.selectedLocation,
          status: 'pending',
          hours_used: formData.lessonHours,
          notes: formData.notes || null
        })
        .select()
        .single();

      if (bookingError) {
        throw new Error(bookingError.message);
      }

      try {
        // Then consume the quota
        const consumeResponse = await fetch('/api/quota/consume', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            hours: formData.lessonHours,
            booking_id: booking.id,
            description: `Booked ${formData.lessonHours} hour lesson on ${format(formData.selectedDate, 'MMM dd, yyyy')} at ${formData.selectedTime}`
          }),
        });

        const consumeData = await consumeResponse.json();

        if (!consumeResponse.ok) {
          // If quota consumption fails, delete the booking
          await supabase.from('bookings').delete().eq('id', booking.id);
          throw new Error(consumeData.error || 'Failed to consume quota');
        }

        // Update the booking with quota transaction ID if available
        if (consumeData.quota_transaction_id) {
          await supabase
            .from('bookings')
            .update({ quota_transaction_id: consumeData.quota_transaction_id })
            .eq('id', booking.id);
        }
        
        return { booking, consumeData };
      } catch (error) {
        // Clean up booking if quota consumption fails
        await supabase.from('bookings').delete().eq('id', booking.id);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      
      onSuccess(`Lesson booked successfully! ${lessonHours} hours have been deducted from your quota.`);
      
      // Reset form
      setSelectedDate(undefined);
      setSelectedTime(null);
      setSelectedLocation(null);
      setLessonHours(1);
      setNotes('');
      
      // Refresh quota
      onQuotaUpdate();
    },
    onError: (error: Error) => {
      onError(error);
    },
  });
  
  // Handle lesson booking
  const handleBookLesson = () => {
    setBookingLoading(true);
    
    bookLessonMutation.mutate({
      lessonType,
      lessonHours,
      selectedDate,
      selectedTime,
      selectedLocation,
      notes
    }, {
      onSettled: () => {
        setBookingLoading(false);
      }
    });
  };

  const handleApiError = (error: any): string => {
    console.error('API Error:', error);
    if (typeof error === 'string') return error;
    return error?.message || 'An unexpected error occurred';
  };

  const handleCalendarSync = () => {
    onQuotaUpdate();
    window.dispatchEvent(new CustomEvent('refreshCalendar'));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Book Your Lesson</CardTitle>
        <CardDescription>
          Schedule a new driving lesson
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

          <GoogleCalendarIntegration 
            onSuccess={handleCalendarSync} 
            onError={handleApiError}
          />

          <div>
            <Label htmlFor="lesson-hours">Lesson Duration (Hours)</Label>
            <Select value={lessonHours.toString()} onValueChange={(value) => setLessonHours(parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Select hours" />
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

          {/* Date Selection */}
          <div>
            <Label>Select Date</Label>
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => 
                isBefore(date, minDate) || isAfter(date, maxDate)
              }
              className="rounded-md border"
            />
          </div>

          {/* Time Selection */}
          {selectedDate && (
            <div>
              <Label>Select Time</Label>
                <RadioGroup value={selectedTime || ''} onValueChange={setSelectedTime}>
                  <div className="grid grid-cols-3 gap-2">
                        {timeSlots.map((time) => (
                          <div key={time} className="flex items-center space-x-2">
                            <RadioGroupItem value={time} id={`time-${time}`} />
                            <Label htmlFor={`time-${time}`} className="text-sm">{time}</Label>
                          </div>
                        ))}
                  </div>
                </RadioGroup>
              </div>
            )}

          {/* Location Selection */}
          {selectedTime && (
            <div>
              <Label htmlFor="location">Pickup Location</Label>
              <Select value={selectedLocation || ''} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select pickup location" />
                </SelectTrigger>
                <SelectContent>
                  {brisbaneSuburbs.map((suburb) => (
                    <SelectItem key={suburb} value={suburb}>
                      {suburb}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes */}
          {selectedLocation && (
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
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button 
              onClick={handleBookLesson}
              disabled={!selectedDate || !selectedTime || !selectedLocation || bookingLoading}
              className="flex-1"
            >
              {bookingLoading ? (
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
              onClick={onCancel}
              disabled={bookingLoading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}