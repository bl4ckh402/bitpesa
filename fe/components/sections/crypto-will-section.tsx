'use client';

import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, useInView } from "framer-motion";
import { useFadeInAnimation, useStaggerAnimation, useParallaxEffect } from "@/lib/gsap-utils";
import gsap from "gsap";
import { 
  ShieldCheck, 
  Clock, 
  Users, 
  FileCheck, 
  CheckCircle2, 
  ArrowRight,
  HeartHandshake
} from "lucide-react";

export function CryptoWillSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useFadeInAnimation(true, 0.2);
  const subtitleRef = useFadeInAnimation(true, 0.3);
  const cardsRef = useStaggerAnimation('.will-feature-card', true, 0.15);
  const ctaRef = useFadeInAnimation(true, 0.6);
  const isInView = useInView(sectionRef, { once: false, margin: "-100px" });
  
  // Graphic/illustration reference
  const illustrationRef = useRef<HTMLDivElement>(null);
  
  // Background parallax effect
  const bgParallaxRef = useParallaxEffect(0.1);
  
  // Animation for the illustration
  useEffect(() => {
    if (!illustrationRef.current || !isInView) return;
    
    const elements = illustrationRef.current.querySelectorAll('.animate-in');
    
    const animation = gsap.fromTo(elements, 
      { y: 50, opacity: 0 },
      { 
        y: 0, 
        opacity: 1, 
        duration: 0.8, 
        stagger: 0.2,
        ease: "power3.out",
        delay: 0.4
      }
    );
    
    // Clean up animation when component unmounts or when isInView changes
    return () => {
      animation.kill();
      gsap.killTweensOf(elements);
    };
  }, [isInView]);

  // Features data
  const willFeatures = [
    {
      title: "Multiple Trigger Mechanisms",
      description: "Set your will to activate based on inactivity periods, death certificates, or appointed executors",
      icon: <Clock className="h-6 w-6 text-amber-400" />
    },
    {
      title: "Multiple Beneficiaries",
      description: "Distribute your assets to multiple loved ones with custom percentages and conditions",
      icon: <Users className="h-6 w-6 text-green-400" />
    },
    {
      title: "KYC Integration",
      description: "Enhanced security with Know Your Customer verification for beneficiaries",
      icon: <ShieldCheck className="h-6 w-6 text-blue-400" />
    },
    {
      title: "Death Certificate Upload",
      description: "Secure upload system for official documentation with verification protocols",
      icon: <FileCheck className="h-6 w-6 text-purple-400" />
    }
  ];

  return (
    <section 
      ref={sectionRef}
      id="crypto-will" 
      className="relative py-32 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
    >
      {/* Background elements with parallax effect */}
      <div ref={bgParallaxRef as React.RefObject<HTMLDivElement>} className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-r from-slate-900 via-purple-900/5 to-slate-900 opacity-80"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-center md:items-start md:space-x-16 max-w-6xl mx-auto">
          <div className="md:w-1/2 mb-12 md:mb-0">
            <motion.h2 
              ref={titleRef as React.RefObject<HTMLHeadingElement>}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
            >
              <span className="inline-block mb-2 text-gradient bg-gradient-to-r from-purple-400 to-amber-300 bg-clip-text text-transparent">
                Crypto Wills
              </span>
              <br />
              <span className="text-white">Secure Your Digital Legacy</span>
            </motion.h2>
            
            <motion.p 
              ref={subtitleRef as React.RefObject<HTMLParagraphElement>}
              className="text-lg md:text-xl text-slate-300 mb-8"
            >
              Ensure your digital assets reach the right hands, even when you're no longer here. BitPesa's smart contract wills provide peace of mind with transparent, secure, and flexible asset transfers.
            </motion.p>
            
            <div className="grid grid-cols-1 gap-4 mb-10">
              {willFeatures.map((feature, index) => (
                <div 
                  key={index} 
                  className="will-feature-card flex items-center bg-slate-800/30 backdrop-blur-sm rounded-lg p-4 border border-slate-700/30"
                >
                  <div className="rounded-full bg-slate-700/50 p-2 mr-4">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{feature.title}</h3>
                    <p className="text-sm text-slate-300">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <motion.div 
              ref={ctaRef as React.RefObject<HTMLDivElement>}
              className="relative"
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-700 hover:to-amber-600 text-white px-8 py-6 text-lg rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-glow-purple"
                onClick={() => {}}
              >
                Create Your Crypto Will <ArrowRight className="ml-2 h-5 w-5 animate-pulse-gentle" />
              </Button>
              <div className="absolute -bottom-10 left-0 right-0 text-center text-slate-400 text-sm">
                100% Non-custodial · Smart Contract-Powered
              </div>
            </motion.div>
          </div>
          
          {/* Interactive illustration */}
          <div className="md:w-1/2 flex justify-center items-center">
            <div 
              ref={illustrationRef}
              className="relative w-full max-w-md aspect-square"
            >
              {/* Will document illustration */}
              <Card className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700/40 rounded-xl shadow-2xl overflow-hidden animate-in">
                <CardContent className="p-6 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-xl font-bold text-white">Crypto Will</h4>
                      <p className="text-sm text-slate-400">Smart Contract-based</p>
                    </div>
                    <div className="rounded-full bg-purple-500/20 p-2">
                      <HeartHandshake className="h-6 w-6 text-purple-400" />
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    {/* Will document lines */}
                    <div className="h-2 bg-slate-700/40 rounded-full w-full animate-in"></div>
                    <div className="h-2 bg-slate-700/40 rounded-full w-5/6 animate-in"></div>
                    <div className="h-2 bg-slate-700/40 rounded-full w-4/6 animate-in"></div>
                    
                    <div className="py-2"></div>
                    
                    {/* Beneficiaries section */}
                    <div className="bg-slate-800/50 rounded-lg p-4 animate-in">
                      <div className="text-sm font-medium text-white mb-3">Beneficiaries</div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center mr-2">
                              <span className="text-xs text-green-400">A</span>
                            </div>
                            <span className="text-xs text-slate-300">Alice</span>
                          </div>
                          <span className="text-xs text-slate-400">50%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center mr-2">
                              <span className="text-xs text-blue-400">B</span>
                            </div>
                            <span className="text-xs text-slate-300">Bob</span>
                          </div>
                          <span className="text-xs text-slate-400">50%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="py-1"></div>
                    
                    {/* Trigger conditions section */}
                    <div className="bg-slate-800/50 rounded-lg p-4 animate-in">
                      <div className="text-sm font-medium text-white mb-2">Trigger Conditions</div>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <CheckCircle2 className="h-4 w-4 text-amber-400 mr-2" />
                          <span className="text-xs text-slate-300">180 days inactivity</span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle2 className="h-4 w-4 text-purple-400 mr-2" />
                          <span className="text-xs text-slate-300">Executor confirmation</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-slate-700/40 flex justify-between items-center animate-in">
                    <div className="text-xs text-slate-400">Created: 05/15/2023</div>
                    <div className="h-8 w-20 bg-gradient-to-r from-purple-500 to-amber-400 rounded-full floating-element"></div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Decorative elements */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-purple-500/20 rounded-full blur-xl animate-in floating-element"></div>
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-amber-500/20 rounded-full blur-xl animate-in"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 border-purple-400/30 rounded-full animate-in" style={{animationDelay: '0.8s'}}></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-amber-400/20 rounded-full animate-in" style={{animationDelay: '1s'}}></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
