"use client"

import React, { useRef, useEffect } from 'react';
import { cn } from "@/lib/utils";
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
  delay?: number;
  duration?: number;
  once?: boolean;
  threshold?: number;
}

export function ScrollReveal({
  children,
  className,
  direction = 'up',
  distance = 30,
  delay = 0,
  duration = 0.8,
  once = true,
  threshold = 0.2,
}: ScrollRevealProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const element = elementRef.current;
    if (!element) return;

    // Set initial state based on direction
    let initialProps: gsap.TweenVars = { opacity: 0 };
    
    switch (direction) {
      case 'up':
        initialProps.y = distance;
        break;
      case 'down':
        initialProps.y = -distance;
        break;
      case 'left':
        initialProps.x = distance;
        break;
      case 'right':
        initialProps.x = -distance;
        break;
    }

    gsap.set(element, initialProps);

    // Create the animation
    const animation = gsap.to(element, {
      opacity: 1,
      x: 0,
      y: 0,
      duration: duration,
      delay: delay,
      ease: "power2.out",
      paused: true,
    });

    // Create ScrollTrigger
    const trigger = ScrollTrigger.create({
      trigger: element,
      start: `top bottom-=${threshold * 100}%`,
      onEnter: () => {
        animation.play();
      },
      onLeaveBack: () => {
        if (!once) {
          animation.reverse();
        }
      },
      once: once,
    });

    return () => {
      animation.kill();
      trigger.kill();
    };
  }, [direction, distance, delay, duration, once, threshold]);

  // Add a cleanup function when component unmounts
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    return () => {
      // Kill any remaining tweens targeting this element and reset properties
      gsap.killTweensOf(element);
      gsap.set(element, { clearProps: "all" });
      
      // Ensure ScrollTrigger instances are killed
      const triggers = ScrollTrigger.getAll().filter(t => t.vars.trigger === element);
      triggers.forEach(t => t.kill());
    };
  }, []);

  return (
    <div ref={elementRef} className={cn(className)}>
      {children}
    </div>
  );
}
