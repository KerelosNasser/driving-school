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
  Calendar,
  FileText,
  CheckCircle,
  AlertCircle,
  Edit,
  Loader2,
  Shield,
} from "lucide-react";

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
  const [editingSection, setEditingSection] = useState<string | null>(null);

  useEffect(() => {
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

    fetchUserProfile();
  }, [clerkUser, isLoaded]);

  const calculateCompletionPercentage = () => {
    if (!userProfile?.completionStatus) return 0;
    const statuses = Object.values(userProfile.completionStatus);
    const completed = statuses.filter(Boolean).length;
    return Math.round((completed / statuses.length) * 100);
  };

  const handleEditSection = (section: string) => {
    setEditingSection(section);
  };

  const handleSaveSection = async (section: string, data: any) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ section, data }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const updatedProfile = await response.json();
      setUserProfile(updatedProfile);
      setEditingSection(null);
    } catch (err) {
      console.error('Error saving profile section:', err);
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  // If used as tab content, render directly without dialog
  if (asTabContent) {
    return (
      <UserDataReviewContent 
        userProfile={userProfile}
        loading={loading}
        error={error}
        calculateCompletionPercentage={calculateCompletionPercentage}
        handleEditSection={handleEditSection}
        editingSection={editingSection}
      />
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
            loading={loading}
            error={error}
            calculateCompletionPercentage={calculateCompletionPercentage}
            handleEditSection={handleEditSection}
            editingSection={editingSection}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Separate component for the content
function UserDataReviewContent({ 
  userProfile, 
  loading, 
  error, 
  calculateCompletionPercentage, 
  handleEditSection,
  editingSection 
}: {
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  calculateCompletionPercentage: () => number;
  handleEditSection: (section: string) => void;
  editingSection: string | null;
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
      {/* Completion Status - Compact */}
      <Card className="rounded-lg shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Profile Completion
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-base font-semibold">{calculateCompletionPercentage()}% Complete</span>
            <Badge variant={calculateCompletionPercentage() === 100 ? "default" : "secondary"} className="text-xs">
              {calculateCompletionPercentage() === 100 ? "Complete" : "In Progress"}
            </Badge>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${calculateCompletionPercentage()}%` }}
            />
          </div>
          {userProfile.lastUpdated && (
            <p className="text-xs text-gray-500 mt-2">
              Updated: {new Date(userProfile.lastUpdated).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Compact Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Personal Information */}
        <Card className="rounded-lg shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-blue-500" />
              Personal
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditSection('personal')}
              className="h-7 px-2"
            >
              <Edit className="w-3 h-3" />
            </Button>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <div>
              <label className="text-xs font-medium text-gray-500">Name</label>
              <p className="text-sm">{userProfile.fullName || "Not provided"}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Date of Birth</label>
              <p className="text-sm">
                {userProfile.dateOfBirth 
                  ? new Date(userProfile.dateOfBirth).toLocaleDateString()
                  : "Not provided"
                }
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Address</label>
              <p className="text-sm">{userProfile.address || "Not provided"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="rounded-lg shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-green-500" />
              Contact
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditSection('contact')}
              className="h-7 px-2"
            >
              <Edit className="w-3 h-3" />
            </Button>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <div>
              <label className="text-xs font-medium text-gray-500">Email</label>
              <p className="text-sm">{userProfile.email}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Phone</label>
              <p className="text-sm">{userProfile.phone || "Not provided"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-2 pt-4">
        <Button size="sm" className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Confirm Information
        </Button>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Edit className="w-4 h-4" />
          Edit Profile
        </Button>
      </div>
    </div>
  );
}