'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { cn } from '@/lib/utils';

interface SuccessAnimationProps {
  className?: string;
  onComplete?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export function SuccessAnimation({ 
  className, 
  onComplete, 
  size = 'md' 
}: SuccessAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<SVGCircleElement>(null);
  const checkRef = useRef<SVGPathElement>(null);
  
  useEffect(() => {
    if (!circleRef.current || !checkRef.current) return;
    
    const timeline = gsap.timeline({
      onComplete: () => onComplete?.(),
    });
    
    // Set initial states
    gsap.set(circleRef.current, { 
      strokeDasharray: 1000, 
      strokeDashoffset: 1000,
      opacity: 0
    });
    
    gsap.set(checkRef.current, { 
      strokeDasharray: 100, 
      strokeDashoffset: 100,
      opacity: 0
    });
    
    // Animate circle
    timeline.to(circleRef.current, {
      strokeDashoffset: 0,
      opacity: 1,
      duration: 0.8,
      ease: "power2.inOut"
    });
    
    // Animate check mark
    timeline.to(checkRef.current, {
      strokeDashoffset: 0,
      opacity: 1,
      duration: 0.5,
      ease: "power2.out"
    }, "-=0.4");
    
    // Scale animation
    timeline.to(containerRef.current, {
      scale: 1.1,
      duration: 0.3,
      ease: "power2.out"
    });
    
    timeline.to(containerRef.current, {
      scale: 1,
      duration: 0.2,
      ease: "power2.inOut"
    });
    
    return () => {
      timeline.kill();
    };
  }, [onComplete]);
  
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };
  
  return (
    <div 
      ref={containerRef}
      className={cn("flex items-center justify-center", className)}
    >
      <div className={cn(sizeClasses[size])}>
        <svg 
          viewBox="0 0 100 100" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="#f0fdf4"
            className="animate-pulse"
          />
          
          {/* Animated circle */}
          <circle
            ref={circleRef}
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#10b981"
            strokeWidth="4"
            strokeLinecap="round"
          />
          
          {/* Animated check mark */}
          <path
            ref={checkRef}
            d="M30 50 L45 65 L70 35"
            fill="none"
            stroke="#10b981"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
