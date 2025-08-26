'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, ArrowRight, ShieldCheck, Clock, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { EditableTermsConditions } from '@/components/ui/editable-terms-conditions';
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
        } else if (data && data.length > 0) {
          setPackages(data as Package[]);
          // Set the first package as selected by default
          setSelectedPackage(data[0].id);
        }
      } catch (error) {
        console.error('Error in packages fetch:', error);

      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
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
    <div className="min-h-screen bg-background">
      <main>
        {/* Hero Section */}
        <section className="bg-yellow-600 text-white py-8 md:py-12">
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
                Choose the package that best suits your needs and start your journey to becoming a
                confident driver.
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