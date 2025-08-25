'use client';

import { useEffect, useState } from 'react';

interface HydrationBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * HydrationBoundary component to prevent hydration mismatches
 * caused by browser extensions that modify the DOM
 */
export function HydrationBoundary({ children, fallback = null }: HydrationBoundaryProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Clean up any browser extension attributes that might cause hydration issues
    const cleanupExtensionAttributes = () => {
      const html = document.documentElement;
      const attributesToRemove = ['webcrx', 'data-darkreader-mode', 'data-darkreader-scheme'];
      
      attributesToRemove.forEach(attr => {
        if (html.hasAttribute(attr)) {
          html.removeAttribute(attr);
        }
      });
    };

    // Run cleanup after initial hydration
    cleanupExtensionAttributes();
    setIsHydrated(true);

    // Set up a mutation observer to clean up extension attributes as they're added
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.target === document.documentElement) {
          const attributeName = mutation.attributeName;
          if (attributeName && ['webcrx', 'data-darkreader-mode', 'data-darkreader-scheme'].includes(attributeName)) {
            (mutation.target as HTMLElement).removeAttribute(attributeName);
          }
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['webcrx', 'data-darkreader-mode', 'data-darkreader-scheme']
    });

    return () => observer.disconnect();
  }, []);

  if (!isHydrated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}