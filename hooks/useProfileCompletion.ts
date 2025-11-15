import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { validateProfileForBooking, ProfileCompletionStatus, UserProfileData } from '@/lib/utils/profile-validation';

export function useProfileCompletion() {
  const { user: clerkUser, isLoaded } = useUser();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [validationStatus, setValidationStatus] = useState<ProfileCompletionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!isLoaded || !clerkUser) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/user/profile');
        if (!response.ok) {
          throw new Error('Failed to fetch user profile');
        }

        const data = await response.json();
        
        // Extract profile data from API response with safe fallbacks
        const profile: UserProfileData = {
          fullName: data.fullName || '',
          phone: data.phone || '',
          address: data.address || '',
          dateOfBirth: data.dateOfBirth || '',
          suburb: data.suburb || '',
          experienceLevel: data.experienceLevel || '',
          emergencyContact: data.emergencyContact || undefined,
        };

        setProfileData(profile);
        
        // Validate the profile
        const status = validateProfileForBooking(profile);
        setValidationStatus(status);

        // Log to console if profile is incomplete
        if (!status.canBook) {
          console.warn('⚠️ Profile incomplete - missing critical fields:', status.missingFields.critical);
          console.log('📋 Current profile data:', profile);
        }
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
        
        // Set empty profile data on error to prevent null issues
        setProfileData({
          fullName: '',
          phone: '',
          address: '',
          dateOfBirth: '',
          suburb: '',
          experienceLevel: '',
          emergencyContact: undefined,
        });
        
        // Set validation status to indicate profile is incomplete
        setValidationStatus({
          isComplete: false,
          completionPercentage: 0,
          missingFields: {
            critical: ['phone', 'address'],
            important: ['fullName', 'emergencyContact'],
            optional: ['dateOfBirth', 'suburb', 'experienceLevel'],
          },
          canBook: false,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [clerkUser, isLoaded]);

  const refreshProfile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/user/profile');
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const data = await response.json();
      
      const profile: UserProfileData = {
        fullName: data.fullName || '',
        phone: data.phone || '',
        address: data.address || '',
        dateOfBirth: data.dateOfBirth || '',
        suburb: data.suburb || '',
        experienceLevel: data.experienceLevel || '',
        emergencyContact: data.emergencyContact || undefined,
      };

      setProfileData(profile);
      const status = validateProfileForBooking(profile);
      setValidationStatus(status);
      
      console.log('✅ Profile refreshed successfully');
    } catch (err) {
      console.error('Error refreshing profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh profile');
    } finally {
      setLoading(false);
    }
  };

  return {
    profileData: profileData || {
      fullName: '',
      phone: '',
      address: '',
      dateOfBirth: '',
      suburb: '',
      experienceLevel: '',
      emergencyContact: undefined,
    },
    validationStatus,
    loading,
    error,
    refreshProfile,
    canBook: validationStatus?.canBook ?? false,
    isComplete: validationStatus?.isComplete ?? false,
    completionPercentage: validationStatus?.completionPercentage ?? 0,
    missingFields: validationStatus?.missingFields ?? { 
      critical: ['phone', 'address'], 
      important: ['fullName', 'emergencyContact'], 
      optional: ['dateOfBirth', 'suburb', 'experienceLevel'] 
    },
  };
}
