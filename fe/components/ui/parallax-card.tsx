"use client"

import React, { useRef, useState } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { cn } from "@/lib/utils";

interface ParallaxCardProps {
  className?: string;
  children: React.ReactNode;
  depth?: number;
  backgroundColors?: string[];
}

export function ParallaxCard({ 
  className, 
  children, 
  depth = 30, 
  backgroundColors = ["#3b82f6", "#8b5cf6"]
}: ParallaxCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  // Motion values for tracking mouse position relative to the card
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    
    // Calculate mouse position relative to the card center in percentages (-50 to 50)
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const x = ((e.clientX - centerX) / rect.width) * 100;
    const y = ((e.clientY - centerY) / rect.height) * 100;
    
    mouseX.set(x);
    mouseY.set(y);
  };

  return (
    <motion.div
      ref={cardRef}
      className={cn(
        "relative rounded-xl overflow-hidden transition-all duration-200",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        perspective: 1000,
        transformStyle: "preserve-3d",
      }}
      animate={{
        transform: isHovered
          ? `rotateY(${mouseX.get() / depth}deg) rotateX(${-mouseY.get() / depth}deg)`
          : "rotateY(0deg) rotateX(0deg)",
        boxShadow: isHovered
          ? "0 20px 40px rgba(0,0,0,0.2)"
          : "0 10px 20px rgba(0,0,0,0.1)",
      }}
      transition={{
        rotateX: { type: "spring", stiffness: 100, damping: 20 },
        rotateY: { type: "spring", stiffness: 100, damping: 20 },
        boxShadow: { duration: 0.2 },
      }}
    >
      {/* Background gradient */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: `linear-gradient(135deg, ${backgroundColors[0]} 0%, ${backgroundColors[1]} 100%)`,
          opacity: 0.06,
          filter: "blur(5px)",
        }}
      />
      
      {/* Spotlight effect that follows the mouse */}
      {isHovered && (
        <motion.div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${50 + mouseX.get() / 2}% ${50 + mouseY.get() / 2}%, rgba(255,255,255,0.2) 0%, transparent 60%)`,
          }}
        />
      )}
      
      {/* Content with slight parallax movement */}
      <motion.div
        className="relative z-20"
        animate={{
          x: isHovered ? mouseX.get() / 10 : 0,
          y: isHovered ? mouseY.get() / 10 : 0,
        }}
        transition={{
          x: { type: "spring", stiffness: 100, damping: 25 },
          y: { type: "spring", stiffness: 100, damping: 25 },
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
