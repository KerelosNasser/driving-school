'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import useProfileCompletion from '@/hooks/useProfileCompletion';

interface ProfileCompletionWrapperProps {
  children: React.ReactNode;
}

const PROTECTED_ROUTES = [
  '/dashboard',
  '/bookings',
  '/profile',
  '/packages',
  '/lessons'
];

const EXCLUDED_ROUTES = [
  '/complete-profile',
  '/sign-in',
  '/sign-up',
  '/',
  '/about',
  '/contact'
];

export default function ProfileCompletionWrapper({ children }: ProfileCompletionWrapperProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const { completed, authenticated, needsProfileCompletion, loading } = useProfileCompletion();

  useEffect(() => {
    if (!isLoaded || loading) return;

    // If user is authenticated but hasn't completed profile
    if (authenticated && needsProfileCompletion) {
      // Don't redirect if already on complete-profile page or excluded routes
      if (!EXCLUDED_ROUTES.includes(pathname)) {
        router.push('/complete-profile');
        return;
      }
    }

    // If user is on complete-profile but has already completed it
    if (authenticated && completed && pathname === '/complete-profile') {
      router.push('/dashboard');
      return;
    }

    // If user is not authenticated and trying to access protected routes
    if (!authenticated && PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
      router.push('/sign-in');
      return;
    }
  }, [isLoaded, loading, authenticated, completed, needsProfileCompletion, pathname, router]);

  // Show loading state while checking authentication and profile completion
  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}