import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { TextPlugin } from 'gsap/TextPlugin';
import { useEffect, useRef } from 'react';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, TextPlugin);
}

// Hook for fade-in animations on scroll
export const useFadeInAnimation = (
  shouldAnimate = true,
  delay = 0,
  duration = 0.8,
  ease = "power2.out"
) => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!shouldAnimate || !ref.current) return;

    const element = ref.current;
    
    gsap.set(element, { 
      opacity: 0, 
      y: 50 
    });
    
    const animation = gsap.to(element, {
      opacity: 1,
      y: 0,
      duration,
      delay,
      ease,
      scrollTrigger: {
        trigger: element,
        start: "top bottom-=100",
        toggleActions: "play none none reset"
      }
    });

    return () => {
      animation.kill();
    };
  }, [shouldAnimate, delay, duration, ease]);

  return ref;
};

// Hook for stagger animations on scroll
export const useStaggerAnimation = (
  childSelector: string,
  shouldAnimate = true,
  staggerDelay = 0.1,
  duration = 0.6
) => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!shouldAnimate || !ref.current) return;
    
    const element = ref.current;
    const children = element.querySelectorAll(childSelector);
    
    gsap.set(children, { 
      opacity: 0, 
      y: 30 
    });
    
    const animation = gsap.to(children, {
      opacity: 1,
      y: 0,
      duration,
      stagger: staggerDelay,
      ease: "power2.out",
      scrollTrigger: {
        trigger: element,
        start: "top bottom-=100",
        toggleActions: "play none none reset"
      }
    });

    return () => {
      animation.kill();
    };
  }, [shouldAnimate, childSelector, staggerDelay, duration]);

  return ref;
};

// Hook for text typing animation
export const useTextTypingAnimation = (
  text: string,
  shouldAnimate = true, 
  duration = 1.5
) => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!shouldAnimate || !ref.current) return;
    
    const element = ref.current;
    
    const animation = gsap.to(element, {
      duration,
      text: {
        value: text
      },
      ease: "none",
      scrollTrigger: {
        trigger: element,
        start: "top bottom-=100",
        toggleActions: "play none none reset"
      }
    });

    return () => {
      animation.kill();
    };
  }, [shouldAnimate, text, duration]);

  return ref;
};

// Hook for parallax effect on scroll
export const useParallaxEffect = (
  intensity = 0.3,
  shouldAnimate = true
) => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!shouldAnimate || !ref.current) return;
    
    const element = ref.current;
    
    const animation = gsap.to(element, {
      y: () => -intensity * ScrollTrigger.maxScroll(window),
      ease: "none",
      scrollTrigger: {
        start: 0,
        end: "max",
        invalidateOnRefresh: true,
        scrub: true
      }
    });

    return () => {
      animation.kill();
    };
  }, [shouldAnimate, intensity]);

  return ref;
};

// Hook for scroll-triggered section reveal
export const useScrollReveal = (
  shouldAnimate = true,
  offset = "0px"
) => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!shouldAnimate || !ref.current) return;
    
    const element = ref.current;
    
    gsap.set(element, { 
      clipPath: "inset(0 100% 0 0)" 
    });
    
    const animation = gsap.to(element, {
      clipPath: "inset(0 0% 0 0)",
      duration: 1.2,
      ease: "power4.inOut",
      scrollTrigger: {
        trigger: element,
        start: `top bottom-=${offset}`,
        toggleActions: "play none none reset"
      }
    });

    return () => {
      animation.kill();
    };
  }, [shouldAnimate, offset]);

  return ref;
};

// Hook for animated counter
export const useCounterAnimation = (
  endValue: number,
  shouldAnimate = true,
  duration = 2,
  prefix = "",
  suffix = ""
) => {
  const ref = useRef<HTMLElement>(null);
  const valueRef = useRef({ value: 0 });

  useEffect(() => {
    if (!shouldAnimate || !ref.current) return;
    
    const element = ref.current;
    valueRef.current.value = 0;
    
    const animation = gsap.to(valueRef.current, {
      value: endValue,
      duration,
      ease: "power2.out",
      onUpdate: () => {
        if (element) {
          element.innerHTML = prefix + Math.round(valueRef.current.value) + suffix;
        }
      },
      scrollTrigger: {
        trigger: element,
        start: "top bottom-=100",
        toggleActions: "play none none reset"
      }
    });

    return () => {
      animation.kill();
    };
  }, [shouldAnimate, endValue, duration, prefix, suffix]);

  return ref;
};

// Smooth scroll function
export const smoothScrollTo = (target: string, duration = 1) => {
  gsap.to(window, {
    duration,
    scrollTo: {
      y: target,
      offsetY: 50
    },
    ease: "power3.inOut"
  });
};
