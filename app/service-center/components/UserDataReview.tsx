import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser } from "@clerk/nextjs";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Users,
  FileText,
  CheckCircle,
  AlertCircle,
  Edit,
  Loader2,
  Shield,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import ProfileCompletionModal from "@/components/ProfileCompletionModal";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";

interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  drivingLicense?: {
    number: string;
    expiryDate: string;
    state: string;
  };
  medicalConditions?: string[];
  preferences?: {
    instructorGender?: string;
    carType?: string;
    lessonTime?: string;
  };
  submittedAt?: string;
  lastUpdated?: string;
  completionStatus: {
    personalInfo: boolean;
    contactInfo: boolean;
    emergencyContact: boolean;
    drivingLicense: boolean;
    medicalInfo: boolean;
    preferences: boolean;
  };
}

interface UserDataReviewProps {
  trigger?: React.ReactNode;
  asTabContent?: boolean;
}

export default function UserDataReview({ trigger, asTabContent = false }: UserDataReviewProps) {
  const [open, setOpen] = useState(false);
  const { user: clerkUser, isLoaded } = useUser();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // Use profile completion hook
  const { 
    profileData, 
    missingFields, 
    completionPercentage,
    refreshProfile 
  } = useProfileCompletion();

  const fetchUserProfile = async () => {
    if (!isLoaded || !clerkUser) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/user/profile');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch user profile`);
      }
      
      const data = await response.json();
      setUserProfile(data);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load user profile';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clerkUser, isLoaded]);

  const handleProfileModalComplete = async () => {
    setShowProfileModal(false);
    // Refresh both profile sources
    await fetchUserProfile();
    await refreshProfile();
  };

  // If used as tab content, render directly without dialog
  if (asTabContent) {
    return (
      <>
        <ProfileCompletionModal
          open={showProfileModal}
          onOpenChange={setShowProfileModal}
          missingFields={missingFields}
          onComplete={handleProfileModalComplete}
          initialData={profileData}
        />
        <UserDataReviewContent 
          userProfile={userProfile}
          profileData={profileData}
          loading={loading}
          error={error}
          completionPercentage={completionPercentage}
          onOpenProfileModal={() => setShowProfileModal(true)}
          onRefresh={fetchUserProfile}
        />
      </>
    );
  }

  const defaultTrigger = (
    <Button variant="outline" className="flex items-center gap-2">
      <Shield className="h-4 w-4" />
      <span className="hidden sm:inline">Review Profile</span>
      <span className="sm:hidden">Profile</span>
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="w-full max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-4 pb-2 border-b">
          <DialogTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-600" />
            Profile Review & Verification
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 p-4">
          <UserDataReviewContent 
            userProfile={userProfile}
            profileData={profileData}
            loading={loading}
            error={error}
            completionPercentage={completionPercentage}
            onOpenProfileModal={() => setShowProfileModal(true)}
            onRefresh={fetchUserProfile}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Separate component for the content
function UserDataReviewContent({ 
  userProfile,
  profileData,
  loading, 
  error, 
  completionPercentage,
  onOpenProfileModal,
  onRefresh
}: {
  userProfile: UserProfile | null;
  profileData: {
    fullName?: string;
    phone?: string;
    address?: string;
    suburb?: string;
    emergencyContact?: {
      name?: string;
      phone?: string;
    } | undefined;
  } | null;
  loading: boolean;
  error: string | null;
  completionPercentage: number;
  onOpenProfileModal?: () => void;
  onRefresh?: () => void;
}) {

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span className="text-sm text-gray-600">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Profile</h3>
        <p className="text-sm text-gray-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()} size="sm">
          Try Again
        </Button>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="text-center py-8">
        <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Profile Data</h3>
        <p className="text-sm text-gray-600">Please complete your profile to view this section.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Completion Status with Better UI */}
      <Card className="rounded-xl shadow-lg border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-teal-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg shadow-md">
                <Shield className="w-5 h-5 text-white" />
              </div>
              Profile Status
            </CardTitle>
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                className="h-8 px-2"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-2xl font-bold text-emerald-700">{completionPercentage}%</span>
              <span className="text-sm text-gray-600 ml-2">Complete</span>
            </div>
            <Badge 
              variant={completionPercentage === 100 ? "default" : completionPercentage >= 50 ? "secondary" : "destructive"} 
              className="text-xs px-3 py-1"
            >
              {completionPercentage === 100 ? "✓ Complete" : completionPercentage >= 50 ? "In Progress" : "Needs Attention"}
            </Badge>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
            <div
              className="bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 h-3 rounded-full transition-all duration-500 shadow-md"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          {userProfile?.lastUpdated && (
            <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Last updated: {new Date(userProfile.lastUpdated).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Personal Information */}
        <Card className="rounded-xl shadow-md border-blue-200/60 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-800">
              <div className="p-2 bg-blue-500 rounded-lg shadow-sm">
                <User className="w-4 h-4 text-white" />
              </div>
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <User className="w-4 h-4 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Full Name</label>
                <p className="text-sm font-medium text-gray-900">{profileData?.fullName || userProfile?.fullName || "Not provided"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Address</label>
                <p className="text-sm font-medium text-gray-900">{profileData?.address || userProfile?.address || "Not provided"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Suburb</label>
                <p className="text-sm font-medium text-gray-900">{profileData?.suburb || "Not provided"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="rounded-xl shadow-md border-green-200/60 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-800">
              <div className="p-2 bg-green-500 rounded-lg shadow-sm">
                <Mail className="w-4 h-4 text-white" />
              </div>
              Contact Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</label>
                <p className="text-sm font-medium text-gray-900">{userProfile?.email || "Not provided"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</label>
                <p className="text-sm font-medium text-gray-900">{profileData?.phone || userProfile?.phone || "Not provided"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <Users className="w-4 h-4 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Emergency Contact</label>
                <p className="text-sm font-medium text-gray-900">
                  {profileData?.emergencyContact?.name || "Not provided"}
                </p>
                {profileData?.emergencyContact?.phone && (
                  <p className="text-xs text-gray-500 mt-1">{profileData.emergencyContact.phone}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons with Better Styling */}
      <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
        {completionPercentage < 100 && onOpenProfileModal && (
          <Button 
            size="lg" 
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all"
            onClick={onOpenProfileModal}
          >
            <Sparkles className="w-5 h-5" />
            Complete Your Profile
          </Button>
        )}
        {completionPercentage === 100 && (
          <Button size="lg" className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600" disabled>
            <CheckCircle className="w-5 h-5" />
            Profile Complete!
          </Button>
        )}
        {onOpenProfileModal && (
          <Button 
            variant="outline" 
            size="lg" 
            className="flex items-center gap-2 border-2 hover:bg-gray-50"
            onClick={onOpenProfileModal}
          >
            <Edit className="w-5 h-5" />
            Edit Information
          </Button>
        )}
      </div>

      {/* Helpful Tips */}
      {completionPercentage < 100 && (
        <Card className="rounded-xl border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-amber-900 mb-1">Complete your profile to book lessons</h4>
                <p className="text-xs text-amber-700">
                  We need your phone number and address to provide the best service. Emergency contact information helps keep you safe.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}