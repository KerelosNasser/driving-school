'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Calendar, Car, Award, Clock } from 'lucide-react';
import { useEditMode } from '@/contexts/editModeContext';
import { EditableText } from '@/components/ui/editable-text';
import { EditableImage } from '@/components/ui/editable-image';

interface HeroProps {
    title?: string | null;
    subtitle?: string | null;
    features?: ({ text?: string | null })[];
    backgroundImage?: string;
}

const featureIcons = [Award, Car, Calendar, Clock];

export function Hero({
                         title = 'Learn to Drive with Confidence',
                         subtitle = 'Professional driving lessons with experienced instructors at EG Driving School - tailored to your needs.',
                         features = [],
                         backgroundImage = 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
                     }: HeroProps) {
    const { isEditMode } = useEditMode();
    const [isHovered, setIsHovered] = useState(false);

    const defaultFeatures = [
        { text: 'Licensed Instructors' },
        { text: 'Modern Vehicles' },
        { text: 'Flexible Scheduling' },
        { text: 'Personalized Pace' },
    ];

    const displayFeatures = features.map((feature, index) => ({
        icon: featureIcons[index],
        text: feature.text || defaultFeatures[index].text,
    }));

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
                            <EditableText
                                contentKey="hero_title"
                                tagName="h1"
                                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
                                placeholder="Enter your main headline..."
                            >
                                {title}
                            </EditableText>
                            <EditableText
                                contentKey="hero_subtitle"
                                tagName="p"
                                className="mt-4 sm:mt-6 text-lg sm:text-xl text-yellow-100 max-w-2xl mx-auto lg:mx-0"
                                placeholder="Enter your subtitle..."
                                multiline={true}
                                maxLength={300}
                            >
                                {subtitle}
                            </EditableText>
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
                            {displayFeatures.map((feature, index) => (
                                <div key={index} className="flex items-center justify-center lg:justify-start space-x-2">
                                    <feature.icon className="h-5 w-5 text-yellow-300 flex-shrink-0" />
                                    <EditableText
                                        contentKey={`hero_feature_${index + 1}`}
                                        tagName="span"
                                        className="text-sm sm:text-base"
                                        placeholder={`Feature ${index + 1}...`}
                                    >
                                        {feature.text}
                                    </EditableText>
                                </div>
                            ))}
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
                            <div className="aspect-w-4 aspect-h-3 bg-yellow-800 relative">
                                {isEditMode ? (
                                    <EditableImage
                                        src={backgroundImage}
                                        alt="Professional driving instruction"
                                        contentKey="hero_background_image"
                                        fill
                                        className="object-cover"
                                        priority
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="absolute inset-0 bg-gradient-to-t from-yellow-900/60 to-transparent"></div>
                                    </div>
                                )}

                                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                                    <div className="bg-white/90 backdrop-blur-sm text-yellow-900 p-3 sm:p-4 rounded-lg shadow-lg">
                                        <EditableText
                                            contentKey="hero_testimonial_quote"
                                            tagName="p"
                                            className="font-medium text-sm sm:text-base"
                                            placeholder="Enter testimonial quote..."
                                            multiline={true}
                                            maxLength={150}
                                        >
                                            "The best driving school! I passed my test on the first attempt thanks to their excellent instruction."
                                        </EditableText>
                                        <EditableText
                                            contentKey="hero_testimonial_author"
                                            tagName="p"
                                            className="mt-2 text-xs sm:text-sm text-yellow-700"
                                            placeholder="— Author Name"
                                        >
                                            — Sarah T., Recent Graduate
                                        </EditableText>
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