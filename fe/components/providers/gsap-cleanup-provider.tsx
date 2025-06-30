'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { killGSAP } from '@/lib/gsap-cleanup';

interface GSAPCleanupProviderProps {
  children: ReactNode;
}

/**
 * Provider component that automatically cleans up GSAP animations
 * when navigating between pages.
 * 
 * Place this component in your root layout.tsx to ensure all GSAP
 * animations are properly cleaned up during navigation.
 */
export function GSAPCleanupProvider({ children }: GSAPCleanupProviderProps) {
  const pathname = usePathname();
  const router = useRouter();
  
  // Clean up GSAP animations on route change
  useEffect(() => {
    // Create a cleanup function that will be called when the path changes
    return () => {
      // Kill all GSAP animations and ScrollTriggers
      killGSAP();
      
      // Log cleanup in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[GSAPCleanup] Cleaned up animations after navigating from', pathname);
      }
    };
  }, [pathname]);

  return <>{children}</>;
}
