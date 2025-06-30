'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { cn } from '@/lib/utils';

interface StepIndicatorProps {
  steps: {
    id: number;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
  }[];
  currentStep: number;
  onStepClick?: (stepId: number) => void;
  allowNavigation?: boolean;
}

export function StepIndicator({ 
  steps, 
  currentStep, 
  onStepClick,
  allowNavigation = false
}: StepIndicatorProps) {
  const stepsRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  
  // Animation for progress bar
  useEffect(() => {
    if (!progressRef.current) return;
    
    const progress = (currentStep - 1) / (steps.length - 1);
    
    gsap.to(progressRef.current, {
      scaleX: progress,
      duration: 0.8,
      ease: "power2.inOut"
    });
  }, [currentStep, steps.length]);
  
  // Animation for steps on mount
  useEffect(() => {
    if (!stepsRef.current) return;
    
    const stepElements = stepsRef.current.querySelectorAll('.step-item');
    
    gsap.from(stepElements, {
      y: -20,
      opacity: 1,
      stagger: 0.1,
      duration: 0.5,
      ease: "power2.out",
      delay: 0.3
    });
  }, []);
  
  return (
    <div className="mb-12 relative" ref={stepsRef}>
      {/* Progress bar */}
      <div className="absolute top-9 left-0 w-full h-[3px] bg-gray-200 -z-10">
        <div 
          ref={progressRef}
          className="h-full bg-gradient-to-r from-[#f7931a] via-[#fbbf24] to-[#ff6b35] origin-left"
          style={{ transform: 'scaleX(0)' }}
        />
      </div>
      
      {/* Steps */}
      <div className="flex justify-between">
        {steps.map((step) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          const isPending = step.id > currentStep;
          
          return (
            <motion.div 
              key={step.id}
              className={cn(
                "step-item flex flex-col items-center text-center"
              )}
              whileHover={allowNavigation ? { scale: 1.05 } : {}}
              onClick={() => allowNavigation && onStepClick && onStepClick(step.id)}
            //   style={{ cursor: allowNavigation ? 'pointer' : 'default' }}
            >
              {/* Step circle */}
              <motion.div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center mb-2",
                  isActive && "bg-gradient-to-r from-[#f7931a] to-[#ff6b35] text-white shadow-md",
                  isCompleted && "bg-green-100 text-green-700 border border-green-300",
                  isPending && "bg-gray-100 text-white/70 border border-gray-200"
                )}
                initial={false}
                animate={isActive ? {
                  scale: [1, 1.15, 1],
                  transition: { duration: 0.5, times: [0, 0.5, 1] }
                } : {}}
              >
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.icon
                )}
              </motion.div>
              
              {/* Step title */}
              <h3 className={cn(
                "text-sm font-medium",
                isActive ? "text-primary font-bold" : "",
                isPending ? "text-white/70" : "",
                isCompleted ? "text-green-600" : ""
              )}>
                {step.title}
              </h3>
              
              {/* Step subtitle */}
              <p className={cn(
                "text-xs mt-1 max-w-[120px]",
                isActive ? "text-primary-foreground" : "",
                isPending ? "text-white/70" : "",
                isCompleted ? "text-green-700" : ""
              )}>
                {step.subtitle}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
