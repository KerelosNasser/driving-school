'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Calendar, Car, Award, Clock } from 'lucide-react';

export function Hero() {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <section className="relative bg-gradient-to-r from-blue-900 to-blue-700 text-white overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{ 
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          backgroundSize: '60px 60px',
        }} />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Hero content */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Learn to Drive with Confidence
              </h1>
              <p className="mt-6 text-xl text-blue-100">
                Professional driving lessons in Brisbane with experienced instructors tailored to your needs.
              </p>
            </motion.div>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Button 
                size="lg" 
                className="bg-white text-blue-700 hover:bg-blue-50"
                asChild
              >
                <Link href="/book">Book Your First Lesson</Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white/10"
                asChild
              >
                <Link href="/packages">View Packages</Link>
              </Button>
            </motion.div>
            
            <motion.div 
              className="grid grid-cols-2 gap-4 pt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-blue-300" />
                <span>Licensed Instructors</span>
              </div>
              <div className="flex items-center space-x-2">
                <Car className="h-5 w-5 text-blue-300" />
                <span>Modern Vehicles</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-300" />
                <span>Flexible Scheduling</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-300" />
                <span>Personalized Pace</span>
              </div>
            </motion.div>
          </div>
          
          {/* Hero image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <div 
              className="relative rounded-lg overflow-hidden shadow-2xl transform transition-transform duration-300"
              style={{ transform: isHovered ? 'scale(1.02)' : 'scale(1)' }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {/* Placeholder for actual image - in production, use next/image */}
              <div className="aspect-w-4 aspect-h-3 bg-blue-800 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <img 
                    src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
                    alt="Driving instructor with student in car" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 to-transparent"></div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="bg-white/90 backdrop-blur-sm text-blue-900 p-4 rounded-lg shadow-lg">
                    <p className="font-medium">
                      "The best driving school in Brisbane! I passed my test on the first attempt thanks to their excellent instruction."
                    </p>
                    <p className="mt-2 text-sm text-blue-700">— Sarah T., Recent Graduate</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-6 -right-6 h-24 w-24 bg-yellow-400 rounded-full opacity-70 blur-xl"></div>
            <div className="absolute -bottom-8 -left-8 h-32 w-32 bg-blue-500 rounded-full opacity-70 blur-xl"></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}