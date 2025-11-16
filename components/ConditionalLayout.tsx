'use client';

import { Navigation } from './navigation';
import { Footer } from './footer';

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer />
    </>
  );
}
