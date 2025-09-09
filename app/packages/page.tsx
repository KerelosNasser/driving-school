'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, ShieldCheck, Clock, Car, CreditCard, Calendar, Star, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EditableTermsConditions } from '@/components/ui/editable-terms-conditions';
import { supabase } from '@/lib/supabase';
import { useUser } from '@clerk/nextjs';
import type { Package } from '@/lib/supabase';
import GoogleCalendarIntegration from '@/app/service-center/components/GoogleCalendarIntegration';
import {QuotaIndicator} from '@/components/QuotaIndicator';

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [quota, setQuota] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('packages');
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const { user, isSignedIn } = useUser();

  const handlePurchaseQuota = async (packageId: string) => {
    if (!isSignedIn) {
      window.location.href = '/sign-in';
      return;
    }

    setPurchasing(true);
    try {
      const response = await fetch('/api/create-quota-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ packageId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const fetchQuota = async () => {
    if (!isSignedIn) return;
    
    try {
      const response = await fetch('/api/quota');
      const data = await response.json();
      
      if (response.ok) {
        setQuota(data.quota);
      }
    } catch (error) {
      console.error('Error fetching quota:', error);
    }
  };

  const handleBookingComplete = (booking: any) => {
    setBookingSuccess(`Lesson booked successfully for ${booking.date}!`);
    fetchQuota(); // Refresh quota after booking
    setTimeout(() => setBookingSuccess(null), 5000);
  };

  // Fetch packages and quota from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from('packages')
          .select('*')
          .order('price', { ascending: true });
        
        if (error) {
          console.error('Error fetching packages:', error);
        } else if (data && data.length > 0) {
          setPackages(data as Package[]);
          setSelectedPackage(data[0].id);
        }
        
        // Fetch quota if user is signed in
        if (isSignedIn) {
          await fetchQuota();
        }
      } catch (error) {
        console.error('Error in data fetch:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isSignedIn]);

  // Listen for synchronization events from service center
  useEffect(() => {
    const handleQuotaUpdate = (event: CustomEvent) => {
      console.log('Quota updated from service center:', event.detail);
      fetchQuota(); // Refresh quota when service center makes changes
      if (event.detail?.type === 'booking') {
        setBookingSuccess(`Lesson booked successfully from Service Center!`);
        setTimeout(() => setBookingSuccess(null), 5000);
      }
    };

    const handleCalendarRefresh = () => {
      console.log('Calendar refresh requested from service center');
      fetchQuota(); // Refresh quota data
    };

    // Add event listeners
    window.addEventListener('quotaUpdated', handleQuotaUpdate as EventListener);
    window.addEventListener('refreshCalendar', handleCalendarRefresh);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('quotaUpdated', handleQuotaUpdate as EventListener);
      window.removeEventListener('refreshCalendar', handleCalendarRefresh);
    };
  }, []);


  // Get the selected package details
  const selectedPackageDetails = packages.find(pkg => pkg.id === selectedPackage) || packages[0];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50">
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-yellow-600 via-yellow-700 to-orange-600 text-white py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-8"
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Driving Packages & Booking
              </h1>
              <p className="text-xl text-yellow-100 max-w-4xl mx-auto mb-8">
                Purchase lesson packages and book directly through Google Calendar for seamless scheduling
              </p>
              
              {/* Quota Indicator */}
              {isSignedIn && quota && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="inline-block"
                >
                  <QuotaIndicator quota={quota} className="bg-white/10 backdrop-blur-sm" />
                </motion.div>
              )}
            </motion.div>
            
            {/* Success Alert */}
            {bookingSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl mx-auto mb-6"
              >
                <Alert className="bg-green-500/20 border-green-400 text-white">
                  <Check className="h-4 w-4" />
                  <AlertDescription>{bookingSuccess}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </div>
        </section>

        {/* Main Content with Tabs */}
        <section className="py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-white/80 backdrop-blur-sm">
                <TabsTrigger value="packages" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Purchase Packages
                </TabsTrigger>
                <TabsTrigger value="booking" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Book Lessons
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="packages" className="space-y-8">
                {loading ? (
                  // Loading skeleton
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="bg-white/60 rounded-xl p-8 h-96 animate-pulse"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-12">
                    {/* Package Cards */}
                    <motion.div 
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {packages.map((pkg) => (
                        <motion.div key={pkg.id} variants={itemVariants}>
                          <Card 
                            className={`h-full flex flex-col cursor-pointer transition-all backdrop-blur-sm ${
                              selectedPackage === pkg.id 
                                ? 'ring-2 ring-yellow-500 shadow-xl transform scale-[1.02] bg-white/90' 
                                : 'hover:shadow-lg bg-white/70 hover:bg-white/80'
                            } ${pkg.popular ? 'border-yellow-500 border-2' : 'border-white/20'}`}
                            onClick={() => setSelectedPackage(pkg.id)}
                          >
                            <CardHeader className="pb-4">
                              {pkg.popular && (
                                <Badge className="self-start mb-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                                  <Star className="h-3 w-3 mr-1" />
                                  Most Popular
                                </Badge>
                              )}
                              <CardTitle className="text-2xl text-gray-900">{pkg.name}</CardTitle>
                              <CardDescription className="text-gray-600">{pkg.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                              <div className="mb-6">
                                <span className="text-4xl font-bold text-gray-900">${pkg.price.toFixed(0)}</span>
                                <span className="text-gray-500 ml-1">/ package</span>
                              </div>
                              <div className="flex items-center text-yellow-700 mb-4 font-medium bg-yellow-50 p-2 rounded-lg">
                                <Clock className="h-4 w-4 mr-2" />
                                {pkg.hours} hours of driving lessons
                              </div>
                              <ul className="space-y-3 mt-4">
                                {pkg.features.map((feature, index) => (
                                  <li key={index} className="flex items-start">
                                    <Check className="h-5 w-5 text-green-500 mr-3 shrink-0 mt-0.5" />
                                    <span className="text-gray-700">{feature}</span>
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                            <CardFooter>
                              <Button 
                                className={`w-full transition-all ${
                                  selectedPackage === pkg.id 
                                    ? 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700' 
                                    : pkg.popular 
                                      ? 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700' 
                                      : 'bg-gray-600 hover:bg-gray-700'
                                }`}
                                onClick={() => setSelectedPackage(pkg.id)}
                              >
                                {selectedPackage === pkg.id ? (
                                  <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Selected
                                  </>
                                ) : (
                                  'Select Package'
                                )}
                              </Button>
                            </CardFooter>
                          </Card>
                        </motion.div>
                      ))}
                    </motion.div>

                {/* Selected Package Details */}
                {selectedPackageDetails && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-gray-50 rounded-xl p-8 shadow-md border-2 border-amber-400">
                    <div className="max-w-4xl mx-auto border-amber-400">
                      <h2 className="text-2xl font-bold text-gray-900 mb-6 ">
                        {selectedPackageDetails.name} Details
                      </h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                        <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-sm">
                          <Clock className="h-8 w-8 text-yellow-600 mb-3" />
                          <div className="text-2xl font-bold">{selectedPackageDetails.hours} Hours</div>
                          <div className="text-gray-600 text-center">Of professional driving instruction</div>
                        </div>
                        
                        <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-sm">
                          <Car className="h-8 w-8 text-yellow-600 mb-3" />
                          <div className="text-2xl font-bold">Dual Control</div>
                          <div className="text-gray-600 text-center">Modern vehicle with safety features</div>
                        </div>
                        
                        <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-sm">
                          <ShieldCheck className="h-8 w-8 text-yellow-600 mb-3" />
                          <div className="text-2xl font-bold">Licensed</div>
                          <div className="text-gray-600 text-center">Queensland Transport approved instructor</div>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Package Description</h3>
                          <p className="text-gray-700">
                            {selectedPackageDetails.description}. This package includes {selectedPackageDetails.hours} hours of professional driving instruction with our experienced instructor. All lessons are tailored to your specific needs and skill level.
                          </p>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">What&apos;s Included</h3>
                          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {selectedPackageDetails.features.map((feature, index) => (
                              <li key={index} className="flex items-start">
                                <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                                <span className="text-gray-700">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="pt-4 space-y-4">
                          <Button 
                            size="lg" 
                            className="w-full md:w-auto bg-yellow-600 hover:bg-yellow-700" 
                            onClick={() => handlePurchaseQuota(selectedPackageDetails.id)}
                            disabled={purchasing}
                          >
                            {purchasing ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Processing...
                              </>
                            ) : (
                              <>
                                <CreditCard className="mr-2 h-4 w-4" />
                                Purchase Hours - ${selectedPackageDetails.price.toFixed(0)}
                              </>
                            )}
                          </Button>
                          <div className="text-sm text-gray-600">
                            <p>✓ Hours will be added to your account immediately after payment</p>
                            <p>✓ Use hours to book lessons anytime through your <Link href="/service-center" className="text-yellow-600 hover:underline">Service Center</Link></p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
              </TabsContent>
              
              <TabsContent value="booking" className="space-y-8">
                {/* Book Lessons Tab Content */}
                <div className="space-y-8">
                  <div className="text-center">
                    <Calendar className="h-16 w-16 mx-auto mb-4 text-yellow-600" />
                    <h3 className="text-3xl font-bold mb-4 text-gray-900">Book Your Lessons</h3>
                    <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                      Schedule your driving lessons using our integrated Google Calendar system. 
                      Select available time slots that work best for your schedule.
                    </p>
                  </div>
                  
                  {/* Quota Check */}
                  {isSignedIn && quota && (
                    <div className="max-w-4xl mx-auto">
                      <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Clock className="h-6 w-6 text-blue-600" />
                              <div>
                                <h4 className="font-semibold text-gray-900">Available Lesson Hours</h4>
                                <p className="text-sm text-gray-600">You have {quota.remaining_hours} hours remaining</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-blue-600">{quota.remaining_hours}</div>
                              <div className="text-sm text-gray-500">hours left</div>
                            </div>
                          </div>
                          {quota.remaining_hours === 0 && (
                            <Alert className="mt-4 border-orange-200 bg-orange-50">
                              <AlertTriangle className="h-4 w-4 text-orange-600" />
                              <AlertDescription className="text-orange-800">
                                You have no remaining lesson hours. Please purchase a package to continue booking lessons.
                              </AlertDescription>
                            </Alert>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                  
                  {/* Google Calendar Integration */}
                  <div className="max-w-6xl mx-auto">
                    <GoogleCalendarIntegration 
                      onBookingComplete={handleBookingComplete}
                      userQuota={quota}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Terms & Conditions Section */}
        <EditableTermsConditions
          contentKey="packages_terms_conditions"
          page="packages"
          defaultTerms={[
            {
              id: '1',
              title: 'Booking and Payment',
              content: 'All lessons must be booked in advance. Payment is required at the time of booking. We accept all major credit cards and digital payment methods.'
            },
            {
              id: '2',
              title: 'Cancellation Policy',
              content: 'Lessons can be cancelled or rescheduled with at least 24 hours notice. Cancellations with less than 24 hours notice may incur a cancellation fee.'
            },
            {
              id: '3',
              title: 'Vehicle and Insurance',
              content: 'All lessons are conducted in fully insured, dual-control vehicles. Students must hold a valid learner\'s permit or provisional license.'
            },
            {
              id: '4',
              title: 'Instructor Policies',
              content: 'Our instructors are fully licensed and accredited. Lessons may be terminated early if the student is under the influence of alcohol or drugs, or exhibits unsafe behavior.'
            }
          ]}
        />
      </main>
    </div>
  );
}