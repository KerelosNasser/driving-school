'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Calendar, CreditCard } from 'lucide-react';

// Define the shape of the data this component receives
interface User {
  id: string;
  created_at: string;
}

interface Booking {
  id: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
}

interface OverviewTabProps {
  users: User[];
  bookings: Booking[];
  loading: boolean;
}

export const OverviewTab = ({ users, bookings, loading }: OverviewTabProps) => {
  // Display a loading state until the data is ready
  if (loading) {
    return (
      <div className="flex justify-center items-center p-10">
        <div>Loading overview data...</div>
      </div>
    );
  }

  // --- Calculate Statistics ---

  // Calculate user stats
  const userStats = {
    total: users.length,
    new: users.filter(u => new Date(u.created_at) > new Date(new Date().setMonth(new Date().getMonth() - 1))).length,
  };

  // Calculate booking stats
  const bookingStats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
  };

  // Aggregate bookings by month for the chart
  const bookingsByMonth = bookings.reduce((acc, booking) => {
    const month = new Date(booking.created_at).toLocaleString('default', { month: 'short' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const bookingsData = Object.entries(bookingsByMonth).map(([month, count]) => ({
    month,
    bookings: count,
  }));

  // NOTE: Revenue data is mocked as price information is not available in bookings.
  const revenueStats = {
    total: '$0.00',
    growth: '+0.0%',
  };
  const revenueData = bookingsData.map(d => ({ month: d.month, revenue: 0 }));

  return (
    <>
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
              {revenueStats.growth} from last month (dummy data)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
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
                  <Bar dataKey="bookings" fill="#eab308" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
            <CardDescription>Revenue per month (AUD) - (Dummy Data)</CardDescription>
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
    </>
  );
};