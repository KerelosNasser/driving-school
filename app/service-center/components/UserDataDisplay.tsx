import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import {
  Clock,
  Car,
  Calendar,
  CheckCircle,
  Star,
  Trophy,
  Target,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface UserData {
  user: {
    id: string;
    email: string;
    fullName?: string;
    phone?: string;
  };
  statistics: {
    learningProgress: {
      completedLessons: number;
      totalLessons: number;
      upcomingLessons: number;
    };
    hoursUsage: {
      totalPurchased: number;
      used: number;
      remaining: number;
    };
    recentActivity: {
      lastLessonDate: string | null;
      lastLessonTime: string | null;
      nextLessonDate: string | null;
      nextLessonTime: string | null;
      preferredInstructor: string | null;
      preferredLocation: string | null;
    };
    memberSince: string;
  };
}

export default function UserDataDisplay() {
  const { user: clerkUser, isLoaded } = useUser();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!isLoaded || !clerkUser) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/user');
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        
        const data = await response.json();
        setUserData(data);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [clerkUser, isLoaded]);

  const calculateProgress = () => {
    if (!userData?.statistics?.hoursUsage) return 0;
    const { totalPurchased, used } = userData.statistics.hoursUsage;
    return totalPurchased > 0 ? Math.round((used / totalPurchased) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span className="text-sm text-gray-600">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-4 text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Unable to Load Data</h3>
          <p className="text-xs text-gray-600 mb-3">{error}</p>
          <Button onClick={() => window.location.reload()} size="sm" className="w-full">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!userData) {
    return (
      <Card className="w-full">
        <CardContent className="p-4 text-center">
          <Target className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-gray-900 mb-1">No Data Available</h3>
          <p className="text-xs text-gray-600">Complete your profile to view your dashboard.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Compact Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Learning Journey */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md text-white p-4"
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm sm:text-base font-medium">Progress</h3>
            <Target className="w-4 h-4 sm:w-5 sm:h-5 opacity-80" />
          </div>
          <p className="text-xl sm:text-2xl font-bold">{calculateProgress()}%</p>
          <div className="mt-2 w-full bg-white/20 rounded-full h-1.5">
            <div
              className="bg-white h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${calculateProgress()}%` }}
            />
          </div>
        </motion.div>

        {/* Driving Hours */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-md text-white p-4"
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm sm:text-base font-medium">Hours</h3>
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 opacity-80" />
          </div>
          <p className="text-lg sm:text-xl font-bold">
            {userData?.statistics?.hoursUsage?.used || 0}/{userData?.statistics?.hoursUsage?.totalPurchased || 0}
          </p>
          <p className="text-xs opacity-80">Completed</p>
        </motion.div>

        {/* Next Session */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-md text-white p-4 sm:col-span-2 lg:col-span-1"
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm sm:text-base font-medium">Next Session</h3>
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 opacity-80" />
          </div>
          {userData?.statistics?.recentActivity?.nextLessonDate ? (
            <>
              <p className="text-lg sm:text-xl font-bold">
                {new Date(userData.statistics.recentActivity.nextLessonDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
              <p className="text-xs opacity-80">{userData?.statistics?.recentActivity?.nextLessonTime || 'TBD'}</p>
            </>
          ) : (
            <>
              <p className="text-lg sm:text-xl font-bold">--</p>
              <p className="text-xs opacity-80">No upcoming</p>
            </>
          )}
        </motion.div>
      </div>

      {/* Compact Activity & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activity - Compact */}
        <Card className="rounded-xl shadow-md border-emerald-200/60">
          <CardContent className="p-4">
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2 mb-3 text-gray-800">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              Recent
            </h2>
            <div className="space-y-2">
              {userData?.statistics?.recentActivity?.lastLessonDate ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="text-green-500 w-4 h-4 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">Last lesson</p>
                      <p className="text-xs text-gray-500">
                        {new Date(userData.statistics.recentActivity.lastLessonDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                  {userData.statistics.recentActivity.preferredInstructor && (
                    <div className="flex items-center gap-3">
                      <Car className="text-blue-500 w-4 h-4 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500 truncate">{userData.statistics.recentActivity.preferredInstructor}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <Clock className="w-6 h-6 mx-auto mb-1 opacity-50" />
                  <p className="text-xs">No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="rounded-xl shadow-md border-emerald-200/60">
          <CardContent className="p-4">
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2 mb-3 text-gray-800">
              <div className="p-1.5 bg-yellow-100 rounded-lg">
                <Trophy className="w-4 h-4 text-yellow-600" />
              </div>
              Stats
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-yellow-50 text-yellow-800 p-2 rounded-lg text-center">
                <p className="text-lg font-bold">{userData?.statistics?.learningProgress?.completedLessons || 0}</p>
                <p className="text-xs">Completed</p>
              </div>
              <div className="bg-green-50 text-green-800 p-2 rounded-lg text-center">
                <p className="text-lg font-bold">{userData?.statistics?.learningProgress?.upcomingLessons || 0}</p>
                <p className="text-xs">Upcoming</p>
              </div>
              <div className="bg-blue-50 text-blue-800 p-2 rounded-lg text-center">
                <p className="text-lg font-bold">{userData?.statistics?.learningProgress?.totalLessons || 0}</p>
                <p className="text-xs">Total</p>
              </div>
              <div className="bg-purple-50 text-purple-800 p-2 rounded-lg text-center">
                <p className="text-lg font-bold">{userData?.statistics?.hoursUsage?.remaining || 0}</p>
                <p className="text-xs">Remaining</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}