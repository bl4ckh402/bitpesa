'use client';

import { ReactNode } from 'react';
import { useGSAPCleanup } from '@/lib/gsap-cleanup';

interface WithGSAPCleanupProps {
  children: ReactNode;
  selectors?: string | string[];
}

/**
 * HOC (Higher Order Component) that automatically cleans up GSAP animations
 * when the component unmounts.
 * 
 * Usage:
 * ```tsx
 * <WithGSAPCleanup>
 *   <YourAnimatedComponent />
 * </WithGSAPCleanup>
 * ```
 */
export function WithGSAPCleanup({ children, selectors }: WithGSAPCleanupProps) {
  // This hook will clean up GSAP animations when the component unmounts
  useGSAPCleanup(selectors);
  
  return <>{children}</>;
}
