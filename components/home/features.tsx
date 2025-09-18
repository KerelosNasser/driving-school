'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Clock,
  Calendar,
  Car,
  Award,
  MapPin,
  CreditCard,
  Headphones,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '../ui/button';
// Using built-in button and card components

interface Feature {
  title: string;
  description: string;
}

interface FeatureItemProps {
  feature: Feature;
  icon: React.ElementType;
  delay: number;
  index: number;
  isMobile: boolean;
}

const FeatureItem = ({
  feature,
  icon: Icon,
  delay,
  index,
  isMobile
}: FeatureItemProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="h-full p-6 shadow-sm hover:shadow-lg transition-all duration-300 relative border-l-4 border-l-emerald-500 bg-white hover:bg-emerald-50/30 group border border-gray-200 rounded-lg">{' '}
        <div className="flex items-start space-x-4">
          <div className="rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 w-14 h-14 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
            <Icon className="h-7 w-7 text-emerald-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-emerald-800 transition-colors">
              {feature.title}
            </h3>

            <p className="text-gray-600 leading-relaxed text-sm">
              {feature.description}
            </p>
          </div>
        </div>

        {/* Hover effect indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
      </div>
    </motion.div>
  );
};

interface FeaturesProps {
  title?: string;
  subtitle?: string;
  features?: Feature[];
}

const featureIcons = [ShieldCheck, Clock, Calendar, Car, Award, MapPin, CreditCard, Headphones];

const defaultFeatures: Feature[] = [
  { 
    title: "RMS Approved Instructors", 
    description: "All our instructors are fully licensed by Roads and Maritime Services with extensive teaching experience and clean driving records." 
  },
  { 
    title: "Flexible Scheduling", 
    description: "Book lessons 7 days a week including evenings and weekends. Our online system makes rescheduling easy to fit your busy lifestyle." 
  },
  { 
    title: "Easy Online Booking", 
    description: "Book and manage your lessons through our user-friendly online platform. Track your progress and schedule with just a few clicks." 
  },
  { 
    title: "Modern Dual-Control Cars", 
    description: "Learn in late-model vehicles equipped with dual-controls, air conditioning, and the latest safety features for your comfort and security." 
  },
  { 
    title: "Proven Success Record", 
    description: "With a 95% first-time pass rate and thousands of successful students, our proven teaching methods get results." 
  },
  { 
    title: "Comprehensive Coverage", 
    description: "We service all major Australian cities and suburbs with convenient pick-up and drop-off at your preferred locations." 
  },
  { 
    title: "Competitive Packages", 
    description: "Choose from a range of affordable packages designed to suit different budgets and learning needs with transparent pricing." 
  },
  { 
    title: "Ongoing Student Support", 
    description: "Get personalized feedback, progress tracking, and comprehensive support throughout your entire learning journey." 
  },
];

export function Features({
  title = 'Why Choose Australia\'s Leading Driving School?',
  subtitle = "We're committed to providing the best driving education experience with proven methods and exceptional results.",
  features: initialFeatures = []
}: FeaturesProps) {
  const [showFeatures, setShowFeatures] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const features = initialFeatures.length > 0 ? initialFeatures : defaultFeatures;

  // Check screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-gray-50 to-emerald-50/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-teal-400 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12 sm:mb-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-gray-900 via-emerald-800 to-teal-700 bg-clip-text text-transparent">
              {title}
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-4xl mx-auto px-4 leading-relaxed">
              {subtitle}
            </p>
          </motion.div>
        </div>

        {/* Mobile Toggle Button */}
        {isMobile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex justify-center mb-8"
          >
            <button
              onClick={() => setShowFeatures(!showFeatures)}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold px-8 py-4 rounded-2xl shadow-lg flex items-center space-x-3 text-lg transition-all duration-300"
            >
              <span>{showFeatures ? 'Hide Features' : 'See What Makes Us Different'}</span>
              {showFeatures ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
          </motion.div>
        )}

        {/* Features Grid */}
        <div className={`${
          isMobile 
            ? `overflow-hidden transition-all duration-700 ease-in-out ${
                showFeatures 
                  ? 'max-h-[2000px] opacity-100' 
                  : 'max-h-0 opacity-0'
              }`
            : 'block'
        }`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <FeatureItem
                key={`feature-${index}`}
                feature={feature}
                icon={featureIcons[index % featureIcons.length]}
                delay={isMobile && !showFeatures ? 0 : (index + 1) * 0.1}
                index={index}
                isMobile={isMobile}
              />
            ))}
          </div>
        </div>

        {/* Bottom CTA Section - Always visible */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full translate-y-48 -translate-x-48"></div>
            </div>
            
            <div className="relative z-10">
              <h3 className="text-2xl sm:text-3xl font-bold mb-4">
                Ready to Start Your Driving Journey?
              </h3>
              <p className="text-lg sm:text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
                Join thousands of successful drivers who learned with Australia's most trusted driving school.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-white text-emerald-600 hover:bg-emerald-50 font-bold px-8 py-4 text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  Book Your First Lesson
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white hover:text-emerald-600 font-bold px-8 py-4 text-lg rounded-2xl transition-all duration-300"
                >
                  <Award className="h-5 w-5 mr-2" />
                  View Packages
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}