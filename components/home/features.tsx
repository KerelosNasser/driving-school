'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { useEditMode } from '@/contexts/editModeContext';
import { EditableText } from '@/components/ui/editable-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Feature {
  title: string;
  description: string;
}

interface FeatureItemProps {
  feature: Feature;
  icon: React.ElementType;
  delay: number;
  index: number;
  onUpdate: (index: number, field: 'title' | 'description', value: string) => void;
  onDelete: (index: number) => void;
}

const FeatureItem = ({
                       feature,
                       icon: Icon,
                       delay,
                       index,
                       onDelete
                     }: FeatureItemProps) => {
  const { isEditMode } = useEditMode();
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
        <Card className="h-full p-4 sm:p-6 shadow-md hover:shadow-lg transition-all duration-200 relative">
          {/* Edit Mode Controls */}
          <AnimatePresence>
            {isEditMode && isHovered && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute -top-2 -right-2 flex gap-1 z-10"
                >
                  <Button
                      size="sm"
                      variant="destructive"
                      className="h-6 w-6 p-0 rounded-full"
                      onClick={() => onDelete(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </motion.div>
            )}
          </AnimatePresence>

          <div className="rounded-full bg-yellow-100 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mb-3 sm:mb-4">
            <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
          </div>

          <EditableText
              contentKey={`features_item_${index + 1}_title`}
              tagName="h3"
              className="text-base sm:text-lg font-semibold text-gray-900 mb-2"
              placeholder="Enter feature title..."
          >
            {feature.title}
          </EditableText>

          <EditableText
              contentKey={`features_item_${index + 1}_description`}
              tagName="p"
              className="text-sm sm:text-base text-gray-600"
              placeholder="Enter feature description..."
              multiline={true}
              maxLength={200}
          >
            {feature.description}
          </EditableText>
        </Card>
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
  { title: "Safety First", description: "Our instructors prioritize safety with dual-control vehicles and comprehensive safety protocols." },
  { title: "Flexible Hours", description: "We offer lessons 7 days a week, including evenings, to fit your busy schedule." },
  { title: "Easy Booking", description: "Book and manage your lessons online with our simple scheduling system." },
  { title: "Modern Vehicles", description: "Learn in late-model cars equipped with the latest safety features and technology." },
  { title: "Certified Instructors", description: "All our instructors are fully licensed and certified with years of teaching experience." },
  { title: "Wide Coverage", description: "We service multiple areas with pick-up and drop-off at your preferred locations." },
  { title: "Affordable Packages", description: "Choose from a range of packages designed to suit different budgets and learning needs." },
  { title: "Ongoing Support", description: "Get personalized feedback and support throughout your learning journey." },
];

export function Features({
                           title = 'Why Choose EG Driving School?',
                           subtitle = "We're committed to providing the best driving education experience.",
                           features: initialFeatures = []
                         }: FeaturesProps) {
  const { isEditMode, saveContent } = useEditMode();
  const [features, setFeatures] = useState<Feature[]>(
      initialFeatures.length > 0 ? initialFeatures : defaultFeatures
  );

  const updateFeature = async (index: number, field: 'title' | 'description', value: string) => {
    const updatedFeatures = [...features];
    updatedFeatures[index] = {
      ...updatedFeatures[index],
      [field]: value
    };
    setFeatures(updatedFeatures);

    // Save to backend
    await saveContent(`features_item_${index + 1}_${field}`, value);
  };

  const addFeature = async () => {
    const newFeature: Feature = {
      title: 'New Feature',
      description: 'Enter your feature description here...'
    };

    const updatedFeatures = [...features, newFeature];
    setFeatures(updatedFeatures);

    // Save new feature to backend
    const newIndex = updatedFeatures.length;
    await saveContent(`features_item_${newIndex}_title`, newFeature.title);
    await saveContent(`features_item_${newIndex}_description`, newFeature.description);
  };

  const deleteFeature = async (index: number) => {
    if (features.length <= 1) {
      return; // Don't allow deleting the last feature
    }

    const updatedFeatures = features.filter((_, i) => i !== index);
    setFeatures(updatedFeatures);

    // Remove from backend
    await saveContent(`features_item_${index + 1}_title`, '');
    await saveContent(`features_item_${index + 1}_description`, '');
  };

  return (
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
            >
              <EditableText
                  contentKey="features_title"
                  tagName="h2"
                  className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900"
                  placeholder="Enter section title..."
              >
                {title}
              </EditableText>
              <EditableText
                  contentKey="features_subtitle"
                  tagName="p"
                  className="mt-4 text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4"
                  placeholder="Enter section subtitle..."
                  multiline={true}
              >
                {subtitle}
              </EditableText>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {features.map((feature, index) => (
                <FeatureItem
                    key={`feature-${index}`}
                    feature={feature}
                    icon={featureIcons[index % featureIcons.length]}
                    delay={(index + 1) * 0.1}
                    index={index}
                    onUpdate={updateFeature}
                    onDelete={deleteFeature}
                />
            ))}
          </div>

          {/* Add Feature Button */}
          <AnimatePresence>
            {isEditMode && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="flex justify-center mt-8"
                >
                  <Button
                      onClick={addFeature}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      size="lg"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Feature
                  </Button>
                </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
  );
}