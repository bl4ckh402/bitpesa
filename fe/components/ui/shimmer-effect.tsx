"use client"

import { cn } from "@/lib/utils";
import React from "react";
import { motion } from "framer-motion";

interface ShimmerEffectProps {
  className?: string;
  children: React.ReactNode;
}

export function ShimmerEffect({ className, children }: ShimmerEffectProps) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {children}
      <motion.div
        className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-white to-transparent"
        style={{
          backgroundSize: "200% 100%",
        }}
        animate={{
          backgroundPosition: ["200% 0", "-200% 0"],
        }}
        transition={{
          duration: 2.5,
          ease: "linear",
          repeat: Infinity,
        }}
      />
    </div>
  );
}
