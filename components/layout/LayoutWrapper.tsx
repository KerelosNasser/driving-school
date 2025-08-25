'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';

interface LayoutWrapperProps {
  children: ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');

  return (
    <>
      {/* Only show navigation and footer on non-admin pages */}
      {!isAdminPage && <Navigation />}
      
      <main className={isAdminPage ? "min-h-screen" : ""}>
        {children}
      </main>
      
      {!isAdminPage && <Footer />}
    </>
  );
}