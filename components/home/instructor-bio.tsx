'use client';

import { motion } from 'framer-motion';
import { Award, Star, Calendar, Clock, MapPin, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function InstructorBio() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Instructor Image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative rounded-lg overflow-hidden shadow-xl">
              {/* Placeholder for actual image - in production, use next/image */}
              <img 
                src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=987&q=80" 
                alt="Michael Thompson - Driving Instructor" 
                className="w-full h-auto object-cover rounded-lg"
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
          </motion.div>
          
          {/* Instructor Bio */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
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
                <Link href="/about">
                  Learn More About Me
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/book">
                  Book a Lesson
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}