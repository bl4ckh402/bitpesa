import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef } from 'react';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Utility function to kill all GSAP animations on a specific page or component.
 * This can be used in useEffect's cleanup function when a page/component unmounts.
 * 
 * @param selectors - Optional CSS selectors to target specific elements. If not provided, cleans all animations.
 * @param killScrollTriggers - Whether to kill all ScrollTrigger instances (default: true)
 */
export function killGSAP(selectors?: string | string[], killScrollTriggers = true): void {
  // Kill animations of specific elements if selectors are provided
  if (selectors) {
    if (typeof selectors === 'string') {
      gsap.killTweensOf(selectors);
    } else {
      selectors.forEach(selector => {
        gsap.killTweensOf(selector);
      });
    }
  } else {
    // Kill all animations if no selector is provided
    gsap.globalTimeline.clear();
  }

  // Kill all ScrollTrigger instances if requested
  if (killScrollTriggers) {
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  }
}

/**
 * React hook to kill all GSAP animations when a component unmounts
 * 
 * @param selectors - Optional CSS selectors to target specific elements. If not provided, cleans all animations.
 */
export function useGSAPCleanup(selectors?: string | string[]): void {
  useEffect(() => {
    // Return cleanup function
    return () => {
      killGSAP(selectors);
    };
  }, [selectors]);
}

/**
 * Creates a GSAP context for a component to make cleanup easier
 * It returns a function that creates a GSAP context and another to kill it.
 */
export function useGSAPContext() {
  const contextRef = useRef<gsap.Context | null>(null);
  
  const createContext = (callback: (ctx: gsap.Context) => void, scope?: Element | string) => {
    // Kill previous context if it exists
    if (contextRef.current) {
      contextRef.current.kill();
    }
    
    // Create new context
    contextRef.current = gsap.context(callback, scope);
    return contextRef.current;
  };
  
  // Clean up when the component unmounts
  useEffect(() => {
    return () => {
      if (contextRef.current) {
        contextRef.current.kill();
      }
    };
  }, []);
  
  return {
    createContext,
    killContext: () => {
      if (contextRef.current) {
        contextRef.current.kill();
        contextRef.current = null;
      }
    }
  };
}

/**
 * Enhanced utility to manage multiple GSAP contexts across a page.
 * Useful for complex pages with multiple animated sections.
 */
export function useMultiGSAPContexts() {
  const contextsRef = useRef<gsap.Context[]>([]);
  
  const createContext = (callback: (ctx: gsap.Context) => void, scope?: Element | string) => {
    const context = gsap.context(callback, scope);
    contextsRef.current.push(context);
    return context;
  };
  
  useEffect(() => {
    return () => {
      // Clean up all contexts when component unmounts
      contextsRef.current.forEach(ctx => {
        ctx.kill();
      });
      contextsRef.current = [];
    };
  }, []);
  
  return {
    createContext,
    killAllContexts: () => {
      contextsRef.current.forEach(ctx => {
        ctx.kill();
      });
      contextsRef.current = [];
    },
    killContextAtIndex: (index: number) => {
      if (index >= 0 && index < contextsRef.current.length) {
        contextsRef.current[index].kill();
        contextsRef.current.splice(index, 1);
      }
    }
  };
}
