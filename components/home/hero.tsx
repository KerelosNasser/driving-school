"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";

interface HeroProps {
  title?: string | null;
  subtitle?: string | null;
  features?: { text?: string | null }[];
  backgroundImage?: string;
}

const featureIcons = [Award, Car, Calendar, Clock];

export function Hero({
  subtitle = "Certified instructors, modern vehicles, and lessons tailored for your success on the road. Join thousands who passed their test with us.",
  features = [],
}: HeroProps) {
  const [showFeatures, setShowFeatures] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [testPackage, setTestPackage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const defaultFeatures = [
    { text: "RMS Approved Instructors" },
    { text: "Modern Dual-Control Cars" },
    { text: "7 Days a Week Available" },
    { text: "95% First-Time Pass Rate" },
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
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch test package
  useEffect(() => {
    const fetchTestPackage = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/packages");

        if (response.ok) {
          const data = await response.json();
          // Find the test package (assuming it's marked as popular or has a specific identifier)
          const testPkg =
            data.packages?.find((pkg: any) => pkg.popular) ||
            data.packages?.[0];
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
                <span className="block bg-gradient-to-r from-white via-emerald-100 to-teal-200 bg-clip-text text-transparent mb-1">
                  Learn to Drive
                </span>
                <span className="block theme-text-primary mb-1">
                  with Confidence
                </span>
                <span className="block text-2xl sm:text-3xl lg:text-4xl text-blue-200">
                  in Australia
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                {subtitle}
              </p>
            </motion.div>

            {/* Stats */}
            <motion.div
              className="grid grid-cols-3 gap-4 py-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="text-center p-4 bg-white/10 theme-backdrop-blur-sm theme-rounded-lg">
                <div className="text-2xl sm:text-3xl font-bold theme-text-primary">
                  3,500+
                </div>
                <div className="text-xs sm:text-sm text-blue-200">
                  Students Passed
                </div>
              </div>

              <div className="text-center p-4 bg-white/10 theme-backdrop-blur-sm theme-rounded-lg">
                <div className="text-2xl sm:text-3xl font-bold text-yellow-400">
                  95%
                </div>
                <div className="text-xs sm:text-sm text-blue-200">
                  First-Time Pass
                </div>
              </div>

              <div className="text-center p-4 bg-white/10 theme-backdrop-blur-sm theme-rounded-lg">
                <div className="text-2xl sm:text-3xl font-bold text-orange-400">
                  4.9★
                </div>
                <div className="text-xs sm:text-sm text-blue-200">
                  Google Rating
                </div>
              </div>
            </motion.div>

            {/* CTAs */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <button className="theme-gradient-button text-white font-bold px-8 py-1 text-lg theme-shadow-button hover:shadow-emerald-500/25 transition-all duration-300 transform hover:scale-105 theme-rounded-lg">
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
                    className={`h-4 w-4 transition-transform ${
                      showFeatures ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </motion.div>
            )}

            {/* Features List */}
            <motion.div
              className={`${
                isMobile
                  ? `overflow-hidden transition-all duration-500 ${
                      showFeatures
                        ? "max-h-96 opacity-100"
                        : "max-h-0 opacity-0"
                    }`
                  : "block"
              } ${!isMobile ? "pt-6" : "pt-2"}`}
              initial={!isMobile ? { opacity: 0, y: 20 } : {}}
              animate={!isMobile ? { opacity: 1, y: 0 } : {}}
              transition={!isMobile ? { duration: 0.6, delay: 0.5 } : {}}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {displayFeatures.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 bg-white/10 theme-backdrop-blur-sm theme-rounded-lg hover:bg-white/15 transition-all duration-200"
                  >
                    <div className="theme-bg-primary/20 theme-rounded-lg p-2">
                      <feature.icon className="h-5 w-5 theme-text-primary" />
                    </div>
                    <span className="text-sm font-medium text-blue-100">
                      {feature.text}
                    </span>
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
                <div className="relative bg-white/90 backdrop-blur-sm rounded-4xl overflow-hidden border border-white/30 shadow-2xl">
                  {/* Card content */}
                  <div className="p-6">
                    {/* Package title and badge */}
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {testPackage?.name || "Test Preparation"}
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
                            isMobile ? "rounded-full" : "rounded-full"
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
                              : "499"}
                          </div>
                          <div className="text-white/80 text-xs mt-1">
                            {testPackage?.hours || 10} hours
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Features list - compact for mobile */}
                    <div className="mb-6">
                      <div className="space-y-3">
                        {testPackage?.features
                          ?.slice(0, 3)
                          .map((feature: string, index: number) => (
                            <div key={index} className="flex items-center">
                              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
                                <Check className="h-3 w-3 text-emerald-600" />
                              </div>
                              <span className="text-gray-700 text-sm">
                                {feature}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* CTA button - full width and prominent */}
                    <button className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Book Test Package
                    </button>
                  </div>

                  {/* Bottom note */}
                  <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
                    <p className="text-gray-500 text-xs text-center">
                      Includes test day booking and car hire
                    </p>
                  </div>
                </div>

                {/* Floating tag */}
                <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-white text-emerald-700 text-sm font-bold px-4 py-2 rounded-full shadow-lg whitespace-nowrap">
                  Best value for test preparation
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
