"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useUser } from '@clerk/nextjs';
import {
    Calendar,
    Car,
    Award,
    Clock,
    Star,
    ChevronDown,
    MapPin,
    Phone,
    Check,
    Loader2,
    MessageCircle,
    Package,
    HelpCircle,
} from "lucide-react";
import { PageContent, getContentValue } from '@/lib/content';
import { EditableText } from "../ui/editable-text";
import { OnboardingDialog } from "../ui/onboarding-dialog";
import { Button } from "../ui/button";

interface HeroProps {
    content: PageContent;
}

const featureIcons = [Award, Car, Calendar, Clock];

export function Hero({ content }: HeroProps) {
    const [showFeatures, setShowFeatures] = useState(false);
    const [testPackage, setTestPackage] = useState<unknown>(null);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);
    const { user, isSignedIn } = useUser();
    const [isMobile, setIsMobile] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showChatbot, setShowChatbot] = useState(false);

    // Detect mobile devices
    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkIsMobile();
        window.addEventListener('resize', checkIsMobile);

        return () => {
            window.removeEventListener('resize', checkIsMobile);
        };
    }, []);

    // Simplified package fetching
    useEffect(() => {
        const fetchTestPackage = async () => {
            try {
                const response = await fetch("/api/packages");
                if (response.ok) {
                    const data = await response.json();
                    const testPkg = data.packages?.find((pkg: unknown) => pkg.popular) || data.packages?.[0];
                    if (testPkg) {
                        setTestPackage({
                            ...testPkg,
                            features: Array.isArray(testPkg.features)
                                ? testPkg.features
                                : typeof testPkg.features === "string"
                                    ? JSON.parse(testPkg.features)
                                    : [],
                        });
                    }
                }
            } catch (error) {
                console.error("Error fetching test package:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTestPackage();
    }, []);

    // Show onboarding for new users
    useEffect(() => {
        const hasSeenOnboarding = localStorage.getItem('eg-driving-school-onboarding-seen');
        if (!hasSeenOnboarding) {
            // Delay to let the page load
            const timer = setTimeout(() => {
                setShowOnboarding(true);
            }, 1000);
            
            return () => clearTimeout(timer);
        }
    }, []);

    // Simplified package purchase handler
    const handlePurchasePackage = async () => {
        if (!testPackage || purchasing) return;

        if (!isSignedIn) {
            window.location.href = '/sign-in';
            return;
        }

        setPurchasing(true);

        try {
            const response = await fetch('/api/create-quota-checkout-enhanced', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    packageId: testPackage.id,
                    acceptedTerms: true,
                    paymentGateway: 'payid'
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.details || data.error || `HTTP ${response.status}`);
            }

            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error('No payment URL received');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert(`Checkout failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setPurchasing(false);
        }
    };

    return (
        <>
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
                                backgroundSize: "40px 40px",
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
                            {/* Headlines */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.7, delay: 0.1 }}
                            >
                                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-3">
                                    <EditableText
                                        contentKey="hero_title_line_1"
                                        tagName="span"
                                        className="block bg-gradient-to-r from-white via-emerald-100 to-teal-200 bg-clip-text text-transparent mb-1"
                                    >
                                        Learn to Drive
                                    </EditableText>
                                    <EditableText
                                        contentKey="hero_title_line_2"
                                        tagName="span"
                                        className="block theme-text-primary mb-1"
                                    >
                                        with Confidence
                                    </EditableText>
                                    <EditableText
                                        contentKey="hero_title_line_3"
                                        tagName="span"
                                        className="block text-2xl sm:text-3xl lg:text-4xl text-blue-200"
                                    >
                                        in Australia
                                    </EditableText>
                                </h1>

                                <EditableText
                                    contentKey="hero_subtitle"
                                    tagName="p"
                                    className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
                                    placeholder="Certified instructors, modern vehicles, and lessons tailored for your success on the road."
                                    multiline={true}
                                >
                                    {getContentValue(content, 'hero_subtitle', 'Certified instructors, modern vehicles, and lessons tailored for your success on the road. Join thousands who passed their test with us.')}
                                </EditableText>
                            </motion.div>

                            {/* Stats */}
                            <motion.div
                                className="grid grid-cols-3 gap-4 py-3"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                            >
                                <div className="text-center p-4 bg-white/10 theme-backdrop-blur-sm theme-rounded-lg">
                                    <EditableText
                                        contentKey="hero_stat_1_value"
                                        tagName="div"
                                        className="text-2xl sm:text-3xl font-bold theme-text-primary"
                                        placeholder="3,500+"
                                    >
                                        {getContentValue(content, 'hero_stat_1_value', '3,500+')}
                                    </EditableText>
                                    <EditableText
                                        contentKey="hero_stat_1_label"
                                        tagName="div"
                                        className="text-xs sm:text-sm text-blue-200"
                                        placeholder="Students Passed"
                                    >
                                        {getContentValue(content, 'hero_stat_1_label', 'Students Passed')}
                                    </EditableText>
                                </div>

                                <div className="text-center p-4 bg-white/10 theme-backdrop-blur-sm theme-rounded-lg">
                                    <EditableText
                                        contentKey="hero_stat_2_value"
                                        tagName="div"
                                        className="text-2xl sm:text-3xl font-bold text-yellow-400"
                                        placeholder="95%"
                                    >
                                        {getContentValue(content, 'hero_stat_2_value', '95%')}
                                    </EditableText>
                                    <EditableText
                                        contentKey="hero_stat_2_label"
                                        tagName="div"
                                        className="text-xs sm:text-sm text-blue-200"
                                        placeholder="First-Time Pass"
                                    >
                                        {getContentValue(content, 'hero_stat_2_label', 'First-Time Pass')}
                                    </EditableText>
                                </div>

                                <div className="text-center p-4 bg-white/10 theme-backdrop-blur-sm theme-rounded-lg">
                                    <EditableText
                                        contentKey="hero_stat_3_value"
                                        tagName="div"
                                        className="text-2xl sm:text-3xl font-bold text-orange-400"
                                        placeholder="4.9★"
                                    >
                                        {getContentValue(content, 'hero_stat_3_value', '4.9★')}
                                    </EditableText>
                                    <EditableText
                                        contentKey="hero_stat_3_label"
                                        tagName="div"
                                        className="text-xs sm:text-sm text-blue-200"
                                        placeholder="Google Rating"
                                    >
                                        {getContentValue(content, 'hero_stat_3_label', 'Google Rating')}
                                    </EditableText>
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
                                    <EditableText
                                        contentKey="hero_cta_primary"
                                        tagName="span"
                                        placeholder="Book Your Lesson Now"
                                    >
                                        Book Your Lesson Now
                                    </EditableText>
                                </button>

                                <button className="border-2 theme-border-primary theme-text-primary bg-white/10 hover:theme-bg-primary hover:text-teal-900 font-bold px-8 py-4 text-lg theme-backdrop-blur-sm transition-all duration-300 theme-rounded-lg">
                                    <Phone className="h-5 w-5 mr-2 inline" />
                                    <EditableText
                                        contentKey="hero_cta_secondary"
                                        tagName="span"
                                        placeholder="Call (04) 1234 5678"
                                    >
                                        Call (04) 1234 5678
                                    </EditableText>
                                </button>
                            </motion.div>

                            {/* Features */}
                            <motion.div
                                className="pt-6 md:block"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.5 }}
                            >
                                <div className="md:hidden mb-4">
                                    <button
                                        onClick={() => setShowFeatures(!showFeatures)}
                                        className="text-emerald-300 hover:text-white hover:bg-white/10 w-full justify-between flex items-center px-4 py-2 rounded-lg transition-all duration-300"
                                    >
                                        <span>What makes us different?</span>
                                        <ChevronDown
                                            className={`h-4 w-4 transition-transform ${
                                                showFeatures ? "rotate-180" : ""
                                            }`}
                                        />
                                    </button>
                                </div>

                                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 md:block ${
                                    showFeatures || 'hidden md:grid'
                                }`}>
                                    {[0, 1, 2, 3].map((index) => (
                                        <div
                                            key={index}
                                            className="flex items-center space-x-3 bg-white/10 theme-backdrop-blur-sm theme-rounded-lg hover:bg-white/15 transition-all duration-200 p-3"
                                        >
                                            <div className="theme-bg-primary/20 theme-rounded-lg p-2">
                                                <Award className="h-5 w-5 theme-text-primary" />
                                            </div>
                                            <EditableText
                                                contentKey={`hero_feature_${index + 1}`}
                                                tagName="span"
                                                className="text-sm font-medium text-blue-100"
                                                placeholder={['Licensed Instructors', 'Modern Vehicles', 'Flexible Scheduling', 'Personalized Pace'][index]}
                                            >
                                                {getContentValue(content, `hero_feature_${index + 1}`, ['Licensed Instructors', 'Modern Vehicles', 'Flexible Scheduling', 'Personalized Pace'][index])}
                                            </EditableText>
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
                                <EditableText
                                    contentKey="hero_locations"
                                    tagName="span"
                                    placeholder="Serving Sydney, Melbourne, Brisbane & Perth"
                                >
                                    Serving Sydney, Melbourne, Brisbane & Perth
                                </EditableText>
                            </motion.div>
                        </div>

                        {/* ================= Right Column: Unique Package Card ================= */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="relative order-1 lg:order-2 flex justify-center items-center"
                        >
                            <div className="w-full max-w-md">
                                {/* Mobile-first card design */}
                                <div className="relative">
                                    {/* Card background with unique shape */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-teal-500/20 rounded-3xl blur-xl"></div>

                                    {/* Main card container */}
                                    <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl overflow-hidden border border-white/30 shadow-2xl">
                                        {/* Card content */}
                                        <div className="p-6">
                                            {/* Package title and badge */}
                                            <div className="flex justify-between items-start mb-6">
                                                <div>
                                                    <h3 className="text-xl font-bold text-gray-900">
                                                        {testPackage?.name || "Test prep intensive"}
                                                    </h3>
                                                    <div className="w-12 h-1 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full mt-2"></div>
                                                </div>
                                                {testPackage?.popular && (
                                                    <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center">
                                                        <Star className="h-3 w-3 mr-1" />
                                                        POPULAR
                                                    </div>
                                                )}
                                            </div>

                                            {/* Price display - circular badge for mobile, rectangular for desktop */}
                                            <div className="flex justify-center mb-6">
                                                <div
                                                    className={`relative ${
                                                        isMobile ? "w-32 h-32" : "w-40 h-24"
                                                    } flex items-center justify-center`}
                                                >
                                                    <div
                                                        className={`absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 ${
                                                            isMobile ? "rounded-full" : "rounded-2xl"
                                                        } shadow-lg`}
                                                    ></div>
                                                    <div className="relative z-10 text-center">
                                                        <div className="text-white text-xs font-medium mb-1">
                                                            ONLY
                                                        </div>
                                                        <div className="text-white text-3xl font-bold">
                                                            $
                                                            {testPackage?.price
                                                                ? testPackage.price.toFixed(0)
                                                                : "208"}
                                                        </div>
                                                        <div className="text-white/80 text-xs mt-1">
                                                            {testPackage?.hours || 3} hours
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Features list - compact for mobile */}
                                            <div className="mb-6">
                                                <div className="space-y-3">
                                                    {(testPackage?.features || ['Best for learners preparing driving test', 'Dedicated feedback after session', 'Comprehensive coverage'])
                                                        .slice(0, 3)
                                                        .map((feature: string, index: number) => (
                                                            <div key={index} className="flex items-center">
                                                                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
                                                                    <Check className="h-3 w-3 text-emerald-600" />
                                                                </div>
                                                                <span className="text-gray-700 text-sm">{feature}</span>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>

                                            {/* CTA button - full width and prominent */}
                                            <button
                                                onClick={handlePurchasePackage}
                                                disabled={purchasing}
                                                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center"
                                            >
                                                {purchasing ? (
                                                    <>
                                                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Calendar className="h-5 w-5 mr-2" />
                                                        Book Test Package
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        {/* Bottom note */}
                                        <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
                                            <p className="text-gray-500 text-xs text-center">
                                                Includes test day booking and car hire
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>
            {/* Floating Navigation Buttons */}
            <div className="fixed bottom-6 right-6 z-40 flex flex-col space-y-3">
                {/* AI Chatbot Button */}
                <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 2, duration: 0.5 }}
                >
                    <Button
                        onClick={() => setShowChatbot(true)}
                        className="w-14 h-14 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 group"
                        title="Chat with AI Assistant"
                    >
                        <MessageCircle className="h-6 w-6 text-white group-hover:animate-pulse" />
                    </Button>
                </motion.div>

                {/* Packages Page Button */}
                <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 2.2, duration: 0.5 }}
                >
                    <Button
                        onClick={() => window.location.href = '/packages'}
                        className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 group"
                        title="View All Packages"
                    >
                        <Package className="h-6 w-6 text-white group-hover:animate-bounce" />
                    </Button>
                </motion.div>

                {/* Help/Onboarding Button */}
                <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 2.4, duration: 0.5 }}
                >
                    <Button
                        onClick={() => setShowOnboarding(true)}
                        className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 group"
                        title="Take Site Tour"
                    >
                        <HelpCircle className="h-6 w-6 text-white group-hover:animate-spin" />
                    </Button>
                </motion.div>
            </div>

            {/* AI Chatbot Modal */}
            {showChatbot && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-2xl">
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 text-white">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">AI Assistant</h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowChatbot(false)}
                                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-full w-8 h-8 p-0"
                                >
                                    ×
                                </Button>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                <div className="bg-gray-100 rounded-lg p-3">
                                    <p className="text-sm text-gray-700">
                                        👋 Hi! I'm your AI driving instructor assistant. I can help you with:
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <button className="w-full text-left p-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors">
                                        <div className="font-medium text-emerald-800">📚 Learning Resources</div>
                                        <div className="text-sm text-emerald-600">Road rules, practice tests</div>
                                    </button>
                                    <button className="w-full text-left p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
                                        <div className="font-medium text-blue-800">📅 Booking Help</div>
                                        <div className="text-sm text-blue-600">Schedule lessons, reschedule</div>
                                    </button>
                                    <button className="w-full text-left p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors">
                                        <div className="font-medium text-purple-800">💰 Package Info</div>
                                        <div className="text-sm text-purple-600">Compare packages, pricing</div>
                                    </button>
                                    <button className="w-full text-left p-3 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors">
                                        <div className="font-medium text-orange-800">❓ General Questions</div>
                                        <div className="text-sm text-orange-600">About lessons, instructors</div>
                                    </button>
                                </div>
                            </div>
                            <div className="mt-4 text-center">
                                <p className="text-xs text-gray-500">
                                    This is a demo chatbot. Full AI integration coming soon!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Onboarding Dialog */}
            <OnboardingDialog
                isOpen={showOnboarding}
                onClose={() => setShowOnboarding(false)}
            />
        </>
    );
}