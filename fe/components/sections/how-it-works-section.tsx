'use client';

import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useFadeInAnimation, useStaggerAnimation } from "@/lib/gsap-utils";
import gsap from "gsap";
import { WalletIcon, Building, ArrowUpDown, Hourglass, BookOpen, Wallet, Coins, PenTool, Repeat } from "lucide-react";

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useFadeInAnimation(true, 0.2);
  const cardsRef = useStaggerAnimation('.process-card', true, 0.15);
  const isInView = useInView(sectionRef, { once: false, margin: "-100px" });
  
  // Line animation connecting the steps
  const lineRef = useRef<SVGPathElement>(null);
  
  useEffect(() => {
    if (isInView && lineRef.current) {
      gsap.fromTo(
        lineRef.current, 
        { strokeDashoffset: 1000 },
        { 
          strokeDashoffset: 0, 
          duration: 1.5, 
          ease: "power3.inOut",
          delay: 0.5
        }
      );
    }
  }, [isInView]);
  
  // Scroll parallax effect
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });
  
  const backgroundY = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", "30%"]
  );

  return (
    <section 
      ref={sectionRef} 
      id="how-it-works" 
      className="relative py-32 overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800/40 to-slate-900"
    >
      {/* Animated background */}
      <motion.div 
        className="absolute inset-0 z-0"
        style={{ y: backgroundY }}
      >
        <div className="absolute top-0 right-0 w-2/3 h-2/3 bg-orange-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-2/3 h-2/3 bg-blue-500/5 rounded-full blur-3xl"></div>
      </motion.div>
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.h2 
          ref={titleRef as React.RefObject<HTMLHeadingElement>}
          className="text-5xl md:text-6xl font-bold text-white text-center mb-24"
        >
          <span className="text-gradient bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-clip-text text-transparent">
            How It Works
          </span>
        </motion.h2>
        
        {/* Process steps with connecting line */}
        <div ref={cardsRef as React.RefObject<HTMLDivElement>} className="relative max-w-5xl mx-auto">
          {/* Connecting SVG line */}
          <div className="absolute top-1/2 left-0 w-full h-full -z-10 hidden md:block">
            <svg className="w-full" height="50" viewBox="0 0 1000 50" fill="none" preserveAspectRatio="none">
              <path 
                ref={lineRef}
                d="M0,25 C150,75 350,-25 500,25 C650,75 850,-25 1000,25" 
                stroke="url(#line-gradient)" 
                strokeWidth="2" 
                strokeDasharray="1000"
                strokeDashoffset="1000"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="line-gradient" x1="0" y1="0" x2="1000" y2="0">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="50%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            <motion.div 
              className="process-card"
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="bg-gradient-to-br from-slate-800/90 to-slate-900/70 border-orange-500/20 hover:border-orange-500/50 backdrop-blur-sm rounded-2xl shadow-xl transform hover:translate-y-[-10px] transition-all duration-500 hover:shadow-glow-orange">
                <CardContent className="p-8 text-center">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-orange-500/30 rounded-full blur-md"></div>
                    <div className="bg-gradient-to-br from-orange-500 to-amber-400 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 relative z-10">
                      <WalletIcon className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  <span className="inline-block bg-orange-500/20 text-orange-400 py-1 px-3 rounded-full text-sm font-medium mb-4">STEP 1</span>
                  <h3 className="text-2xl font-bold text-white mb-4">Connect ICP Identity</h3>
                  <p className="text-slate-300 leading-relaxed">Authenticate with Internet Identity for secure access to the platform. No passwords or seed phrases required</p>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div 
              className="process-card"
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="bg-gradient-to-br from-slate-800/90 to-slate-900/70 border-green-500/20 hover:border-green-500/50 backdrop-blur-sm rounded-2xl shadow-xl transform hover:translate-y-[-10px] transition-all duration-500 hover:shadow-glow-green">
                <CardContent className="p-8 text-center">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-green-500/30 rounded-full blur-md"></div>
                    <div className="bg-gradient-to-br from-green-500 to-emerald-400 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 relative z-10">
                      <Building className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  <span className="inline-block bg-green-500/20 text-green-400 py-1 px-3 rounded-full text-sm font-medium mb-4">STEP 2</span>
                  <h3 className="text-2xl font-bold text-white mb-4">Generate Bitcoin Address</h3>
                  <p className="text-slate-300 leading-relaxed">Our canister generates a unique Bitcoin address for you using threshold ECDSA signatures</p>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div 
              className="process-card"
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Card className="bg-gradient-to-br from-slate-800/90 to-slate-900/70 border-blue-500/20 hover:border-blue-500/50 backdrop-blur-sm rounded-2xl shadow-xl transform hover:translate-y-[-10px] transition-all duration-500 hover:shadow-glow-blue">
                <CardContent className="p-8 text-center">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-blue-500/30 rounded-full blur-md"></div>
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-400 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 relative z-10">
                      <ArrowUpDown className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  <span className="inline-block bg-blue-500/20 text-blue-400 py-1 px-3 rounded-full text-sm font-medium mb-4">STEP 3</span>
                  <h3 className="text-2xl font-bold text-white mb-4">Get Local Currency</h3>
                  <p className="text-slate-300 leading-relaxed">Send Bitcoin to your address, deposit as collateral, and receive KES, USD, EUR directly to your mobile money account</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
          
          {/* Timeline indicator */}
          <motion.div 
            className="mt-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 backdrop-blur-sm rounded-full border border-slate-700/50">
              <Hourglass className="h-5 w-5 text-blue-500 animate-pulse" />
              <span className="text-slate-300">Powered by ICP's sub-second finality</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
