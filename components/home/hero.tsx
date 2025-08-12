'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Calendar, Car, Award, Clock } from 'lucide-react';

export function Hero() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section className="relative bg-gradient-to-r from-yellow-900 to-yellow-700 text-white overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          backgroundSize: '60px 60px',
        }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Hero content */}
          <div className="space-y-6 sm:space-y-8 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Learn to Drive with Confidence
              </h1>
              <p className="mt-4 sm:mt-6 text-lg sm:text-xl text-yellow-100 max-w-2xl mx-auto lg:mx-0">
                Professional driving lessons with experienced instructors at EG Driving School - tailored to your needs.
              </p>
            </motion.div>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Button
                size="lg"
                className="bg-white text-yellow-700 hover:bg-yellow-50 w-full sm:w-auto"
                asChild
              >
                <Link href="/book">Book Your First Lesson</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white bg-white/10 hover:bg-white/20 w-full sm:w-auto"
                asChild
              >
                <Link href="/packages">View Packages</Link>
              </Button>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 max-w-md mx-auto lg:max-w-none lg:mx-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="flex items-center justify-center lg:justify-start space-x-2">
                <Award className="h-5 w-5 text-yellow-300 flex-shrink-0" />
                <span className="text-sm sm:text-base">Licensed Instructors</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start space-x-2">
                <Car className="h-5 w-5 text-yellow-300 flex-shrink-0" />
                <span className="text-sm sm:text-base">Modern Vehicles</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start space-x-2">
                <Calendar className="h-5 w-5 text-yellow-300 flex-shrink-0" />
                <span className="text-sm sm:text-base">Flexible Scheduling</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start space-x-2">
                <Clock className="h-5 w-5 text-yellow-300 flex-shrink-0" />
                <span className="text-sm sm:text-base">Personalized Pace</span>
              </div>
            </motion.div>
          </div>

          {/* Hero image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="relative order-first lg:order-last"
          >
            <div
              className="relative rounded-lg overflow-hidden shadow-2xl transform transition-transform duration-300"
              style={{ transform: isHovered ? 'scale(1.02)' : 'scale(1)' }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {/* Using Next.js Image component for optimization */}
              <div className="aspect-w-4 aspect-h-3 bg-yellow-800 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Image
                    src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                    alt="Driving instructor with student in car"
                    width={1000}
                    height={750}
                    className="w-full h-full object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-yellow-900/60 to-transparent"></div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                  <div className="bg-white/90 backdrop-blur-sm text-yellow-900 p-3 sm:p-4 rounded-lg shadow-lg">
                    <p className="font-medium text-sm sm:text-base">
                      &quot;The best driving school! I passed my test on the first attempt thanks to their excellent instruction.&quot;
                    </p>
                    <p className="mt-2 text-xs sm:text-sm text-yellow-700">— Sarah T., Recent Graduate</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute top-14 -right-1 h-16 w-16 sm:h-24 sm:w-24 bg-yellow-950 rounded-full opacity-70 blur-xl"></div>
            <div className="absolute -bottom-3 left-12 h-20 w-20 sm:h-32 sm:w-32 bg-yellow-500 rounded-full opacity-70 blur-xl"></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}