"use client"

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { cn } from "@/lib/utils";

interface FloatingElementProps {
  className?: string;
  children?: React.ReactNode;
  size?: number | string;
  x?: number;
  y?: number;
  delay?: number;
  duration?: number;
  blurAmount?: string;
  opacity?: number;
  color?: string;
}

export function FloatingElement({
  className,
  children,
  size = '10rem',
  x = 20,
  y = 20,
  delay = 0,
  duration = 3,
  blurAmount = '50px',
  opacity = 0.07,
  color = '#8b5cf6'
}: FloatingElementProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    const element = elementRef.current;

    // Deterministic starting position to prevent hydration mismatch
    gsap.set(element, {
      x: -x/4,
      y: -y/4,
    });

    // Create the floating animation
    const tl = gsap.timeline({ repeat: -1, yoyo: true });
    
    // Use index-based rotation rather than random to avoid hydration mismatches
    const rotation1 = (delay * 10) % 10 - 5; // Deterministic rotation based on delay
    const rotation2 = (delay * 8) % 10 - 5;  // Different formula for second rotation
    
    tl.to(element, {
      x: `+=${x}`,
      y: `+=${y}`,
      rotation: rotation1,
      duration: duration,
      delay: delay,
      ease: "sine.inOut",
    });
    
    tl.to(element, {
      x: `-=${x}`,
      y: `-=${y}`,
      rotation: rotation2,
      duration: duration,
      ease: "sine.inOut",
    });

    return () => {
      tl.kill();
    };
  }, [x, y, delay, duration]);

  const styleObj = {
    width: typeof size === 'number' ? `${size}px` : size,
    height: typeof size === 'number' ? `${size}px` : size,
    borderRadius: '50%',
    background: color,
    filter: `blur(${blurAmount})`,
    opacity: opacity,
  };
  
  return (
    <div
      ref={elementRef}
      className={cn("absolute pointer-events-none", className)}
      style={styleObj}
    >
      {children}
    </div>
  );
}

interface FloatingElementsProps {
  count?: number;
  className?: string;
  colors?: string[];
}

export function FloatingElements({
  count = 4,
  className,
  colors = ["#3b82f640", "#8b5cf640", "#ec4899", "#f59e0b"]
}: FloatingElementsProps) {
  // Generate random positions for the elements
  const positions = [
    "-top-10 -right-10",
    "-bottom-20 -left-20",
    "top-1/3 right-1/4",
    "bottom-1/4 right-1/3",
    "top-1/4 left-1/4",
    "bottom-1/3 right-1/5",
    "top-2/3 right-2/3",
    "bottom-10 right-1/2"
  ];

  // Generate elements based on count with completely deterministic values to avoid hydration errors
  const elements = Array.from({ length: Math.min(count, positions.length) }, (_, index) => ({
    size: `${12 + (index * 2)}rem`, // Deterministic size based on index
    x: 20 + (index * 5),
    y: 20 + (index * 5),
    delay: index * 0.5,
    color: colors[index % colors.length],
    blurAmount: `${40 + (index * 10)}px`,
    opacity: 0.05, // Fixed opacity to avoid hydration mismatch
    position: positions[index]
  }));

  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none -z-10", className)}>
      {elements.map((element, index) => (
        <FloatingElement 
          key={index}
          size={element.size} 
          x={element.x} 
          y={element.y} 
          delay={element.delay} 
          color={element.color} 
          blurAmount={element.blurAmount}
          opacity={element.opacity}
          className={element.position}
        />
      ))}
    </div>
  );
}
