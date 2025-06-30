'use client';

import { useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion, useInView } from "framer-motion";
import { useFadeInAnimation, useCounterAnimation } from "@/lib/gsap-utils";
import { BarChart, DollarSign, TrendingDown, CheckCircle2, FileCheck, Clock, BarChart3 } from "lucide-react";

export function RatesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useFadeInAnimation(true, 0.2);
  const cardRef = useFadeInAnimation(true, 0.4);
  const isInView = useInView(sectionRef, { once: false, margin: "-100px" });
  
  // Animated counters
  const apy = useCounterAnimation(1, isInView, 2, "", "%");
  const ltv = useCounterAnimation(70, isInView, 2, "", "%");
  const fee = useCounterAnimation(0, isInView, 1, "", "%");

  return (
    <section 
      ref={sectionRef}
      id="rates" 
      className="relative py-32 overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900"
    >
      {/* Background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent opacity-60"></div>
        <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-500/10 via-transparent to-transparent opacity-60"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.h2 
          ref={titleRef as React.RefObject<HTMLHeadingElement>}
          className="text-5xl md:text-6xl font-bold text-center mb-20"
        >
          <span className="text-gradient bg-gradient-to-r from-amber-100 via-amber-200 to-amber-100 bg-clip-text text-transparent">
            Competitive Rates
          </span>
        </motion.h2>
        
        <motion.div 
          ref={cardRef as React.RefObject<HTMLDivElement>}
          className="max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 100 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 100 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <Card className="bg-gradient-to-br from-slate-800/90 to-slate-900/70 border-slate-700/50 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-green-500 to-blue-500"></div>
            <CardContent className="p-12">
              <div className="grid md:grid-cols-3 gap-12 text-center">
                <motion.div
                  whileHover={{ y: -10, scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  className="bg-orange-500/10 backdrop-blur-sm p-8 rounded-2xl border border-orange-500/20"
                >
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="absolute -inset-3 bg-orange-500/20 rounded-full blur-lg"></div>
                      <BarChart className="h-12 w-12 text-orange-400 relative z-10" />
                    </div>
                  </div>
                  <div ref={apy as React.RefObject<HTMLDivElement>} className="text-6xl font-bold text-orange-500 mb-4">
                    1%
                  </div>
                  <div className="text-slate-300 text-xl">Starting APY</div>
                  <p className="text-slate-400 mt-4 text-sm">Competitive interest rates starting at just 1% annually</p>
                </motion.div>
                
                <motion.div
                  whileHover={{ y: -10, scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  className="bg-green-500/10 backdrop-blur-sm p-8 rounded-2xl border border-green-500/20"
                >
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="absolute -inset-3 bg-green-500/20 rounded-full blur-lg"></div>
                      <BarChart3 className="h-12 w-12 text-green-400 relative z-10" />
                    </div>
                  </div>
                  <div ref={ltv as React.RefObject<HTMLDivElement>} className="text-6xl font-bold text-green-500 mb-4">
                    70%
                  </div>
                  <div className="text-slate-300 text-xl">Max LTV</div>
                  <p className="text-slate-400 mt-4 text-sm">Borrow up to 70% of your BTC's value in fiat currency</p>
                </motion.div>
                
                <motion.div
                  whileHover={{ y: -10, scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  className="bg-blue-500/10 backdrop-blur-sm p-8 rounded-2xl border border-blue-500/20"
                >
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="absolute -inset-3 bg-blue-500/20 rounded-full blur-lg"></div>
                      <DollarSign className="h-12 w-12 text-blue-400 relative z-10" />
                    </div>
                  </div>
                  <div ref={fee as React.RefObject<HTMLDivElement>} className="text-6xl font-bold text-blue-500 mb-4">
                    0%
                  </div>
                  <div className="text-slate-300 text-xl">Origination Fee</div>
                  <p className="text-slate-400 mt-4 text-sm">No hidden costs or origination fees on any loan</p>
                </motion.div>
              </div>
              
              {/* Additional benefits */}
              <div className="mt-16 grid md:grid-cols-3 gap-6 text-center">
                <div className="flex flex-col items-center">
                  <TrendingDown className="h-6 w-6 text-orange-400 mb-2" />
                  <p className="text-slate-300">Competitive rates</p>
                </div>
                <div className="flex flex-col items-center">
                  <CheckCircle2 className="h-6 w-6 text-green-400 mb-2" />
                  <p className="text-slate-300">No credit checks</p>
                </div>
                <div className="flex flex-col items-center">
                  <Clock className="h-6 w-6 text-blue-400 mb-2" />
                  <p className="text-slate-300">Flexible loan terms</p>
                </div>
              </div>
              
              {/* Call to action */}
              <motion.div 
                className="mt-12 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500/20 to-amber-500/10 backdrop-blur-sm rounded-full border border-amber-500/30">
                  <FileCheck className="h-5 w-5 text-amber-400" />
                  <span className="text-slate-300">No prepayment penalties - repay anytime</span>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
