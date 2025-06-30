"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Shield, Zap, TrendingUp, Bitcoin, DollarSign, Euro, PoundSterling } from "lucide-react"
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { motion } from 'framer-motion'
import { useFadeInAnimation, useStaggerAnimation, useTextTypingAnimation } from "@/lib/gsap-utils"

// Make sure GSAP plugins are registered
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface HeroSectionProps {
  onOpenCalculator: () => void;
  onOpenWalletConnect: () => void;
}

export function HeroSection({ onOpenCalculator, onOpenWalletConnect }: HeroSectionProps) {
  // Animation refs
  const heroRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const buttonsRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const badgesRef = useStaggerAnimation('.animated-badge', true, 0.15)
  
  // Animated dots for trailing text effect
  const [dots, setDots] = useState('.')
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '.' : prev + '.')
    }, 500)
    return () => clearInterval(interval)
  }, [])

  // Hero section animations
  useEffect(() => {
    // Create GSAP context for easier cleanup
    const ctx = gsap.context(() => {
      // Initial settings - hide elements
      gsap.set([titleRef.current, subtitleRef.current, buttonsRef.current], { 
        opacity: 0,
        y: 50 
      })
      
      // Timeline for hero entrance
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } })
      
      tl.to(titleRef.current, { 
        opacity: 1, 
        y: 0, 
        duration: 1.2,
        delay: 0.3
      })
      .to(subtitleRef.current, { 
        opacity: 1, 
        y: 0, 
        duration: 1,
      }, "-=0.6")
      .to(buttonsRef.current, { 
        opacity: 1, 
        y: 0, 
        duration: 0.8,
      }, "-=0.5")
      .fromTo(cardRef.current, 
        { opacity: 0, y: 80, scale: 0.9 },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1, 
          duration: 1.2, 
          ease: "back.out(1.2)" 
        }, 
        "-=0.4"
      )
      
      // Create scroll-based animations
      ScrollTrigger.create({
        trigger: heroRef.current,
        start: "top top",
        end: "bottom top",
        scrub: true,
        onUpdate: (self) => {
          // Parallax effect for hero content
          if (titleRef.current && subtitleRef.current) {
            gsap.to(titleRef.current, {
              y: self.progress * 50,
              duration: 0
            })
            gsap.to(subtitleRef.current, {
              y: self.progress * 30,
              duration: 0
            })
          }
        }
      })
    }, heroRef)
    
    // Return cleanup function that will be called when component unmounts
    return () => {
      // Clean up all GSAP animations created within this context
      ctx.revert();
    };
  }, [])
  
  return (
    <motion.section 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      ref={heroRef} 
      className="relative overflow-hidden min-h-[90vh] flex items-center pt-20 pb-32 container mx-auto px-4"
    >
      {/* Background animations */}
      <div className="absolute top-0 left-0 w-full h-full -z-10">
        <div className="absolute top-20 left-10 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse-slow animation-delay-1000"></div>
      </div>
      
      {/* Hero content */}
      <div className="text-center max-w-4xl mx-auto relative z-10">
        {/* Animated title with split text effect */}
        <h1 
          ref={titleRef} 
          className="text-5xl sm:text-6xl md:text-8xl font-bold text-white mb-8 tracking-tight leading-tight"
        >
          <span className="inline-block overflow-hidden">
            <span className="inline-block">Borrow Fiat<span className="text-orange-500">.</span></span>
          </span>
          <br />
          <span className="inline-block overflow-hidden mt-2">
            <span className="inline-block text-gradient bg-gradient-to-r from-orange-500 to-amber-300 bg-clip-text text-transparent">
              Keep Your Bitcoin<span className="text-white">{dots}</span>
            </span>
          </span>
        </h1>
        
        <p ref={subtitleRef} className="text-lg sm:text-xl text-slate-300 mb-10 max-w-2xl mx-auto px-4 leading-relaxed">
          Use your BTC as collateral to access instant loans in KES, USD, EUR, and more. 
          <span className="hidden sm:inline"><br /></span> 100% non-custodial, smart contract-powered lending.
        </p>

        <div ref={buttonsRef} className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Button
            size="lg"
            className="bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-600 hover:to-amber-500 text-white px-8 py-6 text-lg rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-glow-orange"
            onClick={onOpenWalletConnect}
          >
            Get Started <ArrowRight className="ml-2 h-5 w-5 animate-pulse-gentle" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-slate-600 text-slate-300 hover:text-white hover:border-slate-400 backdrop-blur-sm bg-slate-800/30 hover:bg-slate-700/50 px-8 py-6 text-lg rounded-xl transition-all duration-300"
            onClick={onOpenCalculator}
          >
            Try Calculator
          </Button>        </div>

        {/* Animated Visual */}
        <div ref={cardRef} className="relative max-w-2xl mx-auto mb-16 perspective-1000">
          <div className="card-3d-container">
            <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/90 border-slate-700/60 backdrop-blur-md shadow-2xl rounded-2xl transform hover:scale-105 transition-all duration-500">
              <CardContent className="p-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <motion.div 
                    className="text-center"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 1.2 }}
                  >
                    <div className="relative">
                      <div className="absolute -inset-1 bg-orange-500/30 rounded-full blur-md"></div>
                      <Bitcoin className="h-20 w-20 text-orange-500 mx-auto mb-4 relative z-10 animate-float" />
                    </div>
                    <p className="text-slate-300 text-lg">Your BTC</p>
                    <p className="text-white font-bold text-xl">Stays Yours</p>
                  </motion.div>
                  
                  <motion.div 
                    className="hidden md:block"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ 
                      duration: 0.5, 
                      delay: 1.4,
                      repeat: Infinity,
                      repeatType: "reverse",
                      repeatDelay: 1
                    }}
                  >
                    <ArrowRight className="h-10 w-10 text-slate-400" />
                  </motion.div>
                  
                  <motion.div 
                    className="text-center"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 1.6 }}
                  >
                    <div className="flex justify-center space-x-3 mb-4">
                      <motion.div 
                        className="relative"
                        whileHover={{ scale: 1.1, y: -5 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        <div className="absolute -inset-1 bg-green-500/30 rounded-full blur-md"></div>
                        <DollarSign className="h-12 w-12 text-green-500 relative z-10" />
                      </motion.div>
                      <motion.div 
                        className="relative"
                        whileHover={{ scale: 1.1, y: -5 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        <div className="absolute -inset-1 bg-blue-500/30 rounded-full blur-md"></div>
                        <Euro className="h-12 w-12 text-blue-500 relative z-10" />
                      </motion.div>
                      <motion.div 
                        className="relative"
                        whileHover={{ scale: 1.1, y: -5 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        <div className="absolute -inset-1 bg-purple-500/30 rounded-full blur-md"></div>
                        <PoundSterling className="h-12 w-12 text-purple-500 relative z-10" />
                      </motion.div>
                    </div>
                    <p className="text-slate-300 text-lg">Instant Fiat</p>
                    <p className="text-white font-bold text-xl">In Your Account</p>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Security Badges */}
        <motion.div 
          ref={badgesRef as React.RefObject<HTMLDivElement>}
          className="flex flex-wrap justify-center gap-3 sm:gap-5"
        >
          <Badge
            variant="secondary"
            className="animated-badge bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-slate-300 hover:text-white px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base rounded-full transition-all duration-300 cursor-default border border-slate-700/50 shadow-lg transform hover:scale-105"
          >
            <Shield className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 text-orange-500" />
            100% Non-Custodial
          </Badge>
          <Badge
            variant="secondary"
            className="animated-badge bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-slate-300 hover:text-white px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base rounded-full transition-all duration-300 cursor-default border border-slate-700/50 shadow-lg transform hover:scale-105"
          >
            <Zap className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 text-yellow-500" />
            Smart Contract-Powered
          </Badge>
          <Badge
            variant="secondary"
            className="animated-badge bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-slate-300 hover:text-white px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base rounded-full transition-all duration-300 cursor-default border border-slate-700/50 shadow-lg transform hover:scale-105"
          >
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 text-green-500" />
            Competitive Rates
          </Badge>
        </motion.div>
      </div>
    </motion.section>
  )
}
