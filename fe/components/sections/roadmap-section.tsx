"use client";

import * as React from "react";
import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RoadmapCube } from "../../components/roadmap-cube";

export function RoadmapSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Timeline phases data
  const phases = [
    {
      id: "phase1",
      title: "Phase 1: MVP Development",
      date: "Q2 2023",
      description:
        "Hackathon launch with core lending functionality, smart contracts, and basic UI",
      milestones: [
        "Smart contract development for BTC lending pool",
        "Integration with price oracles",
        "Basic frontend interface development",
        "Security audits and testing",
      ],
    },
    {
      id: "phase2",
      title: "Phase 2: Platform Enhancement",
      date: "Q3-Q4 2023",
      description: "Expanded functionality and improved user experience",
      milestones: [
        "Implementation of token bridge for cross-chain assets",
        "Improved liquidation mechanisms",
        "Enhanced dashboard with analytics",
        "Mobile responsiveness optimization",
      ],
    },
    {
      id: "phase3",
      title: "Phase 3: Crypto Wills Launch",
      date: "Q1 2024",
      description:
        "Revolutionary crypto inheritance features to secure digital assets",
      milestones: [
        "Smart contract development for will execution",
        "Time-lock and inheritance verification systems",
        "Multi-signature authorization protocols",
        "Beneficiary management interface",
      ],
    },
    {
      id: "phase4",
      title: "Phase 4: Global Expansion",
      date: "Q2-Q3 2024",
      description: "Scaling the platform to reach global markets",
      milestones: [
        "Multi-language support",
        "Regional compliance adaptations",
        "Lightning Network integration",
        "Strategic partnerships and integrations",
      ],
    },
    {
      id: "phase5",
      title: "Phase 5: Advanced Trust Fund Features",
      date: "Q4 2024",
      description:
        "Sophisticated financial planning and asset protection tools",
      milestones: [
        "Programmable trust funds with conditional releases",
        "Educational fund management",
        "Charitable giving options",
        "Advanced inheritance planning tools",
      ],
    },
  ];

  // Simple intersection observer to trigger animations once
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      {
        threshold: 0.2,
        rootMargin: "-10% 0px -10% 0px"
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, [isVisible]);

  return (
    <section
      id="roadmap"
      ref={sectionRef}
      className="py-24 relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950"
    >
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-orange-500/5 rounded-full blur-[100px] -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-1/4 w-1/2 h-1/2 bg-blue-500/5 rounded-full blur-[100px] translate-y-1/4"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="mb-10 relative">
            <RoadmapCube />
          </div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-3xl md:text-5xl font-bold mb-6 text-white"
          >
            Our Roadmap to Success
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl text-slate-400 max-w-3xl mx-auto"
          >
            Follow our ambitious journey as we revolutionize Bitcoin lending and
            crypto asset management
          </motion.p>
        </div>
        
        {/* Timeline container */}
        <div className="relative mt-20 pb-10">
          {/* Main timeline line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={isVisible ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 1.5, delay: 0.6, ease: "easeInOut" }}
            className="absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-orange-600 via-amber-400 to-orange-600 origin-left"
          />

          {/* Timeline phases */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6 relative z-10">
            {phases.map((phase, i) => (
              <motion.div
                key={phase.id}
                initial={{ opacity: 0, y: 30 }}
                animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ 
                  duration: 0.8, 
                  delay: 0.8 + (i * 0.2),
                  ease: "easeOut"
                }}
                className={`
                  bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 
                  shadow-lg relative
                  ${i % 2 === 0 ? "mt-16 md:mt-0" : "mt-16"}
                `}
                style={{
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)"
                }}
              >
                {/* Phase dot on the timeline */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-10 md:-translate-y-[86px] flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full border-4 border-orange-600 bg-slate-900 shadow-lg shadow-orange-500/30"></div>
                  <div className="h-10 w-1 bg-gradient-to-b from-orange-600 to-transparent hidden md:block"></div>
                </div>

                {/* Phase content */}
                <div className="text-center md:text-left">
                  <span className="inline-block px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-sm font-medium mb-3">
                    {phase.date}
                  </span>
                  <h3 className="text-xl font-bold text-white mb-3">
                    {phase.title}
                  </h3>
                  <p className="text-slate-300 mb-4">{phase.description}</p>

                  <ul className="space-y-2 text-sm text-slate-400 mt-4">
                    {phase.milestones.map((milestone, j) => (
                      <li key={j} className="flex items-start">
                        <div className="flex-shrink-0 h-1.5 w-1.5 rounded-full bg-orange-500 mt-1.5 mr-2"></div>
                        <span>{milestone}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        {/* CTA section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-16 text-center bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/30 max-w-3xl mx-auto"
        >
          <h3 className="text-2xl font-bold text-white mb-4">
            Join Our Journey
          </h3>
          <p className="text-slate-300 mb-6">
            We're constantly evolving and improving BitPesa. Stay informed about
            our latest developments and be the first to know when new features
            are released.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#"
              className="px-6 py-3 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium transition-colors"
            >
              Join Community
            </a>
            <a
              href="https://github.com/yourusername/bitpesa"
              className="px-6 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors flex items-center justify-center"
            >
              <svg
                className="h-5 w-5 mr-2"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
              GitHub
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}