'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { Clock, MessageSquare, History, CreditCard, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SignInButton } from '@clerk/nextjs';
import { toast } from 'sonner';
import QuotaManagementTab from './components/QuotaManagementTab';
import NegotiationTab from './components/NegotiationTab';
import TransactionHistoryTab from './components/TransactionHistoryTab';
import UserDataDisplay from './components/UserDataDisplay';
import InvitationDashboard from '@/components/InvitationDashboard';

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
      suppressUntil: isInternal ? now + 300000 : undefined // Suppress for 5 minutes
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
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-900 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Show sign-in prompt if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-900-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Service Center</CardTitle>
            <CardDescription>
              Please sign in to access your driving lesson quota and manage your bookings.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <SignInButton mode="modal">
              <Button className="w-full">
                Sign In to Continue
              </Button>
            </SignInButton>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-900-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Service Center
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Manage your driving lesson quota, communicate with instructors, and track your learning progress.
          </p>
        </motion.div>

        {/* Quota Overview Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-r from-yellow-600 to-yellow-900 text-white m-12">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-6 w-6" />
                <span>Your Quota Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Loading quota information...</span>
                </div>
              ) : error ? (
                <Alert className="bg-red-100 border-red-300">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800 flex items-center justify-between">
                    <span>{error.message}</span>
                    {error.isInternal && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={refreshQuota}
                        disabled={isRefreshing}
                        className="ml-2 h-8"
                      >
                        {isRefreshing ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                        <span className="ml-1 text-xs">Retry</span>
                      </Button>
                    )}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-1">
                      {quota?.total_hours || 0}
                    </div>
                    <div className="text-yellow-100">Total Hours</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-1">
                      {quota?.used_hours || 0}
                    </div>
                    <div className="text-yellow-100">Used Hours</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-1 text-yellow-300">
                      {quota?.remaining_hours || 0}
                    </div>
                    <div className="text-yellow-100">Remaining Hours</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* User Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6"
        >
          <UserDataDisplay />
        </motion.div>

        {/* Invitation Dashboard - Positioned directly below user profile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-emerald-900 text-xl font-semibold">
                Referral Program
              </CardTitle>
              <CardDescription className="text-emerald-700">
                Invite friends and earn rewards! Track your referrals and claim your benefits below.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <InvitationDashboard />
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
              <TabsList className="grid grid-cols-3 h-12 w-full max-w-2xl bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm">
                <TabsTrigger 
                  value="quota" 
                  className="flex items-center justify-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white transition-all duration-200"
                >
                  <CreditCard className="h-4 w-4" />
                  <span className="hidden sm:inline">Quota Management</span>
                  <span className="sm:hidden">Quota</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="negotiation" 
                  className="flex items-center justify-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white transition-all duration-200"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">Negotiation</span>
                  <span className="sm:hidden">Chat</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="history" 
                  className="flex items-center justify-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-200"
                >
                  <History className="h-4 w-4" />
                  <span className="hidden sm:inline">Transaction History</span>
                  <span className="sm:hidden">History</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="quota" className="mt-0">
              <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200 shadow-sm p-6">
                <QuotaManagementTab 
                  quota={quota} 
                  onQuotaUpdate={refreshQuota}
                />
              </div>
            </TabsContent>

            <TabsContent value="negotiation" className="mt-0">
              <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200 shadow-sm p-6">
                <NegotiationTab />
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200 shadow-sm p-6">
                <TransactionHistoryTab />
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}