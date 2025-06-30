import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { TextPlugin } from 'gsap/TextPlugin';
import { SplitText } from 'gsap/SplitText'; 
import { useEffect, useRef, useState } from 'react';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, TextPlugin, SplitText);
}

// Advanced parallax effect on mouse movement
export const useParallaxEffect = (
  shouldAnimate = true,
  sensitivity = 0.05,
  ease = "power1.out",
  duration = 1
) => {
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!shouldAnimate || !ref.current || typeof window === 'undefined') return;
    
    const element = ref.current;
    
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const xPos = (clientX / window.innerWidth - 0.5) * sensitivity * 100;
      const yPos = (clientY / window.innerHeight - 0.5) * sensitivity * 100;
      
      gsap.to(element, {
        x: xPos,
        y: yPos,
        duration,
        ease
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [shouldAnimate, sensitivity, ease, duration]);
  
  return ref;
};

// Enhanced text reveal animation
export const useTextReveal = (
  shouldAnimate = true,
  staggerAmount = 0.03,
  duration = 0.8,
  ease = "back.out(1.7)"
) => {
  const ref = useRef<HTMLElement>(null);
  
  useEffect(() => {
    if (!shouldAnimate || !ref.current || typeof window === 'undefined') return;
    
    const element = ref.current;
    const splitText = new SplitText(element, { type: "chars,words" });
    
    gsap.set(splitText.chars, { opacity: 0, y: 50 });
    
    const animation = ScrollTrigger.create({
      trigger: element,
      start: "top 85%",
      onEnter: () => {
        gsap.to(splitText.chars, {
          opacity: 1,
          y: 0,
          duration,
          stagger: staggerAmount,
          ease
        });
      },
      once: true
    });
    
    return () => {
      animation.kill();
    };
  }, [shouldAnimate, staggerAmount, duration, ease]);
  
  return ref;
};

// 3D card tilt effect
export const use3DCardEffect = (
  shouldAnimate = true,
  intensity = 15
) => {
  const ref = useRef<HTMLElement>(null);
  
  useEffect(() => {
    if (!shouldAnimate || !ref.current || typeof window === 'undefined') return;
    
    const element = ref.current;
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const xPos = x / rect.width - 0.5;
      const yPos = y / rect.height - 0.5;
      
      gsap.to(element, {
        rotationY: xPos * intensity,
        rotationX: -yPos * intensity,
        ease: "power2.out",
        duration: 0.5,
        transformPerspective: 1000
      });
    };
    
    const handleMouseLeave = () => {
      gsap.to(element, {
        rotationY: 0,
        rotationX: 0,
        ease: "power3.out",
        duration: 0.5
      });
    };
    
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [shouldAnimate, intensity]);
  
  return ref;
};

// Scroll-triggered horizontal scrolling
export const useHorizontalScroll = (
  shouldAnimate = true,
  scrub = 1,
  snap = false
) => {
  const ref = useRef<HTMLElement>(null);
  
  useEffect(() => {
    if (!shouldAnimate || !ref.current || typeof window === 'undefined') return;
    
    const element = ref.current;
    const scrollItems = element.querySelectorAll('.scroll-item');
    
    if (scrollItems.length === 0) return;
    
    const animation = gsap.to(scrollItems, {
      xPercent: -100 * (scrollItems.length - 1),
      ease: "none",
      scrollTrigger: {
        trigger: element,
        pin: true,
        pinSpacing: true,
        scrub,
        snap: snap ? 1 / (scrollItems.length - 1) : undefined,
        end: () => `+=${element.scrollWidth}`
      }
    });
    
    return () => {
      animation.kill();
    };
  }, [shouldAnimate, scrub, snap]);
  
  return ref;
};

// Enhanced scroll progress animation
export const useScrollProgress = () => {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      
      const scrollProgress = scrollTop / (scrollHeight - clientHeight);
      setProgress(scrollProgress);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  return progress;
};

// Magnetic button effect
export const useMagneticEffect = (
  shouldAnimate = true,
  intensity = 1,
  ease = "power2.out",
  duration = 0.3
) => {
  const ref = useRef<HTMLElement>(null);
  
  useEffect(() => {
    if (!shouldAnimate || !ref.current || typeof window === 'undefined') return;
    
    const element = ref.current;
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const distanceX = (x - centerX) * intensity;
      const distanceY = (y - centerY) * intensity;
      
      gsap.to(element, {
        x: distanceX,
        y: distanceY,
        duration,
        ease
      });
    };
    
    const handleMouseLeave = () => {
      gsap.to(element, {
        x: 0,
        y: 0,
        duration,
        ease: "elastic.out(1, 0.3)"
      });
    };
    
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [shouldAnimate, intensity, ease, duration]);
  
  return ref;
};

// Enhanced fade-in animation with more options
export const useEnhancedFadeIn = (
  shouldAnimate = true,
  delay = 0,
  duration = 0.8,
  ease = "power2.out",
  direction = "up", // "up", "down", "left", "right"
  distance = 50,
  threshold = 0.1
) => {
  const ref = useRef<HTMLElement>(null);
  
  useEffect(() => {
    if (!shouldAnimate || !ref.current || typeof window === 'undefined') return;
    
    const element = ref.current;
    let initialProps: { opacity: number; x?: number; y?: number } = { opacity: 0 };
    
    // Set initial position based on direction
    switch (direction) {
      case "up":
        initialProps = { ...initialProps, y: distance };
        break;
      case "down":
        initialProps = { ...initialProps, y: -distance };
        break;
      case "left":
        initialProps = { ...initialProps, x: distance };
        break;
      case "right":
        initialProps = { ...initialProps, x: -distance };
        break;
    }
    
    gsap.set(element, initialProps);
    
    const animation = ScrollTrigger.create({
      trigger: element,
      start: `top ${(1 - threshold) * 100}%`,
      onEnter: () => {
        gsap.to(element, {
          opacity: 1,
          x: direction === "left" || direction === "right" ? 0 : undefined,
          y: direction === "up" || direction === "down" ? 0 : undefined,
          duration,
          delay,
          ease
        });
      },
      once: true
    });
    
    return () => {
      animation.kill();
    };
  }, [shouldAnimate, delay, duration, ease, direction, distance, threshold]);
  
  return ref;
};
