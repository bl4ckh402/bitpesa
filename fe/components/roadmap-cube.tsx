"use client"

import React, { useRef, useEffect } from "react"
import gsap from "gsap"

export function RoadmapCube() {
  const cubeRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (!cubeRef.current) return
    
    // Initial animation setup
    gsap.set(cubeRef.current, { 
      rotationY: 45, 
      rotationX: 45,
      transformPerspective: 1000,
      transformStyle: "preserve-3d"
    })
    
    // Continuous rotation animation
    const animation = gsap.to(cubeRef.current, {
      rotationY: "+=360",
      duration: 20,
      ease: "none",
      repeat: -1
    })
    
    // Add hover interaction
    cubeRef.current.addEventListener("mouseenter", () => {
      gsap.to(cubeRef.current, {
        scale: 1.2,
        duration: 0.5,
        ease: "back.out"
      })
      // Slow down rotation on hover
      animation.timeScale(0.3)
    })
    
    cubeRef.current.addEventListener("mouseleave", () => {
      gsap.to(cubeRef.current, {
        scale: 1,
        duration: 0.5,
        ease: "back.out"
      })
      // Resume normal speed
      animation.timeScale(1)
    })
    
    // Handle mousemove for perspective shift
    const handleMouseMove = (e: MouseEvent) => {
      if (!cubeRef.current) return
      
      const rect = cubeRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      
      const moveX = (e.clientX - centerX) * 0.02
      const moveY = (e.clientY - centerY) * -0.02
      
      gsap.to(cubeRef.current, {
        rotationY: 45 + moveX,
        rotationX: 45 + moveY,
        duration: 1,
        ease: "power2.out"
      })
    }
    
    window.addEventListener("mousemove", handleMouseMove)
    
    // Clean up function for animations and event listeners
    return () => {
      // Remove event listeners
      window.removeEventListener("mousemove", handleMouseMove)
      if (cubeRef.current) {
        cubeRef.current.removeEventListener("mouseenter", () => {})
        cubeRef.current.removeEventListener("mouseleave", () => {})
      }
      
      // Kill all animations targeting the cube
      animation.kill()
      gsap.killTweensOf(cubeRef.current)
    }
  }, [])
  
  return (
    <div className="w-32 h-32 relative origin-center mx-auto">
      <div 
        ref={cubeRef}
        className="w-full h-full relative origin-center cursor-pointer"
      >
        {/* Front face */}
        <div className="absolute inset-0 bg-orange-600/20 border border-orange-500/50 backdrop-blur-sm rounded-lg shadow-lg shadow-orange-500/20 transform translate-z-[64px]">
          <div className="flex items-center justify-center h-full">
            <svg className="w-12 h-12 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-14a2 2 0 00-2 2v1h10V4a2 2 0 00-2-2h-6zM9 18a1 1 0 100-2 1 1 0 000 2zm-5-7h10v1a2 2 0 01-2 2H6a2 2 0 01-2-2v-1z" clipRule="evenodd"></path>
            </svg>
          </div>
        </div>
        
        {/* Back face */}
        <div className="absolute inset-0 bg-blue-600/20 border border-blue-500/50 backdrop-blur-sm rounded-lg shadow-lg shadow-blue-500/20 transform -translate-z-[64px]">
          <div className="flex items-center justify-center h-full">
            <svg className="w-12 h-12 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd"></path>
            </svg>
          </div>
        </div>
        
        {/* Left face */}
        <div className="absolute inset-0 bg-purple-600/20 border border-purple-500/50 backdrop-blur-sm rounded-lg shadow-lg shadow-purple-500/20 transform -translate-x-[64px] rotate-y-90">
          <div className="flex items-center justify-center h-full">
            <svg className="w-12 h-12 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z"></path>
            </svg>
          </div>
        </div>
        
        {/* Right face */}
        <div className="absolute inset-0 bg-green-600/20 border border-green-500/50 backdrop-blur-sm rounded-lg shadow-lg shadow-green-500/20 transform translate-x-[64px] rotate-y-90">
          <div className="flex items-center justify-center h-full">
            <svg className="w-12 h-12 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"></path>
            </svg>
          </div>
        </div>
        
        {/* Top face */}
        <div className="absolute inset-0 bg-amber-600/20 border border-amber-500/50 backdrop-blur-sm rounded-lg shadow-lg shadow-amber-500/20 transform translate-y-[64px] rotate-x-90">
          <div className="flex items-center justify-center h-full">
            <svg className="w-12 h-12 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path>
            </svg>
          </div>
        </div>
        
        {/* Bottom face */}
        <div className="absolute inset-0 bg-rose-600/20 border border-rose-500/50 backdrop-blur-sm rounded-lg shadow-lg shadow-rose-500/20 transform -translate-y-[64px] rotate-x-90">
          <div className="flex items-center justify-center h-full">
            <svg className="w-12 h-12 text-rose-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm11 1H6v8l4-2 4 2V6z" clipRule="evenodd"></path>
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
