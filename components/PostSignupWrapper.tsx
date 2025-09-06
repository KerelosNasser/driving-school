'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import PostSignupForm from './PostSignupForm';

interface PostSignupWrapperProps {
  children: React.ReactNode;
}

export default function PostSignupWrapper({ children }: PostSignupWrapperProps) {
  const { user, isLoaded } = useUser();
  const [showPostSignup, setShowPostSignup] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    if (user) {
      // Check if user has completed profile
      const profileCompleted = user.publicMetadata?.profileCompleted;
      const completedOnboarding = user.publicMetadata?.completed_onboarding;
      
      const isAdmin = user.publicMetadata?.role === 'admin';
      // Show post-signup form if user hasn't completed profile or onboarding and user is not admin
      if (!isAdmin && !profileCompleted && !completedOnboarding) {
        setShowPostSignup(true);
      } else {
        setShowPostSignup(false);
      }
    }
    
    setIsChecking(false);
  }, [user, isLoaded]);

  const handlePostSignupComplete = () => {
    setShowPostSignup(false);
  };

  // Show loading state while checking
  if (isChecking || !isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
      </div>
    );
  }

  // Show post-signup form if needed
  if (showPostSignup) {
    return <PostSignupForm onComplete={handlePostSignupComplete} />;
  }

  // Show normal app content
  return <>{children}</>;
}