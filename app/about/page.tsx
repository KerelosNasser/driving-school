'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { serviceAreas } from '@/lib/data';
import { Award, Star, Calendar, Clock, MapPin, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

// Dynamically import the map component with SSR disabled
const LeafletServiceAreaMap = dynamic(
  () => import('@/components/maps/LeafletServiceAreaMap'),
  {
    ssr: false,
    loading: () => <div className="w-full h-[500px] bg-gray-200 animate-pulse rounded-xl flex items-center justify-center"><p>Loading map...</p></div>,
  }
);

export default function AboutPage() {
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);

  const handleAreaSelect = (areaId: number) => {
    setSelectedAreaId(areaId);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl md:text-6xl">
            About Our Driving School
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500">
            Your success on the road is our top priority. We are committed to providing the highest quality driving education in Brisbane.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        {/* Instructor Bio Section */}
        <section className="mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Instructor Image */}
            <div className="relative">
              <div className="relative rounded-lg overflow-hidden shadow-xl">
                <Image 
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=987&q=80" 
                  alt="Michael Thompson - Driving Instructor" 
                  width={600}
                  height={600}
                  className="w-full h-auto object-cover rounded-lg"
                  priority
                />
                
                {/* Experience badge */}
                <div className="absolute top-4 right-4 bg-yellow-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">15+ Years Experience</span>
                </div>
              </div>
              
              {/* Certification badges */}
              <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-lg shadow-lg flex items-center space-x-3">
                <Award className="h-6 w-6 text-yellow-600" />
                <div>
                  <div className="font-semibold text-gray-900">Certified Instructor</div>
                  <div className="text-sm text-gray-600">Queensland Transport Approved</div>
                </div>
              </div>
              
              {/* Rating badge */}
              <div className="absolute -top-6 -left-6 bg-white p-3 rounded-full shadow-lg flex items-center space-x-1">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                <span className="font-bold text-gray-900">4.9</span>
              </div>
            </div>
            
            {/* Instructor Bio */}
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Meet Your Instructor</h2>
                <div className="mt-2 text-xl text-yellow-600 font-medium">Michael Thompson</div>
              </div>
              
              <p className="text-gray-700">
                Hi there! I&apos;m Michael, a passionate driving instructor with over 15 years of experience teaching people of all ages how to drive safely and confidently on Brisbane roads.
              </p>
              
              <p className="text-gray-700">
                I believe in creating a relaxed, supportive learning environment where you can develop your skills at your own pace. My teaching approach is patient, thorough, and tailored to your individual needs.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex items-center space-x-3">
                  <div className="bg-yellow-100 p-2 rounded-full">
                    <Car className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="text-gray-700">Dual-control vehicle</div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="bg-yellow-100 p-2 rounded-full">
                    <MapPin className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="text-gray-700">All Brisbane suburbs</div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="bg-yellow-100 p-2 rounded-full">
                    <Calendar className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="text-gray-700">Flexible scheduling</div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="bg-yellow-100 p-2 rounded-full">
                    <Award className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="text-gray-700">Keys2drive accredited</div>
                </div>
              </div>
              
              <div className="pt-4 flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild>
                  <Link href="/book">
                    Book a Lesson
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/contact">
                    Contact Me
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Service Areas Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Our Service Areas</h2>
              <p className="mt-4 text-lg text-gray-600">
                We cover a wide range of suburbs across Brisbane. Select an area on the map to see more details or choose from the list below.
              </p>
            </div>
            <div className="h-[500px] w-full rounded-xl border-4 border-white shadow-2xl overflow-hidden">
              <LeafletServiceAreaMap 
                selectedAreaId={selectedAreaId} 
                onAreaSelect={handleAreaSelect} 
              />
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-xl space-y-6 sticky top-8">
            <h3 className="text-2xl font-bold text-gray-900">Locations List</h3>
            <div className="max-h-[420px] overflow-y-auto pr-4 -mr-4 space-y-2">
              {serviceAreas.map((area) => (
                <button
                  key={area.id}
                  onClick={() => handleAreaSelect(area.id)}
                  className={`w-full text-left p-4 rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-500 ${selectedAreaId === area.id ? 'bg-yellow-400 text-white shadow-lg' : 'bg-gray-100 hover:bg-yellow-100'}`}>
                  <p className="font-semibold text-lg">{area.name}</p>
                  {area.popular && (
                    <span className="text-xs font-bold uppercase tracking-wider text-yellow-800 bg-yellow-200 px-2 py-1 rounded-full">
                      ⭐ Popular
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
