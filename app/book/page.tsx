'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { format, addDays, isAfter, isBefore } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TermsAcceptanceDialog } from '@/components/ui/terms-acceptance-dialog';
import { SignInButton } from '@clerk/nextjs';
import { Calendar as CalendarIcon, Clock, MapPin, Car, CheckCircle, ArrowRight, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Package } from '@/lib/supabase';
import { geocodeAddress, isInServiceArea } from '@/lib/geocoding';

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

export default function BookingPage() {
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();
  
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState(1);
  const [bookingSubmitted, setBookingSubmitted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(true);
  
  // Minimum date is tomorrow
  const minDate = addDays(new Date(), 1);
  // Maximum date is 3 months from now
  const maxDate = addDays(new Date(), 90);
  
  // Fetch packages from Supabase
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const { data, error } = await supabase
          .from('packages')
          .select('*')
          .order('price', { ascending: true });
        
        if (error) {
          console.error('Error fetching packages:', error);
          // Fallback to static data if there's an error
          setPackages(fallbackPackages);
        } else if (data && data.length > 0) {
          setPackages(data as Package[]);
        } else {
          // Use fallback data if no packages are found
          setPackages(fallbackPackages);
        }
      } catch (error) {
        console.error('Error in packages fetch:', error);
        setPackages(fallbackPackages);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fallback package data in case the Supabase fetch fails
  const fallbackPackages: Package[] = [
    {
      id: '1',
      name: 'Starter Package',
      description: 'Perfect for beginners who are just starting their driving journey',
      price: 299.99,
      hours: 5,
      features: ['5 hours of driving lessons', 'Personalized instruction', 'Flexible scheduling'],
      popular: false,
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Standard Package',
      description: 'Our most popular package for learners with some experience',
      price: 499.99,
      hours: 10,
      features: ['10 hours of driving lessons', 'Personalized instruction', 'Flexible scheduling', 'Test preparation'],
      popular: true,
      created_at: new Date().toISOString()
    },
    {
      id: '3',
      name: 'Premium Package',
      description: 'Comprehensive package for complete preparation',
      price: 799.99,
      hours: 20,
      features: ['20 hours of driving lessons', 'Personalized instruction', 'Flexible scheduling', 'Test preparation', 'Mock driving test', 'Pick-up and drop-off service'],
      popular: false,
      created_at: new Date().toISOString()
    }
  ];

  // Get the selected package details
  const selectedPackageDetails = packages.find(pkg => pkg.id === selectedPackage);

  // Function to handle form submission
  const handleSubmit = async () => {
    if (!user || !selectedPackage || !selectedDate || !selectedTime || !selectedLocation || !selectedPackageDetails) {
      return;
    }

    try {
      setLoading(true);
      
      // Format date and time
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      // Validate location is in service area
      const geoResult = await geocodeAddress(selectedLocation);
      if (geoResult && !isInServiceArea(geoResult.lat, geoResult.lng)) {
        alert('Sorry, the selected location is outside our service area. Please choose a different location.');
        setLoading(false);
        return;
      }
      
      // Create Stripe checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId: selectedPackage,
          packageName: selectedPackageDetails.name,
          price: selectedPackageDetails.price,
          bookingDetails: {
            userId: user.id,
            userName: user.fullName || user.firstName || '',
            userEmail: user.primaryEmailAddress?.emailAddress || '',
            date: dateStr,
            time: selectedTime,
            location: selectedLocation,
            hours: selectedPackageDetails.hours,
            notes: notes,
            latitude: geoResult?.lat,
            longitude: geoResult?.lng,
          },
        }),
      });
      
      const { sessionId, url, error } = await response.json();
      
      if (error) {
        console.error('Error creating checkout session:', error);
        alert('There was an error processing your payment. Please try again.');
      } else if (url) {
        // Save booking to Supabase with pending status
        const { error: bookingError } = await supabase
          .from('bookings')
          .insert([
            {
              user_id: user.id,
              package_id: selectedPackage,
              date: dateStr,
              time: selectedTime,
              status: 'pending_payment',
              notes: notes,
              stripe_session_id: sessionId,
            }
          ])
          .select();
        
        if (bookingError) {
          console.error('Error saving booking:', bookingError);
        }
        
        // Redirect to Stripe checkout
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error in booking submission:', error);
      alert('There was an error creating your booking. Please try again.');
      setLoading(false);
    }
  };

  // Function to check if a time slot is available
  const isTimeSlotAvailable = (_time?: string) => {
    // In a real implementation, we would check against existing bookings
    // For now, we'll just return true for all time slots
    return true;
  };

  // Terms acceptance handlers
  const handleTermsAccept = () => {
    setTermsAccepted(true);
    setShowTermsDialog(false);
  };

  const handleTermsDecline = () => {
    // Redirect to packages page if user declines terms
    router.push('/packages');
  };

  // If user data is still loading, show loading state
  if (!isUserLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Terms & Conditions Acceptance Dialog */}
      <TermsAcceptanceDialog
        open={showTermsDialog && !termsAccepted}
        onAccept={handleTermsAccept}
        onDecline={handleTermsDecline}
      />
      
      {/* Main booking content - only show if terms are accepted */}
      <div className={`min-h-screen bg-background ${!termsAccepted ? 'pointer-events-none opacity-50' : ''}`}>
      
      <main>
        {/* Hero Section */}
        <section className="bg-yellow-600 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl font-bold mb-4">
                Book Your Driving Lesson
              </h1>
              <p className="text-xl text-yellow-100 max-w-3xl mx-auto">
                Select your package, choose a date and time, and get ready to start your driving journey
              </p>
            </motion.div>
          </div>
        </section>

        {/* Booking Form Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {bookingSubmitted ? (
              // Booking Success
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-xl p-8 shadow-lg text-center"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking Successful!</h2>
                <p className="text-gray-600 mb-6">
                  Your booking has been submitted successfully. We&apos;ll send you a confirmation email shortly.
                </p>
                <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
                  <h3 className="font-medium text-gray-900 mb-2">Booking Details:</h3>
                  <div className="space-y-2 text-gray-600">
                    <p><span className="font-medium">Package:</span> {selectedPackageDetails?.name}</p>
                    <p><span className="font-medium">Date:</span> {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : ''}</p>
                    <p><span className="font-medium">Time:</span> {selectedTime}</p>
                    <p><span className="font-medium">Location:</span> {selectedLocation}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    onClick={() => router.push('/')}
                    variant="outline"
                  >
                    Return to Home
                  </Button>
                  <Button 
                    size="lg" 
                    onClick={() => {
                      setBookingSubmitted(false);
                      setStep(1);
                      setSelectedPackage(null);
                      setSelectedDate(undefined);
                      setSelectedTime(null);
                      setSelectedLocation(null);
                      setNotes('');
                    }}
                  >
                    Book Another Lesson
                  </Button>
                </div>
              </motion.div>
            ) : !user ? (
              // Not logged in
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-xl p-8 shadow-lg text-center"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign In to Book a Lesson</h2>
                <p className="text-gray-600 mb-8">
                  Please sign in or create an account to book a driving lesson.
                </p>
                <SignInButton mode="modal">
                  <Button size="lg">
                    Sign In to Continue
                  </Button>
                </SignInButton>
              </motion.div>
            ) : (
              // Booking Form
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Progress Steps */}
                <div className="bg-gray-50 px-6 py-4 border-b">
                  <div className="flex justify-between">
                    <div className={`flex items-center ${step >= 1 ? 'text-yellow-600' : 'text-gray-400'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                        step >= 1 ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-200 text-gray-400'
                      }`}>
                        1
                      </div>
                      <span className="hidden sm:inline font-medium">Select Package</span>
                    </div>
                    <div className={`flex items-center ${step >= 2 ? 'text-yellow-600' : 'text-gray-400'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                        step >= 2 ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-200 text-gray-400'
                      }`}>
                        2
                      </div>
                      <span className="hidden sm:inline font-medium">Choose Date & Time</span>
                    </div>
                    <div className={`flex items-center ${step >= 3 ? 'text-yellow-600' : 'text-gray-400'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                        step >= 3 ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-200 text-gray-400'
                      }`}>
                        3
                      </div>
                      <span className="hidden sm:inline font-medium">Confirm Details</span>
                    </div>
                  </div>
                </div>
                
                {/* Step 1: Select Package */}
                {step === 1 && (
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Select a Package</h2>
                    
                    {loading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="bg-gray-100 h-24 rounded-lg animate-pulse"></div>
                        ))}
                      </div>
                    ) : (
                      <RadioGroup value={selectedPackage || ''} onValueChange={setSelectedPackage}>
                        <div className="space-y-4">
                          {packages.map((pkg) => (
                            <div
                              key={pkg.id}
                              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                                selectedPackage === pkg.id 
                                  ? 'border-yellow-500 bg-yellow-50' 
                                  : 'border-gray-200 hover:border-yellow-200'
                              }`}
                              onClick={() => setSelectedPackage(pkg.id)}
                            >
                              <div className="flex items-start">
                                <RadioGroupItem value={pkg.id} id={pkg.id} className="mt-1" />
                                <div className="ml-3 flex-grow">
                                  <div className="flex justify-between">
                                    <Label htmlFor={pkg.id} className="text-lg font-medium cursor-pointer">
                                      {pkg.name}
                                    </Label>
                                    <div className="font-bold text-lg">${pkg.price.toFixed(0)}</div>
                                  </div>
                                  <p className="text-gray-600 mt-1">{pkg.description}</p>
                                  <div className="text-sm text-yellow-600 mt-2">{pkg.hours} hours of driving lessons</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    )}
                    
                    <div className="mt-8 flex justify-end">
                      <Button 
                        size="lg" 
                        disabled={!selectedPackage}
                        onClick={() => setStep(2)}
                      >
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Step 2: Choose Date & Time */}
                {step === 2 && (
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose Date & Time</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Calendar */}
                      <div>
                        <Label className="block mb-2">Select a Date</Label>
                        <div className="border rounded-lg p-4">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            disabled={(date) => 
                              isBefore(date, minDate) || 
                              isAfter(date, maxDate) || 
                              date.getDay() === 0 // Disable Sundays
                            }
                            className="mx-auto"
                          />
                        </div>
                      </div>
                      
                      {/* Time Slots */}
                      <div>
                        <Label className="block mb-2">Select a Time</Label>
                        <div className="border rounded-lg p-4 h-full">
                          {selectedDate ? (
                            <div className="grid grid-cols-2 gap-2">
                              {timeSlots.map((time) => {
                                const available = isTimeSlotAvailable(time);
                                return (
                                  <button
                                    key={time}
                                    className={`p-3 rounded-lg text-center transition-colors ${
                                      !available 
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                        : selectedTime === time
                                          ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                                          : 'bg-white border border-gray-200 hover:border-yellow-300 text-gray-700'
                                    }`}
                                    onClick={() => available && setSelectedTime(time)}
                                    disabled={!available}
                                  >
                                    {time}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center text-gray-500">
                              <CalendarIcon className="h-5 w-5 mr-2" />
                              <span>Please select a date first</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-8">
                      <Label className="block mb-2">Pick-up Location</Label>
                      <Select value={selectedLocation || ''} onValueChange={setSelectedLocation}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a suburb" />
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
                    
                    <div className="mt-8 flex justify-between">
                      <Button 
                        variant="outline" 
                        onClick={() => setStep(1)}
                      >
                        Back
                      </Button>
                      <Button 
                        size="lg" 
                        disabled={!selectedDate || !selectedTime || !selectedLocation}
                        onClick={() => setStep(3)}
                      >
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Step 3: Confirm Details */}
                {step === 3 && selectedPackageDetails && (
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Confirm Your Booking</h2>
                    
                    <div className="bg-gray-50 rounded-lg p-6 mb-6">
                      <h3 className="font-medium text-gray-900 mb-4">Booking Summary</h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-start">
                          <Car className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 shrink-0" />
                          <div>
                            <div className="font-medium">{selectedPackageDetails.name}</div>
                            <div className="text-gray-600">{selectedPackageDetails.hours} hours of driving lessons</div>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <CalendarIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 shrink-0" />
                          <div>
                            <div className="font-medium">Date</div>
                            <div className="text-gray-600">
                              {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : ''}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <Clock className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 shrink-0" />
                          <div>
                            <div className="font-medium">Time</div>
                            <div className="text-gray-600">{selectedTime}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <MapPin className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 shrink-0" />
                          <div>
                            <div className="font-medium">Pick-up Location</div>
                            <div className="text-gray-600">{selectedLocation}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="flex justify-between font-medium">
                          <span>Total</span>
                          <span>${selectedPackageDetails.price.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <Label htmlFor="notes" className="block mb-2">Additional Notes (Optional)</Label>
                      <textarea
                        id="notes"
                        className="w-full p-3 border border-gray-300 rounded-md"
                        rows={3}
                        placeholder="Any special requests or information for your instructor"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      ></textarea>
                    </div>
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start">
                      <Info className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 shrink-0" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium">Payment Information</p>
                        <p className="mt-1">
                          You&apos;ll be redirected to our secure payment page after confirming your booking.
                          Your lesson will be confirmed once payment is complete.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <Button 
                        variant="outline" 
                        onClick={() => setStep(2)}
                      >
                        Back
                      </Button>
                      <Button 
                        size="lg" 
                        onClick={handleSubmit}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            Confirm Booking
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
    </>
  );
}