'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import type { Package } from '@/lib/types';

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
    <section className="py-12 sm:py-16 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Choose Your Package
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Flexible packages designed to fit your learning style and budget
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
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
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <Card 
                key={pkg.id} 
                className={`relative h-full flex flex-col transition-all duration-200 hover:shadow-lg ${
                  pkg.popular 
                    ? 'border-2 border-yellow-500 shadow-lg transform scale-105' 
                    : 'border border-gray-200 hover:border-yellow-300'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-yellow-500 text-white px-4 py-1 text-sm font-semibold">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl font-bold text-gray-900">{pkg.name}</CardTitle>
                  <CardDescription className="text-sm text-gray-600">{pkg.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="flex-grow text-center">
                  {/* Price Display */}
                  <div className="mb-6">
                    <div className="flex items-baseline justify-center">
                      <span className="text-3xl font-bold text-gray-900">${pkg.price.toFixed(0)}</span>
                      <span className="text-gray-500 ml-1 text-sm">total</span>
                    </div>
                    <div className="text-yellow-600 font-medium mt-1">
                      {pkg.hours} driving hours included
                    </div>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-2 text-left">
                    {pkg.features.slice(0, 4).map((feature, index) => (
                      <li key={index} className="flex items-start text-sm">
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter className="pt-4">
                  <Button
                    className={`w-full font-semibold ${
                      pkg.popular 
                        ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                    }`}
                    asChild
                  >
                    <Link href="/packages">
                      Choose Package
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        <div className="text-center mt-8">
          <Button variant="outline" size="lg" asChild className="border-yellow-500 text-yellow-600 hover:bg-yellow-50">
            <Link href="/packages">
              Compare All Packages
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}