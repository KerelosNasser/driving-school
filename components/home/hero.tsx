'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Calendar, Car, Award, Clock, Shield, Star, CheckCircle, Play, Users } from 'lucide-react';
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
                         title = 'Master the Road with Confidence',
                         subtitle = 'Join thousands of successful drivers who learned with Brisbane\'s most trusted driving school. Expert instructors, modern vehicles, and proven results.',
                         features = [],
                         backgroundImage = 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
                     }: HeroProps) {
    const { isEditMode } = useEditMode();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const heroImages = [
        'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1502877338535-766e1452684a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
    ];

    const defaultFeatures = [
        { text: 'Expert Instructors' },
        { text: 'Modern Fleet' },
        { text: 'Flexible Times' },
        { text: 'Quick Results' },
    ];

    const displayFeatures = features.map((feature, index) => ({
        icon: featureIcons[index],
        text: feature.text || defaultFeatures[index].text,
    }));

    // Auto-rotate hero images
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [heroImages.length]);

    return (
        <section className="relative min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white overflow-hidden pt-16">
            {/* Dynamic background with animated gradient */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-blue-800/80 to-indigo-900/90"></div>
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.1\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'4\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                        backgroundSize: '60px 60px',
                    }} />
                </div>
                {/* Animated floating elements */}
                <div className="absolute top-20 left-10 w-20 h-20 bg-blue-400/20 rounded-full blur-xl animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-32 h-32 bg-indigo-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-cyan-400/20 rounded-full blur-xl animate-pulse delay-500"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[80vh]">
                    {/* Hero content */}
                    <div className="space-y-8 text-center lg:text-left">
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center space-x-2 bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 rounded-full px-4 py-2 text-sm font-medium"
                        >
                            <Star className="h-4 w-4 text-yellow-400" />
                            <span>Brisbane's #1 Rated Driving School</span>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <EditableText
                                contentKey="hero_title"
                                tagName="h1"
                                className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight bg-gradient-to-r from-white via-blue-100 to-cyan-200 bg-clip-text text-transparent"
                                placeholder="Enter your main headline..."
                            >
                                {title}
                            </EditableText>
                            <EditableText
                                contentKey="hero_subtitle"
                                tagName="p"
                                className="mt-6 text-xl text-blue-100 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
                                placeholder="Enter your subtitle..."
                                multiline={true}
                                maxLength={300}
                            >
                                {subtitle}
                            </EditableText>
                        </motion.div>

                        {/* Stats */}
                        <motion.div
                            className="grid grid-cols-3 gap-6 py-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <div className="text-center">
                                <div className="text-3xl font-bold text-cyan-400">2,500+</div>
                                <div className="text-sm text-blue-200">Students Trained</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-green-400">95%</div>
                                <div className="text-sm text-blue-200">Pass Rate</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-yellow-400">4.9★</div>
                                <div className="text-sm text-blue-200">Rating</div>
                            </div>
                        </motion.div>

                        {/* CTA Buttons */}
                        <motion.div
                            className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            <Button
                                size="lg"
                                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold px-8 py-4 text-lg shadow-2xl hover:shadow-cyan-500/25 transition-all duration-300 transform hover:scale-105"
                                asChild
                            >
                                <Link href="/service-center" className="flex items-center">
                                    <Car className="h-5 w-5 mr-2" />
                                    Start Learning Today
                                </Link>
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="border-2 border-cyan-400 text-cyan-400 bg-white/10 hover:bg-cyan-400 hover:text-blue-900 font-semibold px-8 py-4 text-lg backdrop-blur-sm transition-all duration-300"
                                asChild
                            >
                                <Link href="/packages" className="flex items-center">
                                    <Award className="h-5 w-5 mr-2" />
                                    View Packages
                                </Link>
                            </Button>
                        </motion.div>

                        {/* Features */}
                        <motion.div
                            className="grid grid-cols-2 gap-4 pt-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                        >
                            {displayFeatures.map((feature, index) => (
                                <div key={index} className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-lg p-3">
                                    <div className="bg-cyan-500/20 rounded-lg p-2">
                                        <feature.icon className="h-5 w-5 text-cyan-400" />
                                    </div>
                                    <EditableText
                                        contentKey={`hero_feature_${index + 1}`}
                                        tagName="span"
                                        className="text-sm font-medium text-blue-100"
                                        placeholder={`Feature ${index + 1}...`}
                                    >
                                        {feature.text}
                                    </EditableText>
                                </div>
                            ))}
                        </motion.div>
                    </div>

                    {/* Hero visual section */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                        className="relative"
                    >
                        {/* Main hero image */}
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                            <div className="aspect-[4/3] relative">
                                <img
                                    src={heroImages[currentImageIndex]}
                                    alt="Professional driving instruction"
                                    className="w-full h-full object-cover transition-all duration-1000"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 via-transparent to-transparent"></div>
                                
                                {/* Floating success badge */}
                                <div className="absolute top-6 right-6 bg-green-500 text-white px-4 py-2 rounded-full flex items-center space-x-2 shadow-lg">
                                    <CheckCircle className="h-4 w-4" />
                                    <span className="text-sm font-semibold">95% Pass Rate</span>
                                </div>

                                {/* Video play button overlay */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <button className="bg-white/20 backdrop-blur-sm rounded-full p-6 hover:bg-white/30 transition-all duration-300 group">
                                        <Play className="h-8 w-8 text-white group-hover:scale-110 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Floating testimonial card */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.7, delay: 0.5 }}
                            className="absolute -bottom-6 -left-6 bg-white rounded-xl p-6 shadow-2xl max-w-sm"
                        >
                            <div className="flex items-start space-x-4">
                                <img
                                    src="https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
                                    alt="Happy student"
                                    className="w-12 h-12 rounded-full object-cover"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center space-x-1 mb-2">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                                        ))}
                                    </div>
                                    <EditableText
                                        contentKey="hero_testimonial_quote"
                                        tagName="p"
                                        className="text-gray-700 text-sm font-medium"
                                        placeholder="Enter testimonial quote..."
                                        multiline={true}
                                        maxLength={120}
                                    >
                                        "Passed first time! Amazing instructor and great experience."
                                    </EditableText>
                                    <EditableText
                                        contentKey="hero_testimonial_author"
                                        tagName="p"
                                        className="text-gray-500 text-xs mt-1"
                                        placeholder="— Author Name"
                                    >
                                        — Sarah Chen, Recent Graduate
                                    </EditableText>
                                </div>
                            </div>
                        </motion.div>

                        {/* Floating stats card */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.7, delay: 0.7 }}
                            className="absolute -top-6 -right-6 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl p-4 shadow-2xl text-white"
                        >
                            <div className="flex items-center space-x-3">
                                <Users className="h-8 w-8" />
                                <div>
                                    <div className="text-2xl font-bold">15+</div>
                                    <div className="text-sm opacity-90">Years Experience</div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Image indicators */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                            {heroImages.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentImageIndex(index)}
                                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                        index === currentImageIndex ? 'bg-white w-6' : 'bg-white/50'
                                    }`}
                                />
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}