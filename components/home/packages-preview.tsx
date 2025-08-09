import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
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

async function getPackages() {
  const supabase = createServerComponentClient({ cookies });
  try {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .order('price', { ascending: true })
      .limit(3);

    if (error || !data || data.length === 0) {
      console.error('Error fetching packages or no packages found, using fallback.');
      return fallbackPackages;
    }
    return data as Package[];
  } catch (error) {
    console.error('Error in packages fetch:', error);
    return fallbackPackages;
  }
}

export async function PackagesPreview() {
  const packages = await getPackages();

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Driving Lesson Packages
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the package that best suits your needs and budget
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {packages.map((pkg) => (
            <div key={pkg.id}>
              <Card className={`h-full flex flex-col ${pkg.popular ? 'border-yellow-500 shadow-lg' : ''}`}>
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
                    className={`w-full ${pkg.popular ? 'bg-yellow-600 hover:bg-yellow-700' : ''}`}
                    asChild
                  >
                    <Link href="/packages">
                      Select Package
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button variant="outline" size="lg" asChild>
            <Link href="/packages">
              View All Packages
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
