'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import PostSignupForm from './PostSignupForm';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface PostSignupWrapperProps {
  children: React.ReactNode;
}

export default function PostSignupWrapper({ children }: PostSignupWrapperProps) {
  const { user, isLoaded } = useUser();
  const pathname = usePathname();
  const [showPostSignup, setShowPostSignup] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [hasVisitedServiceCenter, setHasVisitedServiceCenter] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    const checkProfileStatus = async () => {
      if (user) {
        // Check if user has completed profile in Clerk
        const profileCompleted = user.publicMetadata?.profileCompleted;
        const isAdmin = user.publicMetadata?.role === 'admin';
        
        console.log('🔍 [PostSignupWrapper] Profile check:', {
          userId: user.id,
          profileCompleted,
          isAdmin,
          pathname,
          metadata: user.publicMetadata
        });
        
        // Also check Supabase for user data
        let hasSupabaseData = false;
        try {
          const response = await fetch('/api/user/profile-status');
          if (response.ok) {
            const data = await response.json();
            hasSupabaseData = data.hasProfile;
            console.log('🔍 [PostSignupWrapper] Supabase profile status:', data);
          }
        } catch (error) {
          console.error('Error checking Supabase profile:', error);
        }
        
        // Show post-signup form as popup on service center page if profile not completed
        const isServiceCenterPage = pathname === '/service-center';
        const shouldShowPopup = !isAdmin && !profileCompleted && !hasSupabaseData && isServiceCenterPage;
        
        console.log('🔍 [PostSignupWrapper] Should show popup?', {
          shouldShowPopup,
          isServiceCenterPage,
          isAdmin,
          profileCompleted,
          hasSupabaseData
        });
        
        if (shouldShowPopup) {
          // Small delay to ensure page is loaded
          setTimeout(() => {
            console.log('✅ [PostSignupWrapper] Showing profile form');
            setShowPostSignup(true);
          }, 500);
        } else {
          setShowPostSignup(false);
        }
      }
      
      setIsChecking(false);
    };

    checkProfileStatus();
  }, [user, isLoaded, pathname]);

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

  // Always show normal app content with optional popup overlay
  return (
    <>
      {children}
      
      {/* Post-signup form as modal popup */}
      <Dialog open={showPostSignup} onOpenChange={(open) => !open && handlePostSignupComplete()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-0">
          <PostSignupForm onComplete={handlePostSignupComplete} isModal={true} />
        </DialogContent>
      </Dialog>
    </>
  );
}