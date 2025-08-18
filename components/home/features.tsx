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

interface FeatureItemProps {
  icon: React.ElementType;
  title: string;
  description: string;
  delay: number;
}

// Feature item component
const FeatureItem = ({ 
  icon: Icon, 
  title, 
  description, 
  delay 
}: FeatureItemProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="bg-white rounded-xl p-4 sm:p-6 shadow-md hover:shadow-lg transition-shadow"
    >
      <div className="rounded-full bg-yellow-100 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mb-3 sm:mb-4">
        <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm sm:text-base text-gray-600">{description}</p>
    </motion.div>
  );
};

interface FeaturesProps {
  title?: string;
  subtitle?: string;
  features?: ({ title?: string | null; description?: string | null; })[];
}

const featureIcons = [ShieldCheck, Clock, Calendar, Car, Award, MapPin, CreditCard, Headphones];

export function Features({ 
  title = 'Why Choose EG Driving School?',
  subtitle = "We're committed to providing the best driving education experience.",
  features = []
}: FeaturesProps) {

  const defaultFeatures = [
    { title: "Safety First", description: "Our instructors prioritize safety with dual-control vehicles and comprehensive safety protocols." },
    { title: "Flexible Hours", description: "We offer lessons 7 days a week, including evenings, to fit your busy schedule." },
    { title: "Easy Booking", description: "Book and manage your lessons online with our simple scheduling system." },
    { title: "Modern Vehicles", description: "Learn in late-model cars equipped with the latest safety features and technology." },
    { title: "Certified Instructors", description: "All our instructors are fully licensed and certified with years of teaching experience." },
    { title: "Wide Coverage", description: "We service multiple areas with pick-up and drop-off at your preferred locations." },
    { title: "Affordable Packages", description: "Choose from a range of packages designed to suit different budgets and learning needs." },
    { title: "Ongoing Support", description: "Get personalized feedback and support throughout your learning journey." },
  ];

  const displayFeatures = features.map((feature, index) => ({
    icon: featureIcons[index],
    title: feature.title || defaultFeatures[index].title,
    description: feature.description || defaultFeatures[index].description,
    delay: (index + 1) * 0.1,
  }));

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
              {title}
            </h2>
            <p className="mt-4 text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              {subtitle}
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {displayFeatures.map((feature, index) => (
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