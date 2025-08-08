'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, ArrowRight, ShieldCheck, Clock, Calendar, Car } from 'lucide-react';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import type { Package } from '@/lib/supabase';

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

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
          // Set the first package as selected by default
          setSelectedPackage(data[0].id);
        } else {
          // Use fallback data if no packages are found
          setPackages(fallbackPackages);
          setSelectedPackage(fallbackPackages[0].id);
        }
      } catch (error) {
        console.error('Error in packages fetch:', error);
        setPackages(fallbackPackages);
        setSelectedPackage(fallbackPackages[0].id);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
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
    },
    {
      id: '4',
      name: 'Test Day Package',
      description: 'For students who just need preparation for their driving test',
      price: 199.99,
      hours: 3,
      features: ['3 hours of driving lessons', 'Test route practice', 'Last-minute tips and tricks', 'Use of instructor\'s vehicle for test'],
      popular: false,
      created_at: new Date().toISOString()
    },
    {
      id: '5',
      name: 'Refresher Package',
      description: 'For licensed drivers who need to brush up on their skills',
      price: 249.99,
      hours: 4,
      features: ['4 hours of driving lessons', 'Focus on specific skills', 'Confidence building', 'Flexible scheduling'],
      popular: false,
      created_at: new Date().toISOString()
    }
  ];

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
    <div className="min-h-screen bg-background">
      <main>
        {/* Hero Section */}
        <section className="bg-yellow-600 text-white py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Driving Lesson Packages
              </h1>
              <p className="text-xl text-yellow-100 max-w-3xl mx-auto">
                Choose the package that best suits your needs and start your journey to becoming a confident driver.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Packages Section */}
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {loading ? (
              // Loading skeleton
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="bg-gray-100 rounded-xl p-8 h-96 animate-pulse"></div>
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
                  {packages.map((pkg) => (
                    <motion.div key={pkg.id} variants={itemVariants}>
                      <Card 
                        className={`h-full flex flex-col cursor-pointer transition-all ${
                          selectedPackage === pkg.id 
                            ? 'ring-2 ring-yellow-500 shadow-lg transform scale-[1.02]' 
                            : 'hover:shadow-md'
                        } ${pkg.popular ? 'border-yellow-500' : ''}`}
                        onClick={() => setSelectedPackage(pkg.id)}
                      >
                        <CardHeader className="pb-4">
                          {pkg.popular && (
                            <Badge className="self-start mb-2 bg-yellow-500">Most Popular</Badge>
                          )}
                          <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                          <CardDescription>{pkg.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                          <div className="mb-6">
                            <span className="text-4xl font-bold">${pkg.price.toFixed(0)}</span>
                            <span className="text-gray-500 ml-1">/ package</span>
                          </div>
                          <div className="text-gray-700 mb-2 font-medium">
                            {pkg.hours} hours of driving lessons
                          </div>
                          <ul className="space-y-2 mt-4">
                            {pkg.features.map((feature, index) => (
                              <li key={index} className="flex items-start">
                                <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                        <CardFooter>
                          <Button 
                            className={`w-full ${
                              selectedPackage === pkg.id 
                                ? 'bg-yellow-600 hover:bg-yellow-700' 
                                : pkg.popular ? 'bg-yellow-600 hover:bg-yellow-700' : ''
                            }`}
                            onClick={() => setSelectedPackage(pkg.id)}
                          >
                            {selectedPackage === pkg.id ? 'Selected' : 'Select Package'}
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
                    className="bg-gray-50 rounded-xl p-8 shadow-md"
                  >
                    <div className="max-w-4xl mx-auto">
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">
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
                        
                        <div className="pt-4">
                          <Button size="lg" className="w-full md:w-auto" asChild>
                            <Link href="/book">
                              Book This Package
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">How do I book a driving lesson?</h3>
                <p className="text-gray-700">
                  You can book a driving lesson by selecting a package and clicking the &quot;Book This Package&quot; button. You&apos;ll be taken to our booking page where you can select your preferred date and time.
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Can I customize a package?</h3>
                <p className="text-gray-700">
                  Yes, we understand that everyone&apos;s learning journey is different. Contact us directly to discuss customizing a package that meets your specific needs.
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">What if I need to reschedule a lesson?</h3>
                <p className="text-gray-700">
                  We offer flexible rescheduling. Please provide at least 24 hours notice to avoid any cancellation fees. You can reschedule through your account or by contacting us directly.
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Do you offer gift certificates?</h3>
                <p className="text-gray-700">
                  Yes, all of our packages can be purchased as gift certificates. They make a great gift for new drivers! Contact us for more information.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-yellow-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Start Your Driving Journey?
            </h2>
            <p className="text-xl text-yellow-100 max-w-3xl mx-auto mb-8">
              Book your first lesson today and take the first step towards getting your license.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                size="lg" 
                className="bg-white text-yellow-700 hover:bg-yellow-50"
                asChild
              >
                <Link href="/book">
                  Book Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white text-white hover:bg-white/10"
                asChild
              >
                <Link href="/contact">
                  Contact Us
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}