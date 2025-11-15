'use client';

import { usePathname } from 'next/navigation';
import { Navigation } from './navigation';
import { Footer } from './footer';

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Hide navigation and footer in admin dashboard and service center
  const hideLayout = pathname?.startsWith('/admin') || pathname?.startsWith('/service-center');

  return (
    <>
      {!hideLayout && <Navigation />}
      <main className="min-h-screen">
        {children}
      </main>
      {!hideLayout && <Footer />}
    </>
  );
}
