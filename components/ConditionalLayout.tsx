'use client';

import { usePathname } from 'next/navigation';
import { Navigation } from './navigation';
import { Footer } from './footer';

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Show navigation ONLY on service center page
  const showNavigation = pathname?.startsWith('/service-center');
  
  // Hide footer in admin dashboard and service center
  const hideFooter = pathname?.startsWith('/admin') || pathname?.startsWith('/service-center');

  return (
    <>
      {showNavigation && <Navigation />}
      <main className="min-h-screen">
        {children}
      </main>
      {!hideFooter && <Footer />}
    </>
  );
}
