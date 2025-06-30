'use client';

import { useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, useInView } from "framer-motion";
import { useFadeInAnimation, useStaggerAnimation } from "@/lib/gsap-utils";
import { useGSAPContext } from "@/lib/gsap-cleanup";
import gsap from "gsap";
import { 
  ArrowRight, 
  BarChart4, 
  LineChart, 
  Link, 
  ShieldCheck,
  Activity
} from "lucide-react";

export function PriceOracleSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useFadeInAnimation(true, 0.2);
  const subtitleRef = useFadeInAnimation(true, 0.3);
  const chartRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: false, margin: "-100px" });
  
  // Animate price chart
  useEffect(() => {
    if (!chartRef.current || !isInView) return;
    
    const chartBars = chartRef.current.querySelectorAll('.chart-bar');
    const chartLine = chartRef.current.querySelector('.chart-line');
    const pricePoints = chartRef.current.querySelectorAll('.price-point');
    
    // Animate bars
    gsap.fromTo(chartBars, 
      { scaleY: 0, opacity: 0 },
      { 
        scaleY: 1, 
        opacity: 1, 
        duration: 0.6, 
        stagger: 0.05,
        ease: "power2.out"
      }
    );
    
    // Animate line
    if (chartLine) {
      gsap.fromTo(chartLine, 
        { strokeDashoffset: 1000 },
        { 
          strokeDashoffset: 0, 
          duration: 1.5,
          delay: 0.3,
          ease: "power2.inOut"
        }
      );
    }
    
    // Animate price points
    gsap.fromTo(pricePoints, 
      { scale: 0, opacity: 0 },
      { 
        scale: 1, 
        opacity: 1, 
        duration: 0.4, 
        stagger: 0.1,
        delay: 0.8,
        ease: "back.out(2)"
      }
    );
    
    // Live price ticker animation
    const priceTickers = document.querySelectorAll('.price-ticker');
    priceTickers.forEach(ticker => {
      gsap.to(ticker, {
        backgroundPosition: '100% 0',
        duration: 20,
        repeat: -1,
        ease: "none"
      });
      
      // Random price fluctuation
      const priceElement = ticker.querySelector('.price-value');
      if (priceElement) {
        setInterval(() => {
          const basePrice = parseFloat(priceElement.getAttribute('data-base-price') || "0");
          const randomFluctuation = (Math.random() - 0.5) * 200;
          const newPrice = basePrice + randomFluctuation;
          
          gsap.to(priceElement, {
            innerText: newPrice.toFixed(2),
            duration: 0.5,
            snap: { innerText: 1 }
          });
          
          if (newPrice > basePrice) {
            priceElement.classList.remove('text-red-400');
            priceElement.classList.add('text-green-400');
          } else {
            priceElement.classList.remove('text-green-400');
            priceElement.classList.add('text-red-400');
          }
        }, 2000);
      }
    });
  }, [isInView]);

  return (
    <section 
      ref={sectionRef}
      id="price-oracles" 
      className="relative py-32 overflow-hidden bg-gradient-to-br from-slate-900 via-green-900/5 to-slate-900"
    >
      {/* Background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-500/5 via-transparent to-transparent opacity-60"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.h2 
            ref={titleRef as React.RefObject<HTMLHeadingElement>}
            className="text-5xl md:text-6xl font-bold mb-6"
          >
            <span className="text-gradient bg-gradient-to-r from-green-400 to-teal-300 bg-clip-text text-transparent">
              Real-Time Price Feeds
            </span>
          </motion.h2>
          
          <motion.p 
            ref={subtitleRef as React.RefObject<HTMLParagraphElement>}
            className="text-lg md:text-xl text-slate-300"
          >
            BitPesa delivers accurate, Chainlink-powered price data for secure and reliable crypto financial services
          </motion.p>
        </div>
        
        {/* Animated price chart */}
        <Card className="max-w-5xl mx-auto mb-16 bg-gradient-to-br from-slate-800/80 to-slate-900/70 backdrop-blur-md border-slate-700/30 overflow-hidden rounded-2xl shadow-xl">
          <CardContent className="p-6">
            {/* Live price ticker */}
            <div className="price-ticker bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-[length:200%_100%] rounded-lg p-4 mb-6 overflow-hidden">
              <div className="flex flex-wrap justify-between gap-y-3">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center mr-2">
                      <span className="font-bold text-white">₿</span>
                    </div>
                    <div>
                      <div className="text-white font-medium">BTC/USD</div>
                      <div className="price-value text-green-400 font-semibold" data-base-price="42000">42,130.45</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center mr-2">
                      <span className="font-bold text-white">Ξ</span>
                    </div>
                    <div>
                      <div className="text-white font-medium">ETH/USD</div>
                      <div className="price-value text-green-400 font-semibold" data-base-price="2200">2,264.32</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Activity className="h-5 w-5 text-green-400 mr-2" />
                  <span className="text-slate-300 text-sm">Live updates powered by Chainlink</span>
                </div>
              </div>
            </div>
            
            {/* Chart visualization */}
            <div 
              ref={chartRef}
              className="h-64 w-full relative pt-5 pb-2"
            >
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between">
                <div className="text-xs text-slate-400">$45K</div>
                <div className="text-xs text-slate-400">$40K</div>
                <div className="text-xs text-slate-400">$35K</div>
              </div>
              
              {/* Chart area */}
              <div className="ml-12 h-full relative">
                {/* Horizontal guide lines */}
                <div className="absolute w-full h-full flex flex-col justify-between">
                  <div className="border-t border-slate-700/30 h-0"></div>
                  <div className="border-t border-slate-700/30 h-0"></div>
                  <div className="border-t border-slate-700/30 h-0"></div>
                </div>
                
                {/* Chart bars - will be animated */}
                <div className="absolute bottom-0 w-full flex justify-between items-end h-[calc(100%-16px)]">
                  {[65, 75, 60, 80, 70, 85, 75, 90, 80, 95, 85, 75].map((height, index) => (
                    <div 
                      key={index}
                      className="chart-bar bg-gradient-to-t from-green-500/40 to-green-500/10 rounded-sm w-[6%]"
                      style={{ 
                        height: `${height}%`,
                        transformOrigin: 'bottom',
                      }}
                    ></div>
                  ))}
                </div>
                
                {/* Line chart overlay - will be animated */}
                <svg className="absolute bottom-0 left-0 w-full h-[calc(100%-16px)]" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path 
                    className="chart-line stroke-green-500 stroke-2 fill-none" 
                    d="M0,35 10,25 20,40 30,20 40,30 50,15 60,25 70,10 80,20 90,5 100,15" 
                    strokeDasharray="1000"
                    strokeDashoffset="1000"
                  />
                  
                  {/* Price points */}
                  <circle className="price-point fill-green-500 stroke-white stroke-2" cx="0" cy="35" r="2" />
                  <circle className="price-point fill-green-500 stroke-white stroke-2" cx="10" cy="25" r="2" />
                  <circle className="price-point fill-green-500 stroke-white stroke-2" cx="20" cy="40" r="2" />
                  <circle className="price-point fill-green-500 stroke-white stroke-2" cx="30" cy="20" r="2" />
                  <circle className="price-point fill-green-500 stroke-white stroke-2" cx="40" cy="30" r="2" />
                  <circle className="price-point fill-green-500 stroke-white stroke-2" cx="50" cy="15" r="2" />
                  <circle className="price-point fill-green-500 stroke-white stroke-2" cx="60" cy="25" r="2" />
                  <circle className="price-point fill-green-500 stroke-white stroke-2" cx="70" cy="10" r="2" />
                  <circle className="price-point fill-green-500 stroke-white stroke-2" cx="80" cy="20" r="2" />
                  <circle className="price-point fill-green-500 stroke-white stroke-2" cx="90" cy="5" r="2" />
                  <circle className="price-point fill-green-500 stroke-white stroke-2" cx="100" cy="15" r="2" />
                </svg>
                
                {/* X-axis time labels */}
                <div className="absolute bottom-[-20px] w-full flex justify-between">
                  {['12AM', '4AM', '8AM', '12PM', '4PM', '8PM'].map((label, index) => (
                    <div key={index} className="text-xs text-slate-400" style={{width: '16%', textAlign: 'center'}}>{label}</div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
          {[
            {
              title: "Chainlink Integration",
              description: "Enterprise-grade price data from Chainlink's decentralized oracle networks",
              icon: <Link className="h-8 w-8 text-blue-400" />,
              delay: 0
            },
            {
              title: "Real-Time Updates",
              description: "Continuous data flow ensures accurate pricing for all operations",
              icon: <LineChart className="h-8 w-8 text-green-400" />,
              delay: 0.2
            },
            {
              title: "Tamper-Proof Security",
              description: "Decentralized verification prevents manipulation of price data",
              icon: <ShieldCheck className="h-8 w-8 text-amber-400" />,
              delay: 0.4
            }
          ].map((feature, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.7, delay: feature.delay }}
              className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/30 p-6"
            >
              <div className="rounded-full bg-slate-700/50 p-3 w-fit mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-300">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
        
        {/* CTA */}
        <div className="text-center">
          <Button
            size="lg"
            className="bg-gradient-to-r from-green-600 to-teal-500 hover:from-green-700 hover:to-teal-600 text-white px-8 py-6 text-lg rounded-xl transition-all duration-300 transform hover:scale-105"
          >
            View Price Dashboard <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          
          <div className="mt-6 flex items-center justify-center">
            <BarChart4 className="h-5 w-5 text-slate-400 mr-2" />
            <p className="text-slate-400">Supporting Bitcoin, Ethereum, and other major crypto assets</p>
          </div>
        </div>
      </div>
    </section>
  )
}
