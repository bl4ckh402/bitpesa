'use client';

import { useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, DollarSign, Shield, Network, FlaskConical, LightbulbIcon } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useFadeInAnimation, useStaggerAnimation, useParallaxEffect } from "@/lib/gsap-utils";
import gsap from "gsap";

interface LightningNetworkSectionProps {
  onConnectLightningWallet: () => void;
}

export function LightningNetworkSection({ onConnectLightningWallet }: LightningNetworkSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useFadeInAnimation(true, 0.2);
  const subtitleRef = useFadeInAnimation(true, 0.3);
  const cardsRef = useStaggerAnimation('.feature-card', true, 0.15);
  const buttonRef = useFadeInAnimation(true, 0.6);
  const networkGraphicRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: false, margin: "-100px" });
  
  // Background parallax effect
  const bgParallaxRef = useParallaxEffect(0.15);
  
  // Lightning animation
  useEffect(() => {
    if (!networkGraphicRef.current || !isInView) return;
    
    const bolts = networkGraphicRef.current.querySelectorAll('.lightning-bolt');
    const nodes = networkGraphicRef.current.querySelectorAll('.network-node');
    
    gsap.fromTo(nodes, 
      { scale: 0.5, opacity: 0 },
      { 
        scale: 1, 
        opacity: 1, 
        duration: 0.6, 
        stagger: 0.1,
        ease: "power2.out",
        delay: 0.2
      }
    );
    
    gsap.fromTo(bolts,
      { opacity: 0, strokeDashoffset: 100 },
      { 
        opacity: 1, 
        strokeDashoffset: 0, 
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out",
        delay: 0.8
      }
    );
    
    // Continuous pulse animation
    gsap.to(nodes, {
      scale: 1.15,
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      stagger: 0.2,
      ease: "sine.inOut"
    });
    
    // Lightning flash animation
    const flashAnimation = () => {
      bolts.forEach((bolt, index) => {
        gsap.to(bolt, {
          opacity: 0.3,
          duration: 0.05,
          delay: index * 0.1,
          onComplete: () => {
            gsap.to(bolt, {
              opacity: 1,
              duration: 0.1,
            });
          }
        });
      });
    };
    
    const flashInterval = setInterval(flashAnimation, 3000);
    
    return () => {
      clearInterval(flashInterval);
    };
  }, [isInView]);

  return (
    <motion.section 
      ref={sectionRef}
      className="relative py-32 overflow-hidden bg-gradient-to-b from-slate-900 to-slate-800"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      {/* Animated background particles */}
      <div 
        ref={bgParallaxRef as React.RefObject<HTMLDivElement>} 
        className="absolute inset-0 -z-10"
      >
        <div className="absolute top-10 right-20 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="network-grid absolute inset-0 opacity-10"></div>
      </div>
      
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-16">
          <motion.h2 
            ref={titleRef as React.RefObject<HTMLHeadingElement>}
            className="text-5xl md:text-6xl font-bold mb-6"
          >
            <span className="text-gradient bg-gradient-to-r from-yellow-400 via-yellow-300 to-orange-400 bg-clip-text text-transparent">
              Lightning Network
            </span> <span className="text-white">Integration</span>
          </motion.h2>
          
          <motion.p 
            ref={subtitleRef as React.RefObject<HTMLParagraphElement>}
            className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto"
          >
            Experience instant, low-cost Bitcoin transactions with our Lightning Network integration.
          </motion.p>
        </div>
        
        {/* Network Visualization */}
        <div ref={networkGraphicRef} className="relative max-w-4xl mx-auto mb-24 hidden md:block">
          <svg className="w-full h-72" viewBox="0 0 800 200" fill="none">
            {/* Network nodes */}
            <circle className="network-node" cx="120" cy="100" r="15" fill="url(#node-gradient1)" />
            <circle className="network-node" cx="300" cy="60" r="15" fill="url(#node-gradient2)" />
            <circle className="network-node" cx="400" cy="150" r="15" fill="url(#node-gradient3)" />
            <circle className="network-node" cx="550" cy="50" r="15" fill="url(#node-gradient4)" />
            <circle className="network-node" cx="680" cy="120" r="15" fill="url(#node-gradient5)" />
            <circle className="network-node" cx="250" cy="170" r="15" fill="url(#node-gradient1)" />
            <circle className="network-node" cx="480" cy="90" r="15" fill="url(#node-gradient2)" />
            
            {/* Lightning bolts/connections */}
            <path className="lightning-bolt" d="M120 100 L250 170" stroke="url(#bolt-gradient)" strokeWidth="3" strokeDasharray="100" />
            <path className="lightning-bolt" d="M250 170 L400 150" stroke="url(#bolt-gradient)" strokeWidth="3" strokeDasharray="100" />
            <path className="lightning-bolt" d="M300 60 L400 150" stroke="url(#bolt-gradient)" strokeWidth="3" strokeDasharray="100" />
            <path className="lightning-bolt" d="M480 90 L550 50" stroke="url(#bolt-gradient)" strokeWidth="3" strokeDasharray="100" />
            <path className="lightning-bolt" d="M400 150 L480 90" stroke="url(#bolt-gradient)" strokeWidth="3" strokeDasharray="100" />
            <path className="lightning-bolt" d="M480 90 L680 120" stroke="url(#bolt-gradient)" strokeWidth="3" strokeDasharray="100" />
            <path className="lightning-bolt" d="M550 50 L680 120" stroke="url(#bolt-gradient)" strokeWidth="3" strokeDasharray="100" />
            <path className="lightning-bolt" d="M120 100 L300 60" stroke="url(#bolt-gradient)" strokeWidth="3" strokeDasharray="100" />
            
            {/* Gradients */}
            <defs>
              <linearGradient id="bolt-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#facc15" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
              
              <radialGradient id="node-gradient1" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(15 15) rotate(45) scale(30)">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0.6" />
              </radialGradient>
              
              <radialGradient id="node-gradient2" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(15 15) rotate(45) scale(30)">
                <stop offset="0%" stopColor="#facc15" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.6" />
              </radialGradient>
              
              <radialGradient id="node-gradient3" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(15 15) rotate(45) scale(30)">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.6" />
              </radialGradient>
              
              <radialGradient id="node-gradient4" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(15 15) rotate(45) scale(30)">
                <stop offset="0%" stopColor="#facc15" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0.6" />
              </radialGradient>
              
              <radialGradient id="node-gradient5" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(15 15) rotate(45) scale(30)">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#facc15" stopOpacity="0.6" />
              </radialGradient>
            </defs>
          </svg>
        </div>
        
        {/* Feature cards */}
        <div 
          ref={cardsRef as React.RefObject<HTMLDivElement>}
          className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
        >
          <motion.div 
            className="feature-card"
            whileHover={{ y: -10, scale: 1.03 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/90 border-yellow-500/20 hover:border-yellow-500/50 backdrop-blur-md rounded-xl shadow-xl h-full">
              <CardContent className="p-8 text-center">
                <div className="relative mb-6">
                  <div className="absolute -inset-2 bg-yellow-500/20 rounded-full blur-xl opacity-70"></div>
                  <Zap className="h-16 w-16 text-yellow-400 mx-auto relative z-10" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Instant Settlements</h3>
                <p className="text-slate-300 leading-relaxed">Lightning-fast loan disbursements and repayments with confirmation times of seconds, not minutes.</p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div 
            className="feature-card"
            whileHover={{ y: -10, scale: 1.03 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/90 border-green-500/20 hover:border-green-500/50 backdrop-blur-md rounded-xl shadow-xl h-full">
              <CardContent className="p-8 text-center">
                <div className="relative mb-6">
                  <div className="absolute -inset-2 bg-green-500/20 rounded-full blur-xl opacity-70"></div>
                  <DollarSign className="h-16 w-16 text-green-400 mx-auto relative z-10" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Minimal Fees</h3>
                <p className="text-slate-300 leading-relaxed">Reduce transaction costs with Lightning channels, paying just fractions of a cent per transaction.</p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div 
            className="feature-card"
            whileHover={{ y: -10, scale: 1.03 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/90 border-blue-500/20 hover:border-blue-500/50 backdrop-blur-md rounded-xl shadow-xl h-full">
              <CardContent className="p-8 text-center">
                <div className="relative mb-6">
                  <div className="absolute -inset-2 bg-blue-500/20 rounded-full blur-xl opacity-70"></div>
                  <Shield className="h-16 w-16 text-blue-400 mx-auto relative z-10" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Enhanced Privacy</h3>
                <p className="text-slate-300 leading-relaxed">Private payment channels with improved security and privacy features compared to on-chain transactions.</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        <motion.div 
          ref={buttonRef as React.RefObject<HTMLDivElement>}
          className="text-center mt-12"
        >
          <Button 
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 px-8 py-6 text-lg rounded-xl shadow-glow-yellow transform transition-all duration-300 hover:scale-105"
            onClick={onConnectLightningWallet}
          >
            <Zap className="h-5 w-5 mr-3 animate-pulse" />
            Connect Lightning Wallet
          </Button>
          
          <div className="mt-6 flex justify-center gap-6">
            <div className="flex items-center text-sm text-slate-400">
              <FlaskConical className="h-4 w-4 mr-1 text-yellow-500" />
              <span>Low fees</span>
            </div>
            <div className="flex items-center text-sm text-slate-400">
              <Network className="h-4 w-4 mr-1 text-yellow-500" />
              <span>Always online</span>
            </div>
            <div className="flex items-center text-sm text-slate-400">
              <LightbulbIcon className="h-4 w-4 mr-1 text-yellow-500" />
              <span>Energy efficient</span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  )
}
