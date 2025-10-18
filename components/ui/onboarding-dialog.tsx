'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Car, 
  Calendar, 
  Award, 
  Users, 
  MapPin,
  Phone,
  CheckCircle,
  Star,
  Clock,
  Gift
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  features: string[];
  color: string;
  gradient: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to EG Driving School!',
    description: 'Your journey to safe and confident driving starts here. Let us show you what makes us special.',
    icon: Award,
    features: [
      'Professional certified instructors',
      'Modern dual-control vehicles',
      'Flexible scheduling options',
      'High pass rate success'
    ],
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-600'
  },
  {
    id: 'lessons',
    title: 'Quality Driving Lessons',
    description: 'Learn from experienced instructors using proven teaching methods and modern vehicles.',
    icon: Car,
    features: [
      'One-on-one personalized instruction',
      'Comprehensive theory and practical training',
      'Patient and encouraging teaching approach',
      'Regular progress assessments'
    ],
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-600'
  },
  {
    id: 'booking',
    title: 'Easy Online Booking',
    description: 'Schedule your lessons at your convenience with our simple online booking system.',
    icon: Calendar,
    features: [
      'Book lessons 24/7 online',
      'Choose your preferred instructor',
      'Flexible rescheduling options',
      'Instant confirmation notifications'
    ],
    color: 'purple',
    gradient: 'from-purple-500 to-indigo-600'
  },
  {
    id: 'packages',
    title: 'Affordable Packages',
    description: 'Choose from our range of lesson packages designed to suit every budget and need.',
    icon: Gift,
    features: [
      'Competitive pricing with no hidden fees',
      'Bundle discounts for multiple lessons',
      'Referral rewards program',
      'Flexible payment options'
    ],
    color: 'orange',
    gradient: 'from-orange-500 to-red-500'
  },
  {
    id: 'success',
    title: 'Your Success is Our Priority',
    description: 'Join thousands of satisfied students who have passed their driving test with confidence.',
    icon: Star,
    features: [
      'High first-time pass rate',
      'Mock test preparation',
      'Test day support and guidance',
      'Ongoing support after licensing'
    ],
    color: 'green',
    gradient: 'from-green-500 to-emerald-600'
  }
];

interface OnboardingDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingDialog({ isOpen, onClose }: OnboardingDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    // Check if user has seen onboarding before
    const seen = localStorage.getItem('eg-driving-school-onboarding-seen');
    setHasSeenOnboarding(seen === 'true');
  }, []);

  const handleClose = () => {
    localStorage.setItem('eg-driving-school-onboarding-seen', 'true');
    setHasSeenOnboarding(true);
    onClose();
  };

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleClose();
  };

  const currentStepData = onboardingSteps[currentStep];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className={`bg-gradient-to-r ${currentStepData.gradient} p-6 text-white relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-5 rounded-full -ml-12 -mb-12"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
                    <currentStepData.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <Badge variant="secondary" className="bg-white bg-opacity-20 text-white border-white border-opacity-20 mb-2">
                      Step {currentStep + 1} of {onboardingSteps.length}
                    </Badge>
                    <h2 className="text-2xl font-bold">{currentStepData.title}</h2>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full w-10 h-10 p-0"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <p className="text-lg opacity-90 leading-relaxed">
                {currentStepData.description}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {currentStepData.features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  <CheckCircle className={`h-5 w-5 text-${currentStepData.color}-500 flex-shrink-0`} />
                  <span className="text-sm text-gray-700">{feature}</span>
                </motion.div>
              ))}
            </div>

            {/* Progress Indicators */}
            <div className="flex justify-center space-x-2 mb-6">
              {onboardingSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep
                      ? `bg-${currentStepData.color}-500`
                      : index < currentStep
                      ? 'bg-gray-400'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <div>
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    className="flex items-center space-x-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Previous</span>
                  </Button>
                )}
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Skip Tour
                </Button>
                <Button
                  onClick={handleNext}
                  className={`bg-gradient-to-r ${currentStepData.gradient} hover:opacity-90 text-white px-6`}
                >
                  {currentStep === onboardingSteps.length - 1 ? (
                    <>
                      <span>Get Started</span>
                      <CheckCircle className="h-4 w-4 ml-2" />
                    </>
                  ) : (
                    <>
                      <span>Next</span>
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Revisit Option */}
            {hasSeenOnboarding && (
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  You can always revisit this tour from the help menu
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}