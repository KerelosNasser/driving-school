'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { Clock, MessageSquare, AlertCircle, Loader2,
  RefreshCw, Car, Gauge, Users, Trophy, Zap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SignInButton } from '@clerk/nextjs';
import { toast } from 'sonner';
import QuotaManagementTab from './components/QuotaManagementTab';
import NegotiationTab from './components/NegotiationTab';
import TransactionHistoryTab from './components/TransactionHistoryTab';
import InvitationDashboard from '@/components/InvitationDashboard';
import Providers from './providers';
import UserDataDisplay from './components/UserDataDisplay';
import UserDataReview from './components/UserDataReview';

interface UserQuota {
  user_id: string;
  total_hours: number;
  used_hours: number;
  remaining_hours: number;
  created_at: string;
  updated_at: string; 
}

interface ErrorState {
  message: string;
  isInternal: boolean;
  firstOccurrence: number;
  suppressUntil?: number;
}

export default function ServiceCenterPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [quota, setQuota] = useState<UserQuota | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorState | null>(null);
  const [activeTab, setActiveTab] = useState('quota');
  const [lastRefreshAttempt, setLastRefreshAttempt] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasFetchedRef = useRef(false);

  // Smart error handling with suppression for internal server errors
  const handleError = useCallback((errorMessage: string, isRetry: boolean = false) => {
    const isInternal = errorMessage.toLowerCase().includes('internal server error') ||
      errorMessage.toLowerCase().includes('500') ||
      errorMessage.includes('Failed to fetch');

    const now = Date.now();

    // If it's an internal server error and we've shown it before
    if (isInternal && error?.isInternal && !isRetry) {
      // Check if we should suppress this error (within 5 minutes of first occurrence)
      const timeSinceFirst = now - error.firstOccurrence;
      if (timeSinceFirst < 300000) { // 5 minutes in milliseconds
        console.warn('Suppressing repeated internal server error:', errorMessage);
        return;
      }
    }

    setError({
      message: errorMessage,
      isInternal,
      firstOccurrence: error?.isInternal && isInternal ? error.firstOccurrence : now,
      ...(isInternal && { suppressUntil: now + 300000 })
    });
  }, [error]);

  // Fetch user's quota information with improved error handling
  const fetchQuota = useCallback(async (isRetry: boolean = false) => {
    if (!user) return;

    try {
      if (!isRetry) {
        setLoading(true);
      }
      setError(null);

      const response = await fetch('/api/quota');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch quota');
      }

      setQuota(data.quota);

      // Clear any previous errors on success
      if (error) {
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching quota:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load quota information';
      handleError(errorMessage, isRetry);
    } finally {
      if (!isRetry) {
        setLoading(false);
      }
    }
  }, [user, handleError, error]);

  useEffect(() => {
    if (isUserLoaded && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchQuota();
    }
  }, [isUserLoaded, fetchQuota]);

  // Refresh quota data with cooldown period
  const refreshQuota = useCallback(async () => {
    if (!user) return;

    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshAttempt;

    // Enforce 5-minute cooldown for manual refresh attempts
    if (timeSinceLastRefresh < 300000) {
      const remainingTime = Math.ceil((300000 - timeSinceLastRefresh) / 1000);
      toast.error(`Please wait ${Math.floor(remainingTime / 60)}m ${remainingTime % 60}s before refreshing again`);
      return;
    }

    setLastRefreshAttempt(now);
    setIsRefreshing(true);

    try {
      await fetchQuota(true);
      toast.success('Data refreshed successfully');
    } catch (err) {
      console.error('Error refreshing quota:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [user, lastRefreshAttempt, fetchQuota]);

  // Show loading state while user data is loading
  if (!isUserLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center space-y-4 p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20"
        >
          <div className="relative">
            <Car className="h-12 w-12 text-blue-600 animate-bounce" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full animate-ping"></div>
          </div>
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-lg font-medium text-gray-700">Loading your dashboard...</span>
          </div>
          <div className="text-sm text-gray-500">Preparing your driving journey</div>
        </motion.div>
      </div>
    );
  }

  // Show sign-in prompt if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <Card className="bg-white/90 backdrop-blur-sm shadow-2xl border-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10"></div>
            <CardHeader className="text-center relative z-10 pb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mx-auto mb-4 p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full w-20 h-20 flex items-center justify-center"
              >
                <Car className="h-10 w-10 text-white" />
              </motion.div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Service Center
              </CardTitle>
              <CardDescription className="text-lg text-gray-600 mt-2">
                Access your personalized driving dashboard to manage lessons, track progress, and connect with instructors.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center relative z-10 pt-0">
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <Gauge className="h-4 w-4 text-blue-500" />
                    <span>Track Progress</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-purple-500" />
                    <span>Connect</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <span>Achieve Goals</span>
                  </div>
                </div>
              </div>
              <SignInButton mode="modal">
                <Button className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <Car className="mr-2 h-5 w-5" />
                  Start Your Journey
                </Button>
              </SignInButton>
              <p className="text-xs text-gray-400 mt-4">
                Secure access to your personalized learning experience
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <Providers>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Enhanced Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {/* Floating Cars with Interactive Motion */}
          <motion.div
            className="absolute top-20 left-10"
            animate={{
              x: [0, 100, 0],
              y: [0, -20, 0],
              rotate: [0, 5, 0]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Car className="h-8 w-8 text-blue-400/40 drop-shadow-lg" />
          </motion.div>

          <motion.div
            className="absolute top-40 right-20"
            animate={{
              x: [0, -80, 0],
              y: [0, 30, 0],
              rotate: [0, -10, 0]
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          >
            <Gauge className="h-10 w-10 text-purple-400/35 drop-shadow-lg" />
          </motion.div>

          <motion.div
            className="absolute bottom-32 left-1/4"
            animate={{
              x: [0, 60, 0],
              y: [0, -40, 0],
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 4
            }}
          >
            <Trophy className="h-6 w-6 text-yellow-400/40 drop-shadow-lg" />
          </motion.div>

          {/* Animated Gradient Orbs */}
          <motion.div
            className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-blue-200/30 to-blue-300/20 rounded-full blur-xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          <motion.div
            className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-purple-200/30 to-purple-300/20 rounded-full blur-xl"
            animate={{
              scale: [1.2, 0.8, 1.2],
              opacity: [0.4, 0.7, 0.4]
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />

          <motion.div
            className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-to-r from-indigo-200/25 to-indigo-300/15 rounded-full blur-xl"
            animate={{
              scale: [0.9, 1.4, 0.9],
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          />

          {/* Floating Particles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-full"
              style={{
                left: `${15 + i * 12}%`,
                top: `${25 + (i % 3) * 20}%`,
              }}
              animate={{
                y: [0, -120, 0],
                opacity: [0, 1, 0],
                scale: [0.3, 1.2, 0.3]
              }}
              transition={{
                duration: 5 + i * 0.3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.6
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-12"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center mb-6">
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ duration: 0.8, type: "spring", stiffness: 200 }}
                className="p-3 sm:p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4 sm:mb-0 sm:mr-4 shadow-lg"
              >
                <Car className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </motion.div>
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                  Service Center
                </h1>
                <div className="h-1 w-24 sm:w-32 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto"></div>
              </div>
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4"
            >
              Your comprehensive dashboard for managing driving lessons, tracking progress, and connecting with expert instructors on your journey to becoming a confident driver.
            </motion.p>

            {/* Feature highlights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 mt-6 sm:mt-8"
            >
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Gauge className="h-4 w-4 text-blue-600" />
                </div>
                <span className="font-medium">Real-time Progress</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="p-2 bg-purple-100 rounded-full">
                  <Zap className="h-4 w-4 text-purple-600" />
                </div>
                <span className="font-medium">Instant Booking</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="p-2 bg-green-100 rounded-full">
                  <Shield className="h-4 w-4 text-green-600" />
                </div>
                <span className="font-medium">Secure & Safe</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Quota Overview Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8 sm:mb-12"
          >
            <Card className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white shadow-2xl border-0 overflow-hidden relative">
              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 right-4 w-24 h-24 sm:w-32 sm:h-32 border-2 border-white/20 rounded-full"></div>
                <div className="absolute bottom-4 left-4 w-20 h-20 sm:w-24 sm:h-24 border-2 border-white/20 rounded-full"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 sm:w-40 sm:h-40 border border-white/10 rounded-full"></div>
              </div>

              <CardHeader className="relative z-10 pb-4 sm:pb-6">
                <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                  <div className="flex items-center space-x-3 mb-4 sm:mb-0">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="p-3 bg-white/20 backdrop-blur-sm rounded-full"
                    >
                      <Gauge className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                    </motion.div>
                    <div>
                      <span className="text-xl sm:text-2xl font-bold">Driving Hours Dashboard</span>
                      <div className="text-blue-100 text-sm font-normal">Track your learning journey</div>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center space-x-2 text-blue-100">
                    <Car className="h-5 w-5" />
                    <span className="text-sm">Your Progress</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                {loading ? (
                  <div className="flex items-center justify-center py-6 sm:py-8">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="mr-3"
                    >
                      <Loader2 className="h-6 w-6 text-blue-200" />
                    </motion.div>
                    <span className="text-blue-100 text-base sm:text-lg">Loading your progress...</span>
                  </div>
                ) : error ? (
                  <Alert className="bg-red-500/20 border-red-300/30 backdrop-blur-sm">
                    <AlertCircle className="h-5 w-5 text-red-200" />
                    <AlertDescription className="text-red-100 flex flex-col sm:flex-row items-start sm:items-center justify-between">
                      <span className="font-medium mb-2 sm:mb-0">{error.message}</span>
                      {error.isInternal && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={refreshQuota}
                          disabled={isRefreshing}
                          className="ml-0 sm:ml-3 h-9 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
                        >
                          {isRefreshing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                          <span className="ml-2 text-sm">Retry</span>
                        </Button>
                      )}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                      className="text-center group"
                    >
                      <div className="relative mb-4">
                        <div className="text-4xl sm:text-5xl font-bold mb-2 bg-gradient-to-br from-white to-blue-100 bg-clip-text text-transparent">
                          {quota?.total_hours || 0}
                        </div>
                        <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
                      </div>
                      <div className="text-blue-100 font-medium text-base sm:text-lg">Total Hours</div>
                      <div className="text-blue-200 text-sm mt-1">Available for learning</div>
                      <div className="mt-3 p-2 bg-white/10 rounded-lg backdrop-blur-sm group-hover:bg-white/20 transition-all duration-300">
                        <Clock className="h-5 w-5 mx-auto text-blue-200" />
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                      className="text-center group"
                    >
                      <div className="relative mb-4">
                        <div className="text-4xl sm:text-5xl font-bold mb-2 bg-gradient-to-br from-orange-300 to-red-300 bg-clip-text text-transparent">
                          {quota?.used_hours || 0}
                        </div>
                        <div className="absolute -top-2 -right-2 w-4 h-4 bg-orange-400 rounded-full animate-bounce"></div>
                      </div>
                      <div className="text-blue-100 font-medium text-base sm:text-lg">Used Hours</div>
                      <div className="text-blue-200 text-sm mt-1">Lessons completed</div>
                      <div className="mt-3 p-2 bg-white/10 rounded-lg backdrop-blur-sm group-hover:bg-white/20 transition-all duration-300">
                        <Trophy className="h-5 w-5 mx-auto text-orange-300" />
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                      className="text-center group"
                    >
                      <div className="relative mb-4">
                        <div className="text-4xl sm:text-5xl font-bold mb-2 bg-gradient-to-br from-green-300 to-emerald-300 bg-clip-text text-transparent">
                          {quota?.remaining_hours || 0}
                        </div>
                        <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-400 rounded-full animate-ping"></div>
                      </div>
                      <div className="text-blue-100 font-medium text-base sm:text-lg">Remaining Hours</div>
                      <div className="text-blue-200 text-sm mt-1">Ready to book</div>
                      <div className="mt-3 p-2 bg-white/10 rounded-lg backdrop-blur-sm group-hover:bg-white/20 transition-all duration-300">
                        <Zap className="h-5 w-5 mx-auto text-green-300" />
                      </div>
                    </motion.div>
                  </div>
                )}

                {/* Progress bar */}
                {quota && !loading && !error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="mt-6 sm:mt-8 pt-6 border-t border-white/20"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-blue-100 font-medium">Learning Progress</span>
                      <span className="text-blue-200 text-sm">
                        {quota.total_hours > 0 ? Math.round((quota.used_hours / quota.total_hours) * 100) : 0}% Complete
                      </span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: quota.total_hours > 0
                            ? `${Math.min((quota.used_hours / quota.total_hours) * 100, 100)}%`
                            : '0%'
                        }}
                        transition={{ delay: 0.8, duration: 1.5, ease: "easeOut" }}
                        className="bg-gradient-to-r from-orange-400 to-red-400 h-full rounded-full shadow-lg"
                      />
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
                    {/* Main Content Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="max-w-7xl mx-auto"
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex justify-center mb-6">
                <TabsList className="grid grid-cols-5 h-14 w-full max-w-4xl bg-gradient-to-r from-white/90 to-gray-50/90 backdrop-blur-md border-2 border-gray-200/50 shadow-lg rounded-xl p-1">
                  <TabsTrigger
                    value="quota"
                    className="relative flex items-center justify-center space-x-2 rounded-lg font-medium text-xs sm:text-sm
                      data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 
                      data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25
                      data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-blue-600 
                      data-[state=inactive]:hover:bg-blue-50/80 data-[state=inactive]:hover:shadow-md
                      transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95
                      before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-r before:from-blue-400/20 before:to-blue-600/20 
                      before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100"
                  >
                    <Car className="h-4 w-4 transition-transform duration-200 group-hover:rotate-3" />
                    <span className="hidden sm:inline">Quota Management</span>
                    <span className="sm:hidden">Quota</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="negotiation"
                    className="relative flex items-center justify-center space-x-2 rounded-lg font-medium text-xs sm:text-sm
                      data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 
                      data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-green-500/25
                      data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-green-600 
                      data-[state=inactive]:hover:bg-green-50/80 data-[state=inactive]:hover:shadow-md
                      transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95
                      before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-r before:from-green-400/20 before:to-emerald-600/20 
                      before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100"
                  >
                    <MessageSquare className="h-4 w-4 transition-transform duration-200 group-hover:rotate-3" />
                    <span className="hidden sm:inline">Negotiation</span>
                    <span className="sm:hidden">Chat</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="history"
                    className="relative flex items-center justify-center space-x-2 rounded-lg font-medium text-xs sm:text-sm
                      data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-600 
                      data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25
                      data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-purple-600 
                      data-[state=inactive]:hover:bg-purple-50/80 data-[state=inactive]:hover:shadow-md
                      transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95
                      before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-r before:from-purple-400/20 before:to-violet-600/20 
                      before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100"
                  >
                    <Gauge className="h-4 w-4 transition-transform duration-200 group-hover:rotate-3" />
                    <span className="hidden sm:inline">Transaction History</span>
                    <span className="sm:hidden">History</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="profile"
                    className="relative flex items-center justify-center space-x-2 rounded-lg font-medium text-xs sm:text-sm
                      data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-indigo-600 
                      data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/25
                      data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-indigo-600 
                      data-[state=inactive]:hover:bg-indigo-50/80 data-[state=inactive]:hover:shadow-md
                      transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95
                      before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-r before:from-indigo-400/20 before:to-indigo-600/20 
                      before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100"
                  >
                    <Shield className="h-4 w-4 transition-transform duration-200 group-hover:rotate-3" />
                    <span className="hidden sm:inline">Profile</span>
                    <span className="sm:hidden">Profile</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="referrals"
                    className="relative flex items-center justify-center space-x-2 rounded-lg font-medium text-xs sm:text-sm
                      data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 
                      data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/25
                      data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-emerald-600 
                      data-[state=inactive]:hover:bg-emerald-50/80 data-[state=inactive]:hover:shadow-md
                      transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95
                      before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-r before:from-emerald-400/20 before:to-emerald-600/20 
                      before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100"
                  >
                    <Users className="h-4 w-4 transition-transform duration-200 group-hover:rotate-3" />
                    <span className="hidden sm:inline">Referrals</span>
                    <span className="sm:hidden">Refs</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="quota" className="mt-0">
                <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
                  <QuotaManagementTab
                    userId={user?.id || ''}
                    onQuotaUpdate={refreshQuota}
                  />
                </div>
              </TabsContent>

              <TabsContent value="negotiation" className="mt-0">
                <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
                  <NegotiationTab />
                </div>
              </TabsContent>

              <TabsContent value="history" className="mt-0">
                <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
                  <TransactionHistoryTab />
                </div>
              </TabsContent>

              <TabsContent value="profile" className="mt-0">
                <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200 shadow-sm">
                  {/* User Data Display - Compact Dashboard */}
                  <div className="p-4 sm:p-6 border-b border-gray-200">
                    <UserDataDisplay />
                  </div>
                  
                  {/* User Profile Review - Full Content without Dialog */}
                  <div className="p-4 sm:p-6">
                    <div className="mb-4">
                      <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2 text-indigo-600">
                        <Shield className="h-5 w-5" />
                        Profile Review & Verification
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        Review and verify your personal information
                      </p>
                    </div>
                    <UserDataReview asTabContent={true} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="referrals" className="mt-0">
                <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
                  <div className="mb-4">
                    <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2 text-emerald-600">
                      <Users className="h-5 w-5" />
                      Referral Program
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Invite friends and earn rewards! Track your referrals and claim your benefits.
                    </p>
                  </div>
                  <InvitationDashboard />
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>


  </div>
      </div>
    </Providers>
  );
}