'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Car, Shield, Lightbulb, Gauge } from 'lucide-react';
import { useEffect, useState } from 'react';

interface FullScreenLoadingProps {
  show: boolean;
  tip?: {
    text: string;
    Icon: React.ComponentType<{ className?: string }>;
  } | undefined;
  loadingText?: string;
}

const loadingVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  exit: { 
    opacity: 0, 
    scale: 1.05,
    transition: {
      duration: 0.4,
      ease: 'easeIn'
    }
  }
};

const carVariants = {
  animate: {
    x: [0, 10, 0],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

const roadLineVariants = {
  animate: {
    x: [-100, 0],
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear'
    }
  }
};

export function FullScreenLoading({ show, tip, loadingText = 'Preparing your booking...' }: FullScreenLoadingProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!show) return;
    
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, [show]);

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          key="loading-overlay"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={loadingVariants}
          className="fixed inset-0 z-[9999] bg-gradient-to-br from-emerald-900 via-teal-800 to-blue-900"
        >
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Cpath d='M0 30h60v2H0zM30 0v60h-2V0z'/%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: "60px 60px",
              }}
            />
          </div>

          {/* Animated Orbs */}
          <motion.div 
            className="absolute top-20 left-20 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          <motion.div 
            className="absolute bottom-20 right-20 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.5
            }}
          />

          {/* Main Content */}
          <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
            {/* Animated Car Icon */}
            <motion.div
              variants={carVariants}
              animate="animate"
              className="mb-12"
            >
              <div className="relative">
                <div className="p-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl shadow-2xl">
                  <Car className="h-16 w-16 text-white" />
                </div>
                {/* Glow effect */}
                <div className="absolute inset-0 bg-emerald-400/30 rounded-3xl blur-xl animate-pulse" />
              </div>
            </motion.div>

            {/* Road Animation */}
            <div className="w-full max-w-xs mb-8 overflow-hidden">
              <div className="h-1 bg-white/10 rounded-full relative">
                <motion.div
                  className="absolute inset-y-0 left-0 w-full"
                  style={{
                    background: 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(255,255,255,0.4) 10px, rgba(255,255,255,0.4) 30px)',
                  }}
                  animate={{
                    x: [-100, 0],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                />
              </div>
            </div>

            {/* Loading Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-8"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                {loadingText}
                <span className="inline-block w-12 text-left">{dots}</span>
              </h2>
              <p className="text-emerald-200 text-lg">Just a moment while we get everything ready</p>
            </motion.div>

            {/* Driving Tip Card */}
            {tip && (
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="max-w-md w-full"
              >
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-2xl">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="p-3 bg-emerald-500/20 rounded-full">
                        <tip.Icon className="h-6 w-6 text-emerald-300" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-emerald-200 font-semibold text-sm uppercase tracking-wide mb-2 flex items-center">
                        <Lightbulb className="h-4 w-4 mr-2" />
                        Driving Tip
                      </h3>
                      <p className="text-white text-base leading-relaxed">
                        {tip.text}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Progress Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-12 flex space-x-2"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-emerald-400 rounded-full"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
