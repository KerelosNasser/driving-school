'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Calendar, Clock, TrendingUp, Award, Loader2, AlertCircle } from 'lucide-react';
import { formatForDisplay } from '@/lib/phone';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

interface UserDataDisplayProps {
  className?: string;
}

export default function UserDataDisplay({ className = '' }: UserDataDisplayProps) {
  const { user } = useUser();
  const [_userData, setUserData] = useState<UserData | null>(null);
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/user');
        const data = await response.json();
        
        if (response.ok) {
          setUserData(data.user);
          setStatistics(data.statistics);
        } else {
          setError(data.error || 'Failed to fetch user data');
        }
      } catch (err) {
        setError('Failed to load user data');
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

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
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5 text-blue-600" />
            <span className="text-blue-900">User Profile</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-4">
            <Avatar className="h-16 w-16 border-2 border-blue-200">
              <AvatarImage src={user.imageUrl} alt={user.fullName || 'User'} />
              <AvatarFallback className="bg-blue-100 text-blue-700 text-lg font-semibold">
                {getInitials(user.fullName || user.firstName || 'U')}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <h3 className="text-xl font-semibold text-gray-900">
                {user.fullName || `${user.firstName} ${user.lastName}`}
              </h3>
              
              <div className="space-y-1">
                {user.primaryEmailAddress && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>{user.primaryEmailAddress.emailAddress}</span>
                  </div>
                )}
                
                {user.primaryPhoneNumber && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{formatForDisplay(user.primaryPhoneNumber.phoneNumber)}</span>
                  </div>
                )}
                
                {statistics?.recentActivity.preferredLocation && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>Preferred Location: {statistics.recentActivity.preferredLocation}</span>
                  </div>
                )}
                
                {statistics?.memberSince && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Member since {formatDate(statistics.memberSince)}</span>
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
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      ) : statistics ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Learning Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-900">Progress</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    {calculateProgress()}%
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-green-700">
                    {statistics.learningProgress.completedLessons}/{statistics.learningProgress.totalLessons}
                  </div>
                  <div className="text-sm text-green-600">Lessons Completed</div>
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
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Hours Used</span>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-blue-700">
                    {statistics.hoursUsage.used}
                  </div>
                  <div className="text-sm text-blue-600">
                    of {statistics.hoursUsage.totalPurchased} purchased
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
            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Award className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-purple-900">Upcoming</span>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-purple-700">
                    {statistics.learningProgress.upcomingLessons}
                  </div>
                  <div className="text-sm text-purple-600">Lessons Scheduled</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      ) : null}

      {/* Recent Activity */}
      {statistics && (statistics.recentActivity.lastLessonDate || statistics.recentActivity.nextLessonDate) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statistics.recentActivity.lastLessonDate && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Last Lesson</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {formatDate(statistics.recentActivity.lastLessonDate)} {statistics.recentActivity.lastLessonTime && `at ${statistics.recentActivity.lastLessonTime}`}
                  </span>
                </div>
              )}
              
              {statistics.recentActivity.nextLessonDate && (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Next Lesson</span>
                  </div>
                  <span className="text-sm text-blue-600">
                    {formatDate(statistics.recentActivity.nextLessonDate)} {statistics.recentActivity.nextLessonTime && `at ${statistics.recentActivity.nextLessonTime}`}
                  </span>
                </div>
              )}
              
              {statistics.recentActivity.preferredInstructor && (
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium">Preferred Instructor</span>
                  </div>
                  <span className="text-sm text-yellow-700">
                    {statistics.recentActivity.preferredInstructor}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}