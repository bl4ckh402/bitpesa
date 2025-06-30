'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FormStepTransitionProps {
  className?: string;
  children: React.ReactNode;
  isActive: boolean;
  direction: 'forward' | 'backward';
  stepKey?: string | number; // Renamed from key to stepKey
}

export function FormStepTransition({
  className,
  children,
  isActive,
  direction,
  stepKey
}: FormStepTransitionProps) {
  const xOffset = direction === 'forward' ? 50 : -50;
  
  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          key={stepKey}
          initial={{ opacity: 0, x: xOffset }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -xOffset }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
          className={cn("w-full", className)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function FormStepContainer({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-h-[400px] relative overflow-hidden", className)}>
      {children}
    </div>
  );
}
