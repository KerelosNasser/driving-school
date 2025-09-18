'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Calendar,
    Car,
    Award,
    Clock,
    Shield,
    Star,
    CheckCircle,
    Play,
    Users,
    ChevronDown,
    MapPin,
    Phone,
} from 'lucide-react';

interface HeroProps {
    title?: string | null;
    subtitle?: string | null;
    features?: ({ text?: string | null })[];
    backgroundImage?: string;
}

const featureIcons = [Award, Car, Calendar, Clock];

export function Hero({
    title = 'Learn to Drive with Confidence in Australia',
    subtitle = 'Certified instructors, modern vehicles, and lessons tailored for your success on the road. Join thousands who passed their test with us.',
    features = [],
    backgroundImage = 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
}: HeroProps) {
    const [showFeatures, setShowFeatures] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const defaultFeatures = [
        { text: 'RMS Approved Instructors' },
        { text: 'Modern Dual-Control Cars' },
        { text: '7 Days a Week Available' },
        { text: '95% First-Time Pass Rate' },
    ];

    const displayFeatures = features.map((feature, index) => ({
        icon: featureIcons[index],
        text: feature.text || defaultFeatures[index].text,
    }));

    // Detect mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <section className="relative min-h-screen theme-gradient-hero text-white overflow-hidden">

            {/* ================= Background Layers ================= */}
            <div className="absolute inset-0">
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/95 via-teal-800/90 to-blue-900/95" />

                {/* Road Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.2'%3E%3Cpath d='M0 20h40v2H0zM20 0v40h-2V0z'/%3E%3C/g%3E%3C/svg%3E")`,
                            backgroundSize: '40px 40px',
                        }}
                    />
                </div>

                {/* Animated Orbs */}
                <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-400/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-20 right-10 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
                <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-teal-400/20 rounded-full blur-2xl animate-pulse delay-500" />
            </div>

            {/* ================= Content Wrapper ================= */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center min-h-[80vh]">

                    {/* ================= Left Column: Text ================= */}
                    <div className="space-y-6 text-center lg:text-left order-2 lg:order-1">

                        {/* Trust Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="inline-flex items-center space-x-2 bg-white/20 theme-backdrop-blur-sm border theme-border-primary/30 theme-rounded-full px-4 py-2 text-sm font-semibold"
                        >
                            <Shield className="h-4 w-4 theme-text-primary" />
                            <span>RMS Approved • Fully Insured • 15+ Years</span>
                        </motion.div>

                        {/* Headlines */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.1 }}
                        >
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-6">
                                <span className="bg-gradient-to-r from-white via-emerald-100 to-teal-200 bg-clip-text text-transparent">
                                    Learn to Drive
                                </span>
                                <br />
                                <span className="theme-text-primary">with Confidence</span>
                                <br />
                                <span className="text-2xl sm:text-3xl lg:text-4xl text-blue-200">
                                    in Australia
                                </span>
                            </h1>

                            <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                                {subtitle}
                            </p>
                        </motion.div>

                        {/* Stats */}
                        <motion.div
                            className="grid grid-cols-3 gap-4 py-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                        >
                            <div className="text-center p-4 bg-white/10 theme-backdrop-blur-sm theme-rounded-lg">
                                <div className="text-2xl sm:text-3xl font-bold theme-text-primary">3,500+</div>
                                <div className="text-xs sm:text-sm text-blue-200">Students Passed</div>
                            </div>

                            <div className="text-center p-4 bg-white/10 theme-backdrop-blur-sm theme-rounded-lg">
                                <div className="text-2xl sm:text-3xl font-bold text-yellow-400">95%</div>
                                <div className="text-xs sm:text-sm text-blue-200">First-Time Pass</div>
                            </div>

                            <div className="text-center p-4 bg-white/10 theme-backdrop-blur-sm theme-rounded-lg">
                                <div className="text-2xl sm:text-3xl font-bold text-orange-400">4.9★</div>
                                <div className="text-xs sm:text-sm text-blue-200">Google Rating</div>
                            </div>
                        </motion.div>

                        {/* CTAs */}
                        <motion.div
                            className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                        >
                            <button className="theme-gradient-button text-white font-bold px-8 py-4 text-lg theme-shadow-button hover:shadow-emerald-500/25 transition-all duration-300 transform hover:scale-105 theme-rounded-lg">
                                <Calendar className="h-5 w-5 mr-2 inline" />
                                Book Your Lesson Now
                            </button>

                            <button className="border-2 theme-border-primary theme-text-primary bg-white/10 hover:theme-bg-primary hover:text-teal-900 font-bold px-8 py-4 text-lg theme-backdrop-blur-sm transition-all duration-300 theme-rounded-lg">
                                <Phone className="h-5 w-5 mr-2 inline" />
                                Call (04) 1234 5678
                            </button>
                        </motion.div>

                        {/* Features (Mobile toggle) */}
                        {isMobile && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.6, delay: 0.5 }}
                                className="pt-4"
                            >
                                <button
                                    onClick={() => setShowFeatures(!showFeatures)}
                                    className="text-emerald-300 hover:text-white hover:bg-white/10 w-full justify-between flex items-center px-4 py-2 rounded-lg transition-all duration-300"
                                >
                                    <span>What makes us different?</span>
                                    <ChevronDown
                                        className={`h-4 w-4 transition-transform ${showFeatures ? 'rotate-180' : ''}`}
                                    />
                                </button>
                            </motion.div>
                        )}

                        {/* Features List */}
                        <motion.div
                            className={`${isMobile
                                ? `overflow-hidden transition-all duration-500 ${showFeatures ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                }`
                                : 'block'
                                } ${!isMobile ? 'pt-6' : 'pt-2'}`}
                            initial={!isMobile ? { opacity: 0, y: 20 } : {}}
                            animate={!isMobile ? { opacity: 1, y: 0 } : {}}
                            transition={!isMobile ? { duration: 0.6, delay: 0.5 } : {}}
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {displayFeatures.map((feature, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center space-x-3 bg-white/10 theme-backdrop-blur-sm theme-rounded-lg p-4 hover:bg-white/15 transition-all duration-200"
                                    >
                                        <div className="theme-bg-primary/20 theme-rounded-lg p-2">
                                            <feature.icon className="h-5 w-5 theme-text-primary" />
                                        </div>
                                        <span className="text-sm font-medium text-blue-100">{feature.text}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Locations */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.6 }}
                            className="flex items-center justify-center lg:justify-start text-sm text-emerald-300 pt-4"
                        >
                            <MapPin className="h-4 w-4 mr-2" />
                            <span>Serving Sydney, Melbourne, Brisbane & Perth</span>
                        </motion.div>
                    </div>

                    {/* ================= Right Column: Visual ================= */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="relative order-1 lg:order-2"
                    >
                        {/* Main Image */}
                        <div className="relative theme-rounded-xl overflow-hidden theme-shadow-card">
                            <div className="aspect-[4/3] relative">
                                <img
                                    src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                                    alt="Professional driving lesson in Australia"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-teal-900/60 via-transparent to-transparent" />

                                {/* Badge: Pass Rate */}
                                <div className="absolute top-6 right-6 theme-bg-primary text-white px-4 py-3 theme-rounded-xl flex items-center space-x-2 theme-shadow-card">
                                    <CheckCircle className="h-5 w-5" />
                                    <div>
                                        <div className="text-sm font-bold">95%</div>
                                        <div className="text-xs opacity-90">Pass Rate</div>
                                    </div>
                                </div>

                                {/* Badge: RMS */}
                                <div className="absolute top-6 left-6 theme-bg-accent text-white px-4 py-3 theme-rounded-xl flex items-center space-x-2 theme-shadow-card">
                                    <Shield className="h-5 w-5" />
                                    <div>
                                        <div className="text-sm font-bold">RMS</div>
                                        <div className="text-xs opacity-90">Approved</div>
                                    </div>
                                </div>

                                {/* Play Button */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <button className="bg-white/20 theme-backdrop-blur-sm theme-rounded-full p-8 hover:bg-white/30 transition-all duration-300 group hover:scale-110">
                                        <Play className="h-12 w-12 text-white group-hover:scale-110 transition-transform ml-1" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Floating Testimonial */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.6 }}
                            className="absolute -bottom-6 -left-6 bg-white theme-rounded-xl p-6 theme-shadow-card max-w-sm border-l-4 theme-border-primary"
                        >
                            <div className="flex items-start space-x-4">
                                <img
                                    src="https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
                                    alt="Happy driving student"
                                    className="w-12 h-12 rounded-full object-cover"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center space-x-1 mb-2">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                                        ))}
                                    </div>
                                    <p className="text-gray-700 text-sm font-medium mb-1">
                                        "Passed first go! Best instructor in Sydney. Highly recommended!"
                                    </p>
                                    <p className="text-gray-500 text-xs">— Emma S., Recent Graduate</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Experience Badge */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.8 }}
                            className="absolute -top-6 -right-6 theme-gradient-button theme-rounded-xl p-6 theme-shadow-card text-white"
                        >
                            <div className="flex items-center space-x-3">
                                <Users className="h-10 w-10" />
                                <div>
                                    <div className="text-3xl font-bold">15+</div>
                                    <div className="text-sm opacity-90">Years Experience</div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>

                {/* ================= Scroll Indicator ================= */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 1 }}
                    className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-emerald-300"
                >
                    <div className="flex flex-col items-center space-y-2">
                        <span className="text-sm">Learn More</span>
                        <ChevronDown className="h-5 w-5 animate-bounce" />
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
