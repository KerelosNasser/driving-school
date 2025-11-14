'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@clerk/nextjs';

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


import UserDataDisplay from './components/UserDataDisplay';
import UserDataReview from './components/UserDataReview';
import { LoadingIndicator } from '@/components/ui/loading-indicator';

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

      // Ensure remaining_hours is calculated
      const quotaData = {
        ...data.quota,
        remaining_hours: (data.quota.total_hours || 0) - (data.quota.used_hours || 0)
      };
      
      setQuota(quotaData);

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
      <div className="min-h-screen bg-gradient-to-r from-emerald-900/95 via-teal-800/90 to-blue-900/95 flex items-center justify-center px-4">
        <div className="flex flex-col items-center space-y-4 p-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-xl">
          <Car className="h-10 w-10 text-emerald-600" />
          <LoadingIndicator color="#059669" size="medium" text="Loading dashboard..." variant="bars" />
        </div>
      </div>
    );
  }

  // Show sign-in prompt if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-emerald-900/95 via-teal-800/90 to-blue-900/95 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto mb-4 p-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full w-16 h-16 flex items-center justify-center">
                <Car className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Service Center
              </CardTitle>
              <CardDescription className="text-base text-gray-600 mt-2">
                Access your driving dashboard to manage lessons and track progress.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pt-0">
              <div className="grid grid-cols-3 gap-4 mb-6 text-xs text-gray-500">
                <div className="flex flex-col items-center space-y-1">
                  <Gauge className="h-4 w-4 text-emerald-500" />
                  <span>Track Progress</span>
                </div>
                <div className="flex flex-col items-center space-y-1">
                  <Users className="h-4 w-4 text-teal-500" />
                  <span>Connect</span>
                </div>
                <div className="flex flex-col items-center space-y-1">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span>Achieve Goals</span>
                </div>
              </div>
              <SignInButton mode="modal">
                <Button className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-lg shadow-lg">
                  <Car className="mr-2 h-4 w-4" />
                  Start Your Journey
                </Button>
              </SignInButton>
              <p className="text-xs text-gray-400 mt-3">
                Secure access to your learning experience
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-gradient-to-r from-emerald-900/95 via-teal-800/90 to-blue-900/95">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.2'%3E%3Cpath d='M0 20h40v2H0zM20 0v40h-2V0z'/%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: "40px 40px",
            }}
          />
        </div>
        
        {/* Simple Orbs */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-teal-400/20 rounded-full blur-2xl"></div>

        <div className="container mx-auto px-4 py-12 mt-10 relative z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center justify-center mb-6">
              <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full mb-4 shadow-lg">
                <Car className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white via-emerald-100 to-teal-200 bg-clip-text text-transparent mb-2">
                  Service Center
                </h1>
                <div className="h-1 w-20 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full mx-auto"></div>
              </div>
            </div>
            <p className="text-base sm:text-lg text-blue-100 max-w-2xl mx-auto leading-relaxed px-4">
              Your dashboard for managing driving lessons, tracking progress, and connecting with expert instructors.
            </p>

            {/* Feature highlights */}
            <div className="grid grid-cols-3 gap-4 mt-6 max-w-md mx-auto">
              <div className="flex flex-col items-center space-y-2 text-xs text-blue-200">
                <div className="p-2 bg-white/10 rounded-full">
                  <Gauge className="h-4 w-4 text-emerald-300" />
                </div>
                <span>Progress</span>
              </div>
              <div className="flex flex-col items-center space-y-2 text-xs text-blue-200">
                <div className="p-2 bg-white/10 rounded-full">
                  <Zap className="h-4 w-4 text-teal-300" />
                </div>
                <span>Booking</span>
              </div>
              <div className="flex flex-col items-center space-y-2 text-xs text-blue-200">
                <div className="p-2 bg-white/10 rounded-full">
                  <Shield className="h-4 w-4 text-blue-300" />
                </div>
                <span>Secure</span>
              </div>
            </div>
          </div>

          {/* Quota Overview Card */}
          <div className="mb-8">
            <Card className="bg-gradient-to-r from-emerald-600 via-teal-700 to-blue-800 text-white shadow-xl border-0 overflow-hidden relative">
              {/* Simple background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 right-4 w-20 h-20 border border-white/20 rounded-full"></div>
                <div className="absolute bottom-4 left-4 w-16 h-16 border border-white/20 rounded-full"></div>
              </div>

              <CardHeader className="relative z-10 pb-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 backdrop-blur-sm rounded-full">
                      <Gauge className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <span className="text-lg sm:text-xl font-bold">Hours Dashboard</span>
                      <div className="text-emerald-100 text-sm font-normal">Track your progress</div>
                    </div>
                  </div>
                  <Car className="h-5 w-5 text-emerald-200" />
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                {loading ? (
                  <div className="flex items-center justify-center py-6">
                    <LoadingIndicator color="#a7f3d0" size="small" text="Loading progress..." variant="lines" />
                  </div>
                ) : error ? (
                  <Alert className="bg-red-500/20 border-red-300/30">
                    <AlertCircle className="h-4 w-4 text-red-200" />
                    <AlertDescription className="text-red-100 flex items-center justify-between">
                      <span className="font-medium">{error.message}</span>
                      {error.isInternal && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={refreshQuota}
                          disabled={isRefreshing}
                          className="ml-3 bg-white/10 border-white/20 text-white hover:bg-white/20"
                        >
                          {isRefreshing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-br from-white to-emerald-100 bg-clip-text text-transparent">
                        {quota?.total_hours || 0}
                      </div>
                      <div className="text-emerald-100 font-medium text-sm sm:text-base">Total Hours</div>
                      <div className="text-emerald-200 text-xs mt-1">Available</div>
                      <div className="mt-2 p-2 bg-white/10 rounded-lg">
                        <Clock className="h-4 w-4 mx-auto text-emerald-200" />
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-br from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                        {quota?.used_hours || 0}
                      </div>
                      <div className="text-emerald-100 font-medium text-sm sm:text-base">Used Hours</div>
                      <div className="text-emerald-200 text-xs mt-1">Completed</div>
                      <div className="mt-2 p-2 bg-white/10 rounded-lg">
                        <Trophy className="h-4 w-4 mx-auto text-yellow-300" />
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-br from-teal-300 to-blue-300 bg-clip-text text-transparent">
                        {quota?.remaining_hours || 0}
                      </div>
                      <div className="text-emerald-100 font-medium text-sm sm:text-base">Available</div>
                      <div className="text-emerald-200 text-xs mt-1">Ready</div>
                      <div className="mt-2 p-2 bg-white/10 rounded-lg">
                        <Zap className="h-4 w-4 mx-auto text-teal-300" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Progress bar */}
                {quota && !loading && !error && (
                  <div className="mt-6 pt-4 border-t border-white/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-emerald-100 font-medium text-sm">Learning Progress</span>
                      <span className="text-emerald-200 text-xs">
                        {quota.total_hours > 0 ? Math.round((quota.used_hours / quota.total_hours) * 100) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-yellow-400 to-orange-400 h-full rounded-full"
                        style={{
                          width: quota.total_hours > 0
                            ? `${Math.min((quota.used_hours / quota.total_hours) * 100, 100)}%`
                            : '0%'
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          {/* Main Content Tabs */}
          <div className="max-w-6xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex justify-center mb-6">
                <TabsList variant="service" size="lg" className="grid grid-cols-6 w-full max-w-3xl">
                  <TabsTrigger
                    value="quota"
                    variant="service" size="sm"
                  >
                    <Car className="h-4 w-4" />
                    <span className="hidden sm:inline">Quota</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="negotiation"
                    variant="service" size="sm"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span className="hidden sm:inline">Chat</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="history"
                    variant="service" size="sm"
                  >
                    <Gauge className="h-4 w-4" />
                    <span className="hidden sm:inline">History</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="profile"
                    variant="service" size="sm"
                  >
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline">Profile</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="referrals"
                    variant="service" size="sm"
                  >
                    <Users className="h-4 w-4" />
                    <span className="hidden sm:inline">Referrals</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="quota" className="mt-0">
                <div className="bg-white/95 backdrop-blur-sm rounded-lg border border-emerald-200/50 shadow-lg p-4">
                  <QuotaManagementTab
                    userId={user?.id || ''}
                    onQuotaUpdate={refreshQuota}
                    userEmail={user?.emailAddresses?.[0]?.emailAddress || ''}
                  />
                </div>
              </TabsContent>

              <TabsContent value="negotiation" className="mt-0">
                <div className="bg-white/95 backdrop-blur-sm rounded-lg border border-emerald-200/50 shadow-lg p-4">
                  <NegotiationTab />
                </div>
              </TabsContent>



              <TabsContent value="history" className="mt-0">
                <div className="bg-white/95 backdrop-blur-sm rounded-lg border border-emerald-200/50 shadow-lg p-4">
                  <TransactionHistoryTab />
                </div>
              </TabsContent>

              <TabsContent value="profile" className="mt-0">
                <div className="bg-white/95 backdrop-blur-sm rounded-lg border border-emerald-200/50 shadow-lg">
                  <div className="p-4 border-b border-emerald-100">
                    <UserDataDisplay />
                  </div>
                  <div className="p-4">
                    <div className="mb-4">
                      <h2 className="text-lg font-semibold flex items-center gap-2 text-emerald-700">
                        <Shield className="h-5 w-5" />
                        Profile Review
                      </h2>
                      <p className="text-sm text-emerald-600/80 mt-1">
                        Review and verify your information
                      </p>
                    </div>
                    <UserDataReview asTabContent={true} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="referrals" className="mt-0">
                <div className="bg-white/95 backdrop-blur-sm rounded-lg border border-emerald-200/50 shadow-lg p-4">
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-emerald-700">
                      <Users className="h-5 w-5" />
                      Referral Program
                    </h2>
                    <p className="text-sm text-emerald-600/80 mt-1">
                      Invite friends and earn rewards!
                    </p>
                  </div>
                  <InvitationDashboard />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
  );
}
