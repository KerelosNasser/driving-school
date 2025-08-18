'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Calendar, Phone, Mail, ArrowRight } from 'lucide-react';
import { PageContent } from '@/lib/content';

interface BookingCTAProps {
  title?: string;
  subtitle?: string;
  phoneText?: string;
  phoneNumber?: string;
  emailText?: string;
  emailAddress?: string;
}

export function BookingCTA({ 
  title = 'Ready to Start Your Driving Journey?',
  subtitle = "Book your first lesson today and take the first step towards getting your license with Brisbane's most trusted driving instructor.",
  phoneText = 'Call us at',
  phoneNumber = '0400 000 000',
  emailText = 'Email us at',
  emailAddress = 'info@brisbanedrivingschool.com',
}: BookingCTAProps) {
  return (
    <section className="py-20 bg-gradient-to-r from-yellow-600 to-yellow-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* CTA Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">
              {title}
            </h2>
            <p className="text-xl text-yellow-100">
              {subtitle}
            </p>
            
            <div className="space-y-4 pt-2">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>Flexible scheduling to fit your timetable</div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <Phone className="h-5 w-5" />
                </div>
                <div>{phoneText} <a href={`tel:${phoneNumber}`} className="underline hover:text-yellow-200">{phoneNumber}</a></div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <Mail className="h-5 w-5" />
                </div>
                <div>{emailText} <a href={`mailto:${emailAddress}`} className="underline hover:text-yellow-200">{emailAddress}</a></div>
              </div>
            </div>
            
            <div className="pt-4 flex flex-col sm:flex-row gap-4">
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
                <Link href="/packages">
                  View Packages
                </Link>
              </Button>
            </div>
          </motion.div>
          
          {/* Booking Form Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-white rounded-xl shadow-xl p-6 text-gray-900">
              <div className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Calendar className="h-5 w-5 text-yellow-600 mr-2" />
                Quick Booking Preview
              </div>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select a Package
                  </label>
                  <div className="bg-gray-100 p-3 rounded-lg border border-gray-200">
                    <div className="font-medium">Standard Package</div>
                    <div className="text-sm text-gray-600">10 hours of driving lessons</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preferred Date
                    </label>
                    <div className="bg-gray-100 p-3 rounded-lg border border-gray-200">
                      Aug 12, 2025
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preferred Time
                    </label>
                    <div className="bg-gray-100 p-3 rounded-lg border border-gray-200">
                      10:00 AM
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pick-up Location
                  </label>
                  <div className="bg-gray-100 p-3 rounded-lg border border-gray-200">
                    Brisbane CBD
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <Button 
                  className="w-full bg-yellow-600 hover:bg-yellow-700"
                  asChild
                >
                  <Link href="/book">
                    Complete Your Booking
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <p className="mt-3 text-sm text-gray-600">
                  Fill in your details on the next page to confirm your booking
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}