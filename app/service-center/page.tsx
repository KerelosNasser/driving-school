'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { Clock, MessageSquare, History, CreditCard, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SignInButton } from '@clerk/nextjs';
import QuotaManagementTab from './components/QuotaManagementTab';
import NegotiationTab from './components/NegotiationTab';
import TransactionHistoryTab from './components/TransactionHistoryTab';
import UserDataDisplay from './components/UserDataDisplay';
import InvitationCodeDisplay from './components/InvitationCodeDisplay';

interface UserQuota {
  user_id: string;
  total_hours: number;
  used_hours: number;
  remaining_hours: number;
  created_at: string;
  updated_at: string;
}

export default function ServiceCenterPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [quota, setQuota] = useState<UserQuota | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('quota');

  // Fetch user's quota information
  useEffect(() => {
    const fetchQuota = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/quota');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch quota');
        }
        
        setQuota(data.quota);
      } catch (err) {
        console.error('Error fetching quota:', err);
        setError(err instanceof Error ? err.message : 'Failed to load quota information');
      } finally {
        setLoading(false);
      }
    };

    if (isUserLoaded) {
      fetchQuota();
    }
  }, [user, isUserLoaded]);

  // Refresh quota data
  const refreshQuota = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/quota');
      const data = await response.json();
      
      if (response.ok) {
        setQuota(data.quota);
      }
    } catch (err) {
      console.error('Error refreshing quota:', err);
    }
  };

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
                  <AlertDescription className="text-red-800">
                    {error}
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
          className="mb-8"
        >
          <UserDataDisplay />
        </motion.div>

        {/* Invitation Code Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8"
        >
          <InvitationCodeDisplay />
        </motion.div>

        {/* Main Content Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full pl-18 pr-18">
            <TabsList className="grid w-full h-15 grid-cols-3 mb-3">
              <TabsTrigger value="quota" className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4" />
                <span>Quota Management</span>
              </TabsTrigger>
              <TabsTrigger value="negotiation" className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span>Negotiation</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center space-x-2">
                <History className="h-4 w-4" />
                <span>Transaction History</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="quota">
              <QuotaManagementTab 
                quota={quota} 
                onQuotaUpdate={refreshQuota}
              />
            </TabsContent>

            <TabsContent value="negotiation">
              <NegotiationTab />
            </TabsContent>

            <TabsContent value="history">
              <TransactionHistoryTab />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}