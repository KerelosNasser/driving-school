'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Calendar, Clock, TrendingUp, Award, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { formatForDisplay } from '@/lib/phone';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface UserData {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserStatistics {
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
    lastLessonDate?: string;
    lastLessonTime?: string;
    nextLessonDate?: string;
    nextLessonTime?: string;
    preferredInstructor?: string;
    preferredLocation?: string;
  };
  memberSince: string;
}

interface ErrorState {
  message: string;
  isInternal: boolean;
  firstOccurrence: number;
}

interface UserDataDisplayProps {
  className?: string;
}

export default function UserDataDisplay({ className = '' }: UserDataDisplayProps) {
  const { user } = useUser();
  const [_userData, setUserData] = useState<UserData | null>(null);
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorState | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Enhanced error handling
  const handleError = useCallback((errorMessage: string) => {
    const isInternal = errorMessage.toLowerCase().includes('internal server error') || 
                      errorMessage.toLowerCase().includes('500') ||
                      errorMessage.includes('Failed to fetch');
    
    const now = Date.now();
    
    if (isInternal && error?.isInternal) {
      const timeSinceFirst = now - error.firstOccurrence;
      if (timeSinceFirst < 300000) { // 5 minutes
        console.warn('Suppressing repeated internal server error in user data:', errorMessage);
        return;
      }
    }
    
    setError({
      message: errorMessage,
      isInternal,
      firstOccurrence: error?.isInternal && isInternal ? error.firstOccurrence : now,
    });
  }, [error]);

  const fetchUserData = useCallback(async (isRetry: boolean = false) => {
    if (!user) return;
    
    try {
      if (!isRetry) {
        setLoading(true);
      } else {
        setIsRetrying(true);
      }
      setError(null);
      
      const response = await fetch('/api/user');
      const data = await response.json();
      
      if (response.ok) {
        setUserData(data.user);
        setStatistics(data.statistics);
        if (error) {
          setError(null);
        }
      } else {
        handleError(data.error || 'Failed to fetch user data');
      }
    } catch (err) {
      const errorMessage = 'Failed to load user data';
      handleError(errorMessage);
      console.error('Error fetching user data:', err);
    } finally {
      if (!isRetry) {
        setLoading(false);
      } else {
        setIsRetrying(false);
      }
    }
  }, [user, handleError, error]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const retryFetch = async () => {
    await fetchUserData(true);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateProgress = () => {
    if (!statistics) return 0;
    if (statistics.learningProgress.totalLessons === 0) return 0;
    return Math.round((statistics.learningProgress.completedLessons / statistics.learningProgress.totalLessons) * 100);
  };

  if (!user) return null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* User Profile Card */}
      <Card className="bg-yellow-50 border-yellow-950 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2">
            <div className="p-2 bg-yellow-100 rounded-full">
              <User className="h-5 w-5 text-yellow-600" />
            </div>
            <span className="text-yellow-900 text-xl font-semibold">User Profile</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-start space-x-6">
            <div className="relative">
              <Avatar className="h-20 w-20 border-3 border-yellow-200 shadow-md">
                <AvatarImage src={user.imageUrl} alt={user.fullName || 'User'} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-yellow-100 to-yellow-200 text-yellow-700 text-xl font-semibold">
                  {getInitials(user.fullName || user.firstName || 'U')}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
            
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {user.fullName || `${user.firstName} ${user.lastName}`}
                </h3>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                    Active Student
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Premium Member
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {user.primaryEmailAddress && (
                  <div className="flex items-center space-x-3 text-sm text-gray-600 p-2 bg-gray-50 rounded-lg border-2 border-amber-700">
                    <div className="p-1 bg-gray-200 rounded">
                      <Mail className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-yellow-700">{user.primaryEmailAddress.emailAddress}</span>
                  </div>
                )}
                
                {user.primaryPhoneNumber && (
                  <div className="flex items-center space-x-3 text-sm text-gray-600 p-2 bg-gray-50 rounded-lg border-2 border-amber-700">
                    <div className="p-1 bg-gray-200 rounded">
                      <Phone className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-yellow-700">{formatForDisplay(user.primaryPhoneNumber.phoneNumber)}</span>
                  </div>
                )}
                
                {statistics?.recentActivity.preferredLocation && (
                  <div className="flex items-center space-x-3 text-sm text-yellow-700 p-2 bg-gray-50 rounded-lg border-2 border-amber-700">
                    <div className="p-1 bg-gray-200 rounded">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <span className="font-medium">Preferred: {statistics.recentActivity.preferredLocation}</span>
                  </div>
                )}
                
                {statistics?.memberSince && (
                  <div className="flex items-center space-x-3 text-sm text-yellow-700 p-2 bg-gray-50 rounded-lg border-2 border-amber-700">
                    <div className="p-1 bg-gray-200 rounded">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <span className="font-medium">Member since {formatDate(statistics.memberSince)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading statistics...</span>
          </CardContent>
        </Card>
      ) : error ? (
        <Alert className="border-red-300 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 flex items-center justify-between">
            <span>{error.message}</span>
            {error.isInternal && (
              <Button
                variant="outline"
                size="sm"
                onClick={retryFetch}
                disabled={isRetrying}
                className="ml-2 h-8"
              >
                {isRetrying ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                <span className="ml-1 text-xs">Retry</span>
              </Button>
            )}
          </AlertDescription>
        </Alert>
      ) : statistics ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Learning Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-900 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
              <CardContent className="p-2 relative">
                <div className="absolute top-0 right-0 w-20 h-20 bg-green-100 rounded-full -mr-10 -mt-10 opacity-50"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      </div>
                      <span className="font-semibold text-green-900">Learning Progress</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800 px-3 py-1 text-sm font-semibold">
                      {calculateProgress()}%
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-green-700">
                      {statistics.learningProgress.completedLessons}
                      <span className="text-lg font-normal text-green-600">/{statistics.learningProgress.totalLessons}</span>
                    </div>
                    <div className="text-sm text-green-600 font-medium">Lessons Completed</div>
                    <div className="w-full bg-green-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${calculateProgress()}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Hours Statistics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="bg-yellow-100 border-yellow-900 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
              <CardContent className="p-2 relative">
                <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-100 rounded-full -mr-10 -mt-10 opacity-50"></div>
                <div className="relative z-10">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Clock className="h-5 w-5 text-yellow-600" />
                    </div>
                    <span className="font-semibold text-yellow-900">Hours Utilized</span>
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-yellow-700">
                      {statistics.hoursUsage.used}
                      <span className="text-lg font-normal text-yellow-600">h</span>
                    </div>
                    <div className="text-sm text-yellow-600 font-medium">
                      of {statistics.hoursUsage.totalPurchased} total hours
                    </div>
                    <div className="w-full bg-yellow-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((statistics.hoursUsage.used / statistics.hoursUsage.totalPurchased) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Upcoming Lessons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-900 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
              <CardContent className="p-6 relative">
                <div className="absolute top-0 right-0 w-20 h-20 bg-purple-100 rounded-full -mr-10 -mt-10 opacity-50"></div>
                <div className="relative z-10">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Award className="h-5 w-5 text-purple-600" />
                    </div>
                    <span className="font-semibold text-purple-900">Upcoming Lessons</span>
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-purple-700">
                      {statistics.learningProgress.upcomingLessons}
                    </div>
                    <div className="text-sm text-purple-600 font-medium">Lessons Scheduled</div>
                    {statistics.learningProgress.upcomingLessons > 0 && (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-purple-600">Next lesson soon</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      ) : null}

      {/* Recent Activity */}
      {statistics && (statistics.recentActivity.lastLessonDate || statistics.recentActivity.nextLessonDate) && (
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-xl">
              <div className="p-2 bg-gray-100 rounded-full">
                <Calendar className="h-5 w-5 text-gray-600" />
              </div>
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {statistics.recentActivity.lastLessonDate && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-200 rounded-lg">
                      <Calendar className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-gray-900">Last Lesson</span>
                      <div className="text-xs text-gray-500">Completed session</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-700">
                      {formatDate(statistics.recentActivity.lastLessonDate)}
                    </span>
                    {statistics.recentActivity.lastLessonTime && (
                      <div className="text-xs text-gray-500">
                        at {statistics.recentActivity.lastLessonTime}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
              
              {statistics.recentActivity.nextLessonDate && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-yellow-200 rounded-lg">
                      <Calendar className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-yellow-900">Next Lesson</span>
                      <div className="text-xs text-yellow-600">Upcoming session</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-yellow-700">
                      {formatDate(statistics.recentActivity.nextLessonDate)}
                    </span>
                    {statistics.recentActivity.nextLessonTime && (
                      <div className="text-xs text-yellow-600">
                        at {statistics.recentActivity.nextLessonTime}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
              
              {statistics.recentActivity.preferredInstructor && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-100 rounded-xl border border-amber-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-amber-200 rounded-lg">
                      <User className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-amber-900">Preferred Instructor</span>
                      <div className="text-xs text-amber-600">Your selected teacher</div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-amber-700">
                    {statistics.recentActivity.preferredInstructor}
                  </span>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}