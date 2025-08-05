'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Calendar, CreditCard, Activity, BookOpen } from 'lucide-react';

export default function AdminDashboard() {
  const { user, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Mock data for the dashboard
  const bookingsData = [
    { month: 'Jan', bookings: 12 },
    { month: 'Feb', bookings: 19 },
    { month: 'Mar', bookings: 25 },
    { month: 'Apr', bookings: 22 },
    { month: 'May', bookings: 30 },
    { month: 'Jun', bookings: 28 },
    { month: 'Jul', bookings: 35 },
    { month: 'Aug', bookings: 40 },
  ];

  const revenueData = [
    { month: 'Jan', revenue: 3600 },
    { month: 'Feb', revenue: 5700 },
    { month: 'Mar', revenue: 7500 },
    { month: 'Apr', revenue: 6600 },
    { month: 'May', revenue: 9000 },
    { month: 'Jun', revenue: 8400 },
    { month: 'Jul', revenue: 10500 },
    { month: 'Aug', revenue: 12000 },
  ];

  const userStats = {
    total: 120,
    active: 85,
    new: 15,
  };

  const bookingStats = {
    total: 211,
    pending: 8,
    completed: 195,
    cancelled: 8,
  };

  const revenueStats = {
    total: '$63,400',
    thisMonth: '$12,000',
    lastMonth: '$10,500',
    growth: '+14.3%',
  };

  // If user is not loaded yet, show loading state
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is not admin, show access denied
  if (!user || user.emailAddresses[0]?.emailAddress !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-8">You do not have permission to access this page.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Manage your driving school business</p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="text-sm text-gray-600">Logged in as:</div>
              <div className="font-medium">{user.emailAddresses[0]?.emailAddress}</div>
            </div>
          </div>
          
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-4 md:w-[600px]">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{userStats.total}</div>
                    <p className="text-xs text-gray-500">
                      {userStats.new} new users this month
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                    <Calendar className="h-4 w-4 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{bookingStats.total}</div>
                    <p className="text-xs text-gray-500">
                      {bookingStats.pending} pending bookings
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <CreditCard className="h-4 w-4 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{revenueStats.total}</div>
                    <p className="text-xs text-gray-500">
                      {revenueStats.growth} from last month
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Bookings</CardTitle>
                    <CardDescription>Number of bookings per month</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={bookingsData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="bookings" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue</CardTitle>
                    <CardDescription>Revenue per month (AUD)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="revenue" fill="#10b981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Users Tab */}
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>Users Management</CardTitle>
                  <CardDescription>View and manage user accounts</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    This section will display a table of users with their details and status.
                    You'll be able to view, edit, and manage user accounts.
                  </p>
                  <div className="mt-8 text-center text-gray-500">
                    <Users className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="mt-2">User management functionality will be implemented soon.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Bookings Tab */}
            <TabsContent value="bookings">
              <Card>
                <CardHeader>
                  <CardTitle>Bookings Management</CardTitle>
                  <CardDescription>View and manage driving lesson bookings</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    This section will display a calendar view of all bookings.
                    You'll be able to view, edit, and manage booking details.
                  </p>
                  <div className="mt-8 text-center text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="mt-2">Booking management with Google Calendar integration will be implemented soon.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Payments Tab */}
            <TabsContent value="payments">
              <Card>
                <CardHeader>
                  <CardTitle>Payments Management</CardTitle>
                  <CardDescription>View and manage payment transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    This section will display a table of payment transactions.
                    You'll be able to view payment details, issue refunds, and generate reports.
                  </p>
                  <div className="mt-8 text-center text-gray-500">
                    <CreditCard className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="mt-2">Payment management functionality will be implemented soon.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}