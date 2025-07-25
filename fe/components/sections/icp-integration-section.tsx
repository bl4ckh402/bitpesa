'use client';

import { useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, useInView } from "framer-motion";
import { useFadeInAnimation, useStaggerAnimation } from "@/lib/gsap-utils";
import { 
  Shield, 
  Zap, 
  Globe, 
  Fingerprint,
  Bitcoin,
  ArrowRight,
  Server,
  Key,
  Database
} from "lucide-react";

export function ICPIntegrationSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useFadeInAnimation(true, 0.2);
  const subtitleRef = useFadeInAnimation(true, 0.3);
  const cardsRef = useStaggerAnimation('.icp-feature-card', true, 0.15);
  const isInView = useInView(sectionRef, { once: false, margin: "-100px" });

  // ICP-specific features
  const icpFeatures = [
    {
      title: "Threshold ECDSA",
      description: "Native Bitcoin transactions signed directly by ICP canisters using threshold cryptography—no bridges or wrapped tokens needed.",
      icon: <Key className="h-8 w-8 text-blue-400" />,
      gradient: "from-blue-500/20 to-cyan-500/5",
      highlight: "text-blue-400"
    },
    {
      title: "Internet Identity Auth",
      description: "Passwordless authentication with biometric security. Your identity is cryptographically secured on-chain.",
      icon: <Fingerprint className="h-8 w-8 text-purple-400" />,
      gradient: "from-purple-500/20 to-pink-500/5",
      highlight: "text-purple-400"
    },
    {
      title: "Canister Smart Contracts",
      description: "WebAssembly-powered smart contracts with 1GB storage capacity and HTTP outcalls for real-world integration.",
      icon: <Server className="h-8 w-8 text-green-400" />,
      gradient: "from-green-500/20 to-emerald-500/5",
      highlight: "text-green-400"
    },
    {
      title: "Chain-Key Cryptography",
      description: "Revolutionary consensus mechanism enabling direct multi-chain integrations without relying on bridges.",
      icon: <Database className="h-8 w-8 text-orange-400" />,
      gradient: "from-orange-500/20 to-amber-500/5",
      highlight: "text-orange-400"
    }
  ];

  const icpAdvantages = [
    { text: "Sub-second finality", icon: <Zap className="h-4 w-4" /> },
    { text: "Reverse gas model", icon: <Shield className="h-4 w-4" /> },
    { text: "Native Bitcoin integration", icon: <Bitcoin className="h-4 w-4" /> },
    { text: "No seed phrases required", icon: <Globe className="h-4 w-4" /> }
  ];

  return (
    <section 
      ref={sectionRef}
      className="relative py-32 overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800/40 to-slate-900"
    >
      {/* Background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <motion.h2 
            ref={titleRef as React.RefObject<HTMLHeadingElement>}
            className="text-5xl md:text-6xl font-bold mb-6"
          >
            <span className="text-gradient bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Powered by the <span className="text-blue-500">Internet Computer</span>
            </span>
          </motion.h2>
          
          <motion.p 
            ref={subtitleRef as React.RefObject<HTMLParagraphElement>}
            className="text-lg md:text-xl text-slate-300 mb-8"
          >
            BitPesa leverages ICP's revolutionary capabilities to create the first truly decentralized Bitcoin lending platform
          </motion.p>

          {/* ICP advantages list */}
          <motion.div 
            className="flex flex-wrap justify-center gap-6 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {icpAdvantages.map((advantage, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800/30 backdrop-blur-sm rounded-full border border-slate-700/40"
              >
                <span className="text-blue-400">{advantage.icon}</span>
                <span className="text-slate-300 text-sm">{advantage.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
        
        {/* ICP Features Grid */}
        <motion.div 
          ref={cardsRef as React.RefObject<HTMLDivElement>}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-16"
        >
          {icpFeatures.map((feature, index) => (
            <Card 
              key={index}
              className={`icp-feature-card bg-gradient-to-br ${feature.gradient} border-slate-700/30 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2`}
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
                
                <p className="text-slate-300 text-lg leading-relaxed">
                  {feature.description}
                </p>
                
                <div className="mt-6 flex items-center">
                  <div className={`h-1 w-16 ${feature.highlight.replace('text', 'bg')} rounded-full`}></div>
                  <ArrowRight className={`h-5 w-5 ${feature.highlight} ml-2`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div 
          className="text-center max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/60 border-blue-500/20 backdrop-blur-sm rounded-3xl shadow-2xl">
            <CardContent className="p-10">
              <h3 className="text-3xl font-bold text-white mb-4">
                Experience the Future of DeFi
              </h3>
              <p className="text-slate-300 text-lg mb-8">
                Join the first generation of users accessing KES, USD, EUR directly from Bitcoin collateral on ICP
              </p>
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-6 text-lg rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                Start Lending on ICP
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
