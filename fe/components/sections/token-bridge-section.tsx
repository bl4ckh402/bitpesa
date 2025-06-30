'use client';

import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, useInView } from "framer-motion";
import { useFadeInAnimation, useStaggerAnimation } from "@/lib/gsap-utils";
import gsap from "gsap";
import { 
  ArrowRight, 
  ArrowLeftRight, 
  Zap, 
  Shield, 
  Coins,
  BarChart3
} from "lucide-react";

export function TokenBridgeSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useFadeInAnimation(true, 0.2);
  const subtitleRef = useFadeInAnimation(true, 0.3);
  const featuresRef = useStaggerAnimation('.bridge-feature', true, 0.15);
  const bridgeGraphicRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: false, margin: "-100px" });
  
  // Chain logos
  const chains = [
    { name: "Ethereum", color: "bg-blue-500", short: "ETH" },
    { name: "Bitcoin", color: "bg-orange-500", short: "BTC" },
    { name: "Avalanche", color: "bg-red-500", short: "AVAX" }, 
    { name: "Polygon", color: "bg-purple-500", short: "MATIC" },
    { name: "Binance", color: "bg-yellow-500", short: "BNB" }
  ];
  
  // Animation for the bridge graphic
  useEffect(() => {
    if (!bridgeGraphicRef.current || !isInView) return;
    
    const chainElements = bridgeGraphicRef.current.querySelectorAll('.chain-node');
    const bridgeLines = bridgeGraphicRef.current.querySelectorAll('.bridge-line');
    const tokenElements = bridgeGraphicRef.current.querySelectorAll('.token');
    
    // Track all animations for cleanup
    const animations: gsap.core.Tween[] = [];
    
    // Reveal chains
    animations.push(
      gsap.fromTo(chainElements, 
        { scale: 0.8, opacity: 0 },
        { 
          scale: 1, 
          opacity: 1, 
          duration: 0.5, 
          stagger: 0.1,
          ease: "power2.out"
        }
      )
    );
    
    // Reveal lines
    animations.push(
      gsap.fromTo(bridgeLines, 
        { scaleX: 0, opacity: 0 },
        { 
          scaleX: 1, 
          opacity: 0.7, 
          duration: 0.8, 
          stagger: 0.15,
          ease: "power2.inOut",
          delay: 0.5
        }
      )
    );
    
    // Animate tokens moving across bridges
    tokenElements.forEach((token, i) => {
      animations.push(
        gsap.fromTo(token,
          { 
            x: 0,
            opacity: 0 
          },
          { 
            x: "100%", 
            keyframes: {
              opacity: [0, 1, 1, 0]
            },
            duration: 3, 
            repeat: -1,
            delay: i * 0.6,
            ease: "power1.inOut"
          }
        )
      );
    });
    
    // Clean up all animations when component unmounts or when isInView changes
    return () => {
      animations.forEach(anim => anim.kill());
      gsap.killTweensOf(chainElements);
      gsap.killTweensOf(bridgeLines);
      gsap.killTweensOf(tokenElements);
    };
  }, [isInView]);

  return (
    <section 
      ref={sectionRef}
      id="token-bridge" 
      className="relative py-32 overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900/10 to-slate-900"
    >
      {/* Background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent opacity-60"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.h2 
            ref={titleRef as React.RefObject<HTMLHeadingElement>}
            className="text-5xl md:text-6xl font-bold mb-6"
          >
            <span className="text-gradient bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
              Seamless Cross-Chain Bridge
            </span>
          </motion.h2>
          
          <motion.p 
            ref={subtitleRef as React.RefObject<HTMLParagraphElement>}
            className="text-lg md:text-xl text-slate-300"
          >
            Move your tokens across multiple blockchains with BitPesa's secure, fast, and low-fee bridge solution
          </motion.p>
        </div>
        
        {/* Bridge visualization */}
        <div 
          ref={bridgeGraphicRef}
          className="relative max-w-4xl mx-auto mb-20 h-60 md:h-80"
        >
          {/* Chain nodes and connections */}
          <div className="absolute inset-0 flex justify-around items-center">
            {chains.map((chain, index) => (
              <div key={index} className="flex flex-col items-center relative z-10">
                <div className={`chain-node w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center ${chain.color} shadow-lg shadow-${chain.color.replace('bg-', '')}/30`}>
                  <span className="text-white font-bold text-lg md:text-xl">{chain.short}</span>
                </div>
                <p className="mt-3 text-white font-medium">{chain.name}</p>
                
                {/* Connection lines - only between adjacent chains */}
                {index < chains.length - 1 && (
                  <div className="bridge-line absolute top-1/2 left-full transform -translate-y-1/2 h-1 bg-gradient-to-r from-blue-500 to-indigo-400 opacity-70" style={{width: '100%', transformOrigin: 'left center'}}></div>
                )}
                
                {/* Animated tokens moving across bridges */}
                {index < chains.length - 1 && (
                  <div className="token absolute top-1/2 left-full transform -translate-y-1/2 w-5 h-5 rounded-full bg-white shadow-md" style={{opacity: 0}}></div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Features */}
        <motion.div 
          ref={featuresRef as React.RefObject<HTMLDivElement>}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
        >
          {[
            {
              title: "Lightning Fast",
              description: "Complete bridge operations in minutes, not hours",
              icon: <Zap className="h-8 w-8 text-yellow-500" />,
              gradient: "from-yellow-500/20 to-yellow-500/5"
            },
            {
              title: "Secure & Reliable",
              description: "Chainlink-powered oracles ensure accurate, secure transfers",
              icon: <Shield className="h-8 w-8 text-blue-500" />,
              gradient: "from-blue-500/20 to-blue-500/5"
            },
            {
              title: "Low Fees",
              description: "Minimize costs with our optimized bridge protocols",
              icon: <Coins className="h-8 w-8 text-green-500" />,
              gradient: "from-green-500/20 to-green-500/5"
            }
          ].map((feature, index) => (
            <Card 
              key={index}
              className={`bridge-feature bg-gradient-to-br ${feature.gradient} border-slate-700/30 backdrop-blur-sm rounded-xl overflow-hidden hover:shadow-md transition-all duration-300`}
            >
              <CardContent className="p-6">
                <div className="rounded-full bg-slate-800/70 p-3 w-fit mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-300">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </motion.div>
        
        {/* CTA */}
        <div className="text-center mt-16">
          <Button
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 text-white px-8 py-6 text-lg rounded-xl transition-all duration-300 transform hover:scale-105"
          >
            Bridge Your Tokens <ArrowLeftRight className="ml-2 h-5 w-5" />
          </Button>
          
          <div className="mt-6 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-slate-400 mr-2" />
            <p className="text-slate-400">Live market prices powered by Chainlink oracles</p>
          </div>
        </div>
      </div>
    </section>
  )
}
