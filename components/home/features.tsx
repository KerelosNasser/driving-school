'use client';

import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Clock, 
  Calendar, 
  Car, 
  Award, 
  MapPin, 
  CreditCard, 
  Headphones 
} from 'lucide-react';

// Feature item component
const FeatureItem = ({ 
  icon: Icon, 
  title, 
  description, 
  delay 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string; 
  delay: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow"
    >
      <div className="rounded-full bg-blue-100 w-12 h-12 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-blue-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </motion.div>
  );
};

export function Features() {
  const features = [
    {
      icon: ShieldCheck,
      title: "Safety First",
      description: "Our instructors prioritize safety with dual-control vehicles and comprehensive safety protocols.",
      delay: 0.1
    },
    {
      icon: Clock,
      title: "Flexible Hours",
      description: "We offer lessons 7 days a week, including evenings, to fit your busy schedule.",
      delay: 0.2
    },
    {
      icon: Calendar,
      title: "Easy Booking",
      description: "Book and manage your lessons online with our simple scheduling system.",
      delay: 0.3
    },
    {
      icon: Car,
      title: "Modern Vehicles",
      description: "Learn in late-model cars equipped with the latest safety features and technology.",
      delay: 0.4
    },
    {
      icon: Award,
      title: "Certified Instructors",
      description: "All our instructors are fully licensed and certified with years of teaching experience.",
      delay: 0.5
    },
    {
      icon: MapPin,
      title: "Brisbane Coverage",
      description: "We service all Brisbane suburbs, with pick-up and drop-off at your preferred locations.",
      delay: 0.6
    },
    {
      icon: CreditCard,
      title: "Affordable Packages",
      description: "Choose from a range of packages designed to suit different budgets and learning needs.",
      delay: 0.7
    },
    {
      icon: Headphones,
      title: "Ongoing Support",
      description: "Get personalized feedback and support throughout your learning journey.",
      delay: 0.8
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Why Choose Brisbane Driving School?
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              We&apos;re committed to providing the best driving education experience in Brisbane.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureItem
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={feature.delay}
            />
          ))}
        </div>
      </div>
    </section>
  );
}