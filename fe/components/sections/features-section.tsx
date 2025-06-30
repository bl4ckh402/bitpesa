'use client';

import { useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion, useInView } from "framer-motion";
import { useFadeInAnimation, useStaggerAnimation } from "@/lib/gsap-utils";
import gsap from "gsap";
import { 
  Coins, 
  Wallet, 
  FileCheck, 
  BarChart3, 
  ShieldCheck, 
  Sparkles, 
  ScrollText,
  Waypoints
} from "lucide-react";

export function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useFadeInAnimation(true, 0.2);
  const subtitleRef = useFadeInAnimation(true, 0.3);
  const cardsRef = useStaggerAnimation('.feature-card', true, 0.15);
  const isInView = useInView(sectionRef, { once: false, margin: "-100px" });

  // Feature data
  const features = [
    {
      title: "Bitcoin-Backed Lending",
      description: "Use your BTC as collateral to get instant loans in USD, EUR, and other fiat currencies without selling your Bitcoin.",
      icon: <Coins className="h-12 w-12 text-orange-500" />,
      gradient: "from-orange-500/20 to-amber-500/5",
      highlight: "text-orange-400"
    },
    {
      title: "Cross-Chain Token Bridge",
      description: "Seamlessly move your tokens between different blockchains with our secure, low-fee token bridge solution.",
      icon: <Waypoints className="h-12 w-12 text-blue-500" />,
      gradient: "from-blue-500/20 to-indigo-500/5",
      highlight: "text-blue-400"
    },
    {
      title: "Real-Time Price Feeds",
      description: "Access accurate, Chainlink-powered price oracles for secure lending, borrowing, and cross-chain transactions.",
      icon: <BarChart3 className="h-12 w-12 text-green-500" />,
      gradient: "from-green-500/20 to-emerald-500/5",
      highlight: "text-green-400"
    },
    {
      title: "Crypto Wills",
      description: "Secure your digital legacy with smart contract wills that automatically transfer assets to beneficiaries based on configurable conditions.",
      icon: <ScrollText className="h-12 w-12 text-purple-500" />,
      gradient: "from-purple-500/20 to-pink-500/5",
      highlight: "text-purple-400"
    }
  ];

  return (
    <section 
      ref={sectionRef}
      id="features" 
      className="relative py-32 overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-900"
    >
      {/* Background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.h2 
            ref={titleRef as React.RefObject<HTMLHeadingElement>}
            className="text-5xl md:text-6xl font-bold mb-6"
          >
            <span className="text-gradient bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Comprehensive <span className="text-orange-500">Crypto</span> Solutions
            </span>
          </motion.h2>
          
          <motion.p 
            ref={subtitleRef as React.RefObject<HTMLParagraphElement>}
            className="text-lg md:text-xl text-slate-300"
          >
            BitPesa offers a complete suite of blockchain-powered financial services to help you maximize the potential of your digital assets
          </motion.p>
        </div>
        
        <motion.div 
          ref={cardsRef as React.RefObject<HTMLDivElement>}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto"
        >
          {features.map((feature, index) => (
            <Card 
              key={index}
              className={`feature-card bg-gradient-to-br ${feature.gradient} border-slate-700/30 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2`}
            >
              <CardContent className="p-8">
                <div className="mb-6 flex items-center">
                  <div className="rounded-xl bg-slate-800/50 p-3 mr-4 backdrop-blur-sm border border-slate-700/30">
                    {feature.icon}
                  </div>
                  <h3 className={`text-2xl font-bold ${feature.highlight}`}>
                    {feature.title}
                  </h3>
                </div>
                
                <p className="text-slate-300 text-lg">
                  {feature.description}
                </p>
                
                <div className="mt-6 flex items-center">
                  <div className={`h-1 w-16 ${feature.highlight.replace('text', 'bg')} rounded-full`}></div>
                  <Sparkles className={`h-5 w-5 ${feature.highlight} ml-2`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
        
        {/* Additional benefits banner */}
        <div className="mt-16 text-center max-w-4xl mx-auto">
          <div className="py-6 px-8 bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700/40">
            <h4 className="text-xl font-semibold text-white mb-4">
              All BitPesa services feature:
            </h4>
            <div className="flex flex-wrap justify-center gap-6 text-slate-200">
              <div className="flex items-center">
                <ShieldCheck className="h-5 w-5 text-green-400 mr-2" /> 100% Non-custodial
              </div>
              <div className="flex items-center">
                <FileCheck className="h-5 w-5 text-blue-400 mr-2" /> Smart contract security
              </div>
              <div className="flex items-center">
                <Wallet className="h-5 w-5 text-orange-400 mr-2" /> Full asset ownership
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
