'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

interface ProfileCompletionStatus {
  completed: boolean;
  authenticated: boolean;
  needsProfileCompletion?: boolean;
  userId?: string;
  invitationCode?: string;
  loading: boolean;
  error?: string;
}

export function useProfileCompletion() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [status, setStatus] = useState<ProfileCompletionStatus>({
    completed: false,
    authenticated: false,
    loading: true
  });

  useEffect(() => {
    const checkProfileCompletion = async () => {
      if (!isLoaded) return;
      
      if (!user) {
        setStatus({
          completed: false,
          authenticated: false,
          loading: false
        });
        return;
      }

      // First check client-side metadata for immediate response
      const profileCompletedInClerk = user.publicMetadata?.profileCompleted === true;
      
      if (profileCompletedInClerk) {
        setStatus({
          completed: true,
          authenticated: true,
          loading: false
        });
        return;
      }

      try {
        // If not completed in client metadata, verify with server
        const response = await fetch('/api/check-profile-completion');
        const data = await response.json();
        
        setStatus({
          ...data,
          loading: false
        });
        
        // Redirect to complete profile if needed
        if (data.authenticated && data.needsProfileCompletion) {
          const currentPath = window.location.pathname;
          if (currentPath !== '/complete-profile') {
            router.push('/complete-profile');
          }
        }
        
      } catch (error) {
        console.error('Error checking profile completion:', error);
        setStatus({
          completed: false,
          authenticated: true,
          loading: false,
          error: 'Failed to check profile status'
        });
      }
    };

    checkProfileCompletion();
  }, [isLoaded, user, router]);

  return status;
}

export default useProfileCompletion;