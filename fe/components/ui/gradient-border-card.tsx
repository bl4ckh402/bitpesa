"use client"

import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface GradientBorderCardProps {
  className?: string;
  children: React.ReactNode;
  gradientFrom?: string;
  gradientTo?: string;
  animate?: boolean;
}

export function GradientBorderCard({
  className,
  children,
  gradientFrom = "from-blue-500",
  gradientTo = "to-purple-500",
  animate = true,
}: GradientBorderCardProps) {
  return (
    <div className={cn("relative p-[2px] rounded-xl group", className)}>
      {animate ? (
        <motion.div
          className={cn(
            "absolute inset-0 rounded-xl bg-gradient-to-r",
            gradientFrom,
            gradientTo
          )}
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          style={{ backgroundSize: "200% 200%" }}
        />
      ) : (
        <div
          className={cn(
            "absolute inset-0 rounded-xl bg-gradient-to-r",
            gradientFrom,
            gradientTo
          )}
        />
      )}
      <div className="relative bg-white dark:bg-gray-900 rounded-[10px] h-full">
        {children}
      </div>
    </div>
  );
}
