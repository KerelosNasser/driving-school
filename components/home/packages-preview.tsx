'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Star, Calendar, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import type { Package } from '@/lib/types';
import { EditableText } from '@/components/ui/editable-text';

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

export function PackagesPreview() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await fetch('/api/packages');
        
        if (response.ok) {
          const data = await response.json();
          
          // Check if we have packages from the database
          if (data.packages && Array.isArray(data.packages) && data.packages.length > 0) {
            // Process and use database packages
            const processedPackages = data.packages.slice(0, 3).map((pkg: any) => ({
              ...pkg,
              features: Array.isArray(pkg.features) 
                ? pkg.features 
                : (typeof pkg.features === 'string' 
                  ? JSON.parse(pkg.features) 
                  : []) 
            })) as Package[];
            
            setPackages(processedPackages);
            setUsingFallback(false);
          } else {
            // No packages in database or empty array, use fallback
            console.log('No packages found in database, using fallback packages');
            setPackages(fallbackPackages);
            setUsingFallback(true);
          }
        } else {
          // API call failed, use fallback
          console.warn('Failed to fetch packages from API, using fallback packages');
          setPackages(fallbackPackages);
          setUsingFallback(true);
        }
      } catch (error) {
        console.error('Error fetching packages:', error);
        // On error, use fallback packages
        setPackages(fallbackPackages);
        setUsingFallback(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  return (
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-gray-50 to-emerald-50/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-teal-400 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <EditableText
            contentKey="packages_title"
            tagName="h2"
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-gray-900 via-emerald-800 to-teal-700 bg-clip-text text-transparent"
            placeholder="Enter packages title..."
          >
            Choose Your Package
          </EditableText>
          <EditableText
            contentKey="packages_subtitle"
            tagName="p"
            className="text-lg sm:text-xl text-gray-600 max-w-4xl mx-auto px-4 leading-relaxed"
            placeholder="Enter packages subtitle..."
            multiline={true}
          >
            Flexible packages designed to fit your learning style and budget
          </EditableText>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card className="animate-pulse bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl">
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg, index) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative group"
              >
                <Card 
                  className={`relative h-full flex flex-col transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 bg-white/90 backdrop-blur-sm rounded-2xl border-l-4 ${
                    pkg.popular 
                      ? 'border-l-emerald-500 shadow-xl transform scale-105 bg-gradient-to-br from-white to-emerald-50/50' 
                      : 'border-l-teal-400 hover:border-l-emerald-500 hover:bg-gradient-to-br hover:from-white hover:to-emerald-50/30'
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg flex items-center space-x-2">
                        <Star className="h-4 w-4 fill-current" />
                        <span>Most Popular</span>
                      </div>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-4 pt-8">
                    <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-emerald-800 transition-colors">{pkg.name}</CardTitle>
                    <CardDescription className="text-sm text-gray-600 leading-relaxed">{pkg.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="flex-grow text-center">
                    {/* Price Display */}
                    <div className="mb-6 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl">
                      <div className="flex items-baseline justify-center">
                        <span className="text-3xl font-bold text-emerald-700">${pkg.price.toFixed(0)}</span>
                        <span className="text-gray-500 ml-1 text-sm">total</span>
                      </div>
                      <div className="text-teal-600 font-medium mt-1 flex items-center justify-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{pkg.hours} driving hours included</span>
                      </div>
                    </div>

                    {/* Features List */}
                    <ul className="space-y-3 text-left">
                      {pkg.features.slice(0, 4).map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start text-sm">
                          <div className="bg-emerald-100 rounded-full p-1 mr-3 mt-0.5 flex-shrink-0">
                            <Check className="h-3 w-3 text-emerald-600" />
                          </div>
                          <span className="text-gray-700 leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  
                  <CardFooter className="pt-6">
                    <Button
                      className={`w-full font-bold py-4 text-lg rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 ${
                        pkg.popular 
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white hover:shadow-emerald-500/25' 
                          : 'bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white hover:shadow-gray-500/25'
                      }`}
                      asChild
                    >
                      <Link href="/packages">
                        Choose Package
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-12"
        >
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full translate-y-48 -translate-x-48"></div>
            </div>
            
            <div className="relative z-10">
              <EditableText
                contentKey="packages_cta_title"
                tagName="h3"
                className="text-2xl sm:text-3xl font-bold mb-4"
                placeholder="Enter CTA title..."
              >
                Need Help Choosing?
              </EditableText>
              <EditableText
                contentKey="packages_cta_subtitle"
                tagName="p"
                className="text-lg sm:text-xl text-emerald-100 mb-8 max-w-2xl mx-auto"
                placeholder="Enter CTA subtitle..."
                multiline={true}
              >
                Compare all packages and find the perfect fit for your learning journey.
              </EditableText>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-white text-emerald-600 hover:bg-emerald-50 font-bold px-8 py-4 text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                  asChild
                >
                  <Link href="/packages">
                    <Award className="h-5 w-5 mr-2" />
                    Compare All Packages
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white hover:text-emerald-600 font-bold px-8 py-4 text-lg rounded-2xl transition-all duration-300"
                  asChild
                >
                  <Link href="/contact">
                    Get Custom Quote
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      </section>
  );
}