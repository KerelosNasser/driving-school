'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, addDays, isAfter, isBefore } from 'date-fns';
import { Calendar, CheckCircle, ArrowRight, AlertCircle, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import type { Package } from '@/lib/supabase';
import GoogleCalendarIntegration from './GoogleCalendarIntegration';
import BufferTimeManager from './BufferTimeManager';

interface UserQuota {
  user_id: string;
  total_hours: number;
  used_hours: number;
  remaining_hours: number;
  created_at: string;
  updated_at: string;
}

interface QuotaManagementTabProps {
  quota: UserQuota | null;
  onQuotaUpdate: () => void;
}

// Available time slots
const timeSlots = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
];

// Brisbane suburbs
const brisbaneSuburbs = [
  'Brisbane CBD', 'South Brisbane', 'West End', 'Fortitude Valley', 'New Farm', 
  'Paddington', 'Milton', 'Toowong', 'St Lucia', 'Indooroopilly', 'Kelvin Grove',
  'Chermside', 'Carindale', 'Mount Gravatt', 'Sunnybank', 'Wynnum', 'Sandgate', 'The Gap'
];

export default function QuotaManagementTab({ quota, onQuotaUpdate }: QuotaManagementTabProps) {
  const router = useRouter();
  const [packages, setPackages] = useState<Package[]>([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userStatistics, setUserStatistics] = useState<any>(null);
  
  // Booking form state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [lessonHours, setLessonHours] = useState<number>(1);
  const [lessonType, setLessonType] = useState<string>('standard');
  const [notes, setNotes] = useState('');
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingMode, setBookingMode] = useState<'traditional' | 'google'>('traditional');
  const [bufferSettings, setBufferSettings] = useState(null);
  const [existingBookings, setExistingBookings] = useState([]);

  // Minimum date is tomorrow
  const minDate = addDays(new Date(), 1);
  // Maximum date is 3 months from now
  const maxDate = addDays(new Date(), 90);
  
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const { data, error } = await supabase
          .from('packages')
          .select('*')
          .order('price', { ascending: true });
        
        if (error) {
          console.error('Error fetching packages:', error);
        } else if (data) {
          setPackages(data as Package[]);
        }
      } catch (error) {
        console.error('Error in packages fetch:', error);
      }
    };

    fetchPackages();
  }, []);

  // Fetch user data for auto-population
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/user');
        const data = await response.json();
        
        if (response.ok && data.statistics?.recentActivity?.preferredLocation) {
          setSelectedLocation(data.statistics.recentActivity.preferredLocation);
          setUserStatistics(data.statistics);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };

    fetchUserData();
  }, []);

  // Handle lesson booking
  const handleBookLesson = async () => {
    if (!selectedDate || !selectedTime || !selectedLocation || !lessonHours) {
      setError('Please fill in all required fields');
      return;
    }

    if (!quota || quota.remaining_hours < lessonHours) {
      setError(`Insufficient quota. You have ${quota?.remaining_hours || 0} hours remaining.`);
      return;
    }

    setBookingLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // First create the booking record
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: quota.user_id,
          package_id: null, // No package since using quota
          date: format(selectedDate, 'yyyy-MM-dd'),
          time: selectedTime,
          location: selectedLocation,
          status: 'pending',
          hours_used: lessonHours,
          notes: notes || null
        })
        .select()
        .single();

      if (bookingError) {
        throw new Error(bookingError.message);
      }

      // Then consume the quota
      const consumeResponse = await fetch('/api/quota/consume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hours: lessonHours,
          booking_id: booking.id,
          description: `Booked ${lessonHours} hour lesson on ${format(selectedDate, 'MMM dd, yyyy')} at ${selectedTime}`
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

      setSuccess(`Lesson booked successfully! ${lessonHours} hours have been deducted from your quota.`);
      setShowBookingForm(false);
      
      // Reset form
      setSelectedDate(undefined);
      setSelectedTime(null);
      setSelectedLocation(null);
      setLessonHours(1);
      setNotes('');
      
      // Refresh quota
      onQuotaUpdate();
      
    } catch (err) {
      console.error('Error booking lesson:', err);
      setError(err instanceof Error ? err.message : 'Failed to book lesson');
    } finally {
      setBookingLoading(false);
    }
  };

  // Handle package purchase (redirect to existing booking flow)
  const handlePurchasePackage = (packageId: string) => {
    router.push(`/packages?selected=${packageId}`);
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Book a Lesson */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Book a Lesson</span>
            </CardTitle>
            <CardDescription>
              Use your quota hours to book driving lessons
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
              
              {!showBookingForm ? (
                <Button 
                  onClick={() => setShowBookingForm(true)}
                  className="w-full"
                  disabled={!quota || quota.remaining_hours <= 0}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Book New Lesson
                </Button>
              ) : (
                <Tabs value={bookingMode} onValueChange={(value) => setBookingMode(value as 'traditional' | 'google')} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="traditional">Traditional Booking</TabsTrigger>
                    <TabsTrigger value="google">Google Calendar</TabsTrigger>
                  </TabsList>

                  <TabsContent value="traditional" className="space-y-4 mt-4">
                    <BufferTimeManager
                      onSettingsChange={setBufferSettings}
                      existingBookings={existingBookings}
                      proposedBooking={selectedDate && selectedTime ? {
                        start: `${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}:00`,
                        end: `${format(selectedDate, 'yyyy-MM-dd')}T${String(parseInt(selectedTime.split(':')[0]) + lessonHours).padStart(2, '0')}:${selectedTime.split(':')[1]}:00`,
                        type: lessonType
                      } : undefined}
                    />

                <div className="space-y-4">
                  {/* Lesson Type Selection */}
                  <div>
                    <Label htmlFor="lesson-type">Lesson Type</Label>
                    <Select value={lessonType} onValueChange={setLessonType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select lesson type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard Lesson</SelectItem>
                        <SelectItem value="intensive">Intensive Training</SelectItem>
                        <SelectItem value="test_preparation">Test Preparation</SelectItem>
                        <SelectItem value="highway_driving">Highway Driving</SelectItem>
                        <SelectItem value="parking_practice">Parking Practice</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Lesson Hours Selection */}
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
                              <RadioGroupItem value={time} id={time} />
                              <Label htmlFor={time} className="text-sm">{time}</Label>
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
                      onClick={() => setShowBookingForm(false)}
                      disabled={bookingLoading}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
                  </TabsContent>

                  <TabsContent value="google" className="mt-4">
                    <GoogleCalendarIntegration
                      onBookingComplete={(bookingData) => {
                        setSuccess(`Lesson booked successfully via Google Calendar for ${format(new Date(bookingData.start), 'MMM dd, yyyy at HH:mm')}`);
                        onQuotaUpdate();
                      }}
                      onError={(error) => setError(error)}
                      userQuota={quota}
                      bufferSettings={bufferSettings}
                    />
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Purchase More Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Purchase More Hours</span>
            </CardTitle>
            <CardDescription>
              Buy lesson packages to add hours to your quota
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {packages.length > 0 ? (
                packages.slice(0, 2).map((pkg) => (
                  <div key={pkg.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{pkg.name}</h4>
                      <Badge variant="outline">{pkg.hours} hours</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{pkg.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-blue-600">
                        ${pkg.price}
                      </span>
                      <Button 
                        size="sm" 
                        onClick={() => handlePurchasePackage(pkg.id)}
                      >
                        Purchase
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Loading packages...</p>
                </div>
              )}
              
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => router.push('/packages')}
              >
                View All Packages
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}