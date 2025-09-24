'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Car, CreditCard, Calendar, Star, AlertTriangle,
 Award,  Phone, Mail, ArrowRight, Loader2, CheckCircle2,
  Shield, Lock, Trophy, Target,
} from 'lucide-react';
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
import { QuotaIndicator } from '@/components/QuotaIndicator';
import { parsePaymentError, formatPaymentErrorMessage } from '@/lib/payment-utils';

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [quota, setQuota] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('packages');
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const { user, isSignedIn } = useUser();

  const handlePurchaseQuota = async (packageId: string, paymentMethod: string = 'payid') => {
    if (!isSignedIn) {
      window.location.href = '/sign-in';
      return;
    }

    setPurchasing(true);
    setPaymentError(null);
    
    try {
      // For manual payment methods
      if (['tyro', 'bpay', 'payid'].includes(paymentMethod)) {
        // Handle manual payment method
        const response = await fetch('/api/create-quota-checkout-enhanced', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            packageId,
            acceptedTerms: true,
            paymentGateway: paymentMethod
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.details || data.error || `HTTP ${response.status}`);
        }

        // Redirect to manual payment page
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error('No payment URL received');
        }
        return;
      }

      // For standard payment gateway
      const response = await fetch('/api/create-quota-checkout-enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          packageId,
          acceptedTerms: true,
          paymentGateway: paymentMethod
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || `HTTP ${response.status}`);
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      
      // Parse and format the error message
      const parsedError = parsePaymentError(error);
      const formattedMessage = formatPaymentErrorMessage(parsedError);
      
      setPaymentError(formattedMessage);
      
      // Show alert only for unrecoverable errors
      if (!parsedError.recoverable) {
        alert(`Checkout failed: ${formattedMessage}`);
      }
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

        console.log('Packages fetch result:', { data, error });

        if (error) {
          console.error('Error fetching packages:', error);
        } else if (data && data.length > 0) {
          console.log('Setting packages:', data);
          setPackages(data as Package[]);
          setSelectedPackage(data[0].id);
          console.log('Selected package ID:', data[0].id);
        } else {
          console.log('No packages found in database');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <Badge className="mb-6 bg-white/20 text-white border-white/30 hover:bg-white/30">
              <Star className="h-4 w-4 mr-2" />
              Australia's Premier Driving School
            </Badge>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Master the Road
            </h1>

            <p className="text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto mb-8 leading-relaxed">
              Professional driving lessons with experienced instructors. Choose your package and start your journey to confident driving.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">500+</div>
                <div className="text-blue-200 text-sm">Students Trained</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">95%</div>
                <div className="text-blue-200 text-sm">Pass Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">15+</div>
                <div className="text-blue-200 text-sm">Years Experience</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">4.9★</div>
                <div className="text-blue-200 text-sm">Average Rating</div>
              </div>
            </div>

            {/* Quota Indicator */}
            {isSignedIn && quota && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="inline-block mb-6"
              >
                <div className="bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20">
                  <QuotaIndicator />
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Success Alert */}
          <AnimatePresence>
            {bookingSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-2xl mx-auto mt-6"
              >
                <Alert className="bg-green-500/20 border-green-400 text-white backdrop-blur-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>{bookingSuccess}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Main Content */}
      <main className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-center mb-12">
              <TabsList className="grid w-full max-w-md grid-cols-2 bg-white shadow-lg border-0 p-1 rounded-2xl">
                <TabsTrigger
                  value="packages"
                  className="flex items-center gap-2 rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-300"
                >
                  <CreditCard className="h-4 w-4" />
                  <span className="hidden sm:inline">Purchase Packages</span>
                  <span className="sm:hidden">Packages</span>
                </TabsTrigger>
                <TabsTrigger
                  value="booking"
                  className="flex items-center gap-2 rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-300"
                >
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Book Lessons</span>
                  <span className="sm:hidden">Booking</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="packages" className="space-y-16">
              {loading ? (
                // Enhanced Loading skeleton
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="h-[500px] animate-pulse">
                      <CardHeader>
                        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-12 bg-gray-200 rounded w-1/2 mb-4"></div>
                        <div className="space-y-2">
                          {[1, 2, 3, 4].map((j) => (
                            <div key={j} className="h-4 bg-gray-200 rounded"></div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-16">
                  {/* Package Cards */}
                  <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {packages.map((pkg, index) => (
                      <motion.div
                        key={pkg.id}
                        variants={itemVariants}
                        whileHover={{ y: -8 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card
                          className={`h-full flex flex-col cursor-pointer transition-all duration-300 group relative overflow-hidden ${selectedPackage === pkg.id
                              ? 'ring-2 ring-blue-500 shadow-2xl bg-white'
                              : 'hover:shadow-xl bg-white hover:ring-1 hover:ring-blue-200'
                            } ${pkg.popular ? 'border-2 border-gradient-to-r from-blue-500 to-purple-600' : ''}`}
                          onClick={() => setSelectedPackage(pkg.id)}
                        >
                          {pkg.popular && (
                            <div className="absolute -top-1 -right-1">
                              <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 rounded-bl-lg rounded-tr-lg px-3 py-1">
                                <Trophy className="h-3 w-3 mr-1" />
                                Most Popular
                              </Badge>
                            </div>
                          )}

                          <CardHeader className="pb-4 relative">
                            <div className="flex items-center justify-between mb-2">
                              <CardTitle className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {pkg.name}
                              </CardTitle>
                              {selectedPackage === pkg.id && (
                                <CheckCircle2 className="h-6 w-6 text-blue-600" />
                              )}
                            </div>
                            <CardDescription className="text-gray-600 leading-relaxed">
                              {pkg.description}
                            </CardDescription>
                          </CardHeader>

                          <CardContent className="flex-grow space-y-6">
                            <div className="text-center">
                              <div className="flex items-baseline justify-center">
                                <span className="text-5xl font-bold text-gray-900">${pkg.price.toFixed(0)}</span>
                                <span className="text-gray-500 ml-2">AUD</span>
                              </div>
                              <div className="mt-2 flex items-center justify-center text-blue-600 font-semibold bg-blue-50 py-2 px-4 rounded-full">
                                <Clock className="h-4 w-4 mr-2" />
                                {pkg.hours} hours included
                              </div>
                            </div>

                            <ul className="space-y-3">
                              {pkg.features.map((feature, featureIndex) => (
                                <li key={featureIndex} className="flex items-start">
                                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 shrink-0 mt-0.5" />
                                  <span className="text-gray-700 text-sm leading-relaxed">{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>

                          <CardFooter className="pt-6">
                            <Button
                              className={`w-full transition-all duration-300 ${selectedPackage === pkg.id
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                                  : pkg.popular
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900 hover:text-blue-600'
                                }`}
                              size="lg"
                            >
                              {selectedPackage === pkg.id ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Selected Package
                                </>
                              ) : (
                                <>
                                  Select Package
                                  <ArrowRight className="h-4 w-4 ml-2" />
                                </>
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
                      className="bg-gradient-to-br from-white to-blue-50 rounded-3xl p-8 md:p-12 shadow-2xl border border-blue-100"
                    >
                      <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                          <Badge className="mb-4 bg-blue-100 text-blue-800 border-blue-200">
                            <Target className="h-4 w-4 mr-2" />
                            Selected Package
                          </Badge>
                          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            {selectedPackageDetails.name}
                          </h2>
                          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            {selectedPackageDetails.description}
                          </p>
                        </div>

                        {/* Features Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                          <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Clock className="h-8 w-8 text-blue-600" />
                            </div>
                            <div className="text-3xl font-bold text-gray-900 mb-2">{selectedPackageDetails.hours}</div>
                            <div className="text-gray-600">Hours of Professional Instruction</div>
                          </div>

                          <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Car className="h-8 w-8 text-green-600" />
                            </div>
                            <div className="text-3xl font-bold text-gray-900 mb-2">Dual Control</div>
                            <div className="text-gray-600">Modern Vehicle with Safety Features</div>
                          </div>

                          <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Award className="h-8 w-8 text-purple-600" />
                            </div>
                            <div className="text-3xl font-bold text-gray-900 mb-2">Licensed</div>
                            <div className="text-gray-600">Queensland Transport Approved</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                          {/* Package Features */}
                          <div className="space-y-6">
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">What's Included</h3>
                            <div className="space-y-4">
                              {selectedPackageDetails.features.map((feature, index) => (
                                <div key={index} className="flex items-start p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                                  <CheckCircle2 className="h-6 w-6 text-green-500 mr-4 shrink-0 mt-0.5" />
                                  <span className="text-gray-700 font-medium">{feature}</span>
                                </div>
                              ))}
                            </div>

                            {/* Trust Signals */}
                            <div className="mt-8">
                              <h4 className="text-lg font-semibold text-gray-900 mb-4">Security & Trust</h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center p-3 bg-green-50 rounded-lg">
                                  <Shield className="h-5 w-5 text-green-600 mr-2" />
                                  <span className="text-sm font-medium text-green-800">SSL Secured</span>
                                </div>
                                <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                                  <Lock className="h-5 w-5 text-blue-600 mr-2" />
                                  <span className="text-sm font-medium text-blue-800">PCI Compliant</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Checkout Section */}
                          <div className="space-y-6">
                            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                              <h3 className="text-2xl font-bold text-gray-900 mb-6">Complete Your Purchase</h3>

                              {/* Price Display */}
                              <div className="text-center mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                                <div className="text-5xl font-bold text-gray-900 mb-2">
                                  ${selectedPackageDetails.price.toFixed(0)}
                                </div>
                                <div className="text-gray-600">One-time payment • No hidden fees</div>
                              </div>

                              {/* Checkout Button */}
                              <Button
                                size="lg"
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 text-lg py-6"
                                onClick={() => handlePurchaseQuota(selectedPackageDetails.id, 'payid')}
                                disabled={purchasing}
                              >
                                {purchasing ? (
                                  <>
                                    <Loader2 className="animate-spin h-5 w-5 mr-3" />
                                    Processing Payment...
                                  </>
                                ) : (
                                  <>
                                    <CreditCard className="mr-3 h-5 w-5" />
                                    Purchase with PayID
                                  </>
                                )}
                              </Button>

                              {/* Security Notice */}
                              <div className="mt-6 text-center text-sm text-gray-600 space-y-2">
                                <div className="flex items-center justify-center">
                                  <Shield className="h-4 w-4 text-green-500 mr-2" />
                                  <span>Secured by 256-bit SSL encryption</span>
                                </div>
                                <div>Hours added to your account immediately after payment</div>
                              </div>

                              {/* Contact Support */}
                              <div className="mt-8 p-4 bg-gray-50 rounded-xl text-center">
                                <div className="text-sm font-medium text-gray-900 mb-2">Need Help?</div>
                                <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
                                  <div className="flex items-center">
                                    <Phone className="h-4 w-4 mr-1" />
                                    <span>(07) 1234 5678</span>
                                  </div>
                                  <div className="flex items-center">
                                    <Mail className="h-4 w-4 mr-1" />
                                    <span>support@egdriving.com</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="booking" className="space-y-12">
              <div className="space-y-12">
                {/* Header */}
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Calendar className="h-10 w-10 text-blue-600" />
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Book Your Lessons</h3>
                  <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                    Schedule your driving lessons using our integrated Google Calendar system.
                    Select available time slots that work best for your schedule.
                  </p>
                </div>

                {/* Quota Status */}
                {isSignedIn && quota && (
                  <div className="max-w-4xl mx-auto">
                    <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-0 shadow-lg">
                      <CardContent className="p-8">
                        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <Clock className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="text-xl font-semibold text-gray-900">Available Lesson Hours</h4>
                              <p className="text-gray-600">Ready to book your next lesson</p>
                            </div>
                          </div>
                          <div className="text-center md:text-right">
                            <div className="text-4xl font-bold text-blue-600 mb-1">{quota.remaining_hours}</div>
                            <div className="text-gray-500 font-medium">hours remaining</div>
                          </div>
                        </div>

                        {quota.remaining_hours === 0 && (
                          <Alert className="mt-6 border-orange-200 bg-orange-50">
                            <AlertTriangle className="h-5 w-5 text-orange-600" />
                            <AlertDescription className="text-orange-800 font-medium">
                              You have no remaining lesson hours. Please purchase a package above to continue booking lessons.
                            </AlertDescription>
                          </Alert>
                        )}

                        {quota.remaining_hours > 0 && quota.remaining_hours <= 2 && (
                          <Alert className="mt-6 border-yellow-200 bg-yellow-50">
                            <Clock className="h-5 w-5 text-yellow-600" />
                            <AlertDescription className="text-yellow-800 font-medium">
                              You're running low on lesson hours. Consider purchasing additional hours to continue your learning journey.
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Calendar Integration */}
                <div className="max-w-7xl mx-auto">
                  <Card className="shadow-2xl border-0 overflow-hidden">
                    <CardContent className="p-0">
                      <GoogleCalendarIntegration
                        onBookingComplete={handleBookingComplete}
                        userQuota={quota}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Terms & Conditions Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
        </div>
      </section>
    </div>
  );
}