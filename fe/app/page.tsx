"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { HeroSection } from "@/components/sections/hero-section";
import { FeaturesSection } from "@/components/sections/features-section";
import { HowItWorksSection } from "@/components/sections/how-it-works-section";
import { RatesSection } from "@/components/sections/rates-section";
import { RoadmapSection } from "@/components/sections/roadmap-section";
import { LoanCalculator } from "@/components/loan-calculator";
import { NoiseTexture } from "@/components/noise-texture";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { SplitText } from "gsap/SplitText";
import { Loader2, ArrowRight, Menu, X } from "lucide-react";
import { useGSAPContext, useGSAPCleanup } from "@/lib/gsap-cleanup";
import {ICPIntegrationSection} from "@/components/sections/icp-integration-section";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, SplitText);
}

// Helper hook for scroll progress - moved outside the component
function useScroll() {
  const [scrollYProgress, setScrollYProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop;
      const clientHeight = document.documentElement.clientHeight;
      const scrollProgress = scrollTop / (scrollHeight - clientHeight);

      setScrollYProgress(scrollProgress);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return { scrollYProgress };
}

export default function LandingPage() {
  const [showCalculator, setShowCalculator] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [showMobileNav, setShowMobileNav] = useState(false);

  // Get scroll progress using our custom hook
  const { scrollYProgress } = useScroll();

  // References for animation elements
  const landingPageRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<HTMLDivElement[]>([]);
  const parallaxLayers = useRef<HTMLDivElement[]>([]);

  // Add GSAP Context and cleanup
  const { createContext } = useGSAPContext();
  useGSAPCleanup();

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const { clientX, clientY } = e;
    setCursorPosition({ x: clientX, y: clientY });

    // Animate cursor
    if (cursorRef.current) {
      gsap.to(cursorRef.current, {
        x: clientX,
        y: clientY,
        duration: 0.01,
        ease: "power2.out",
      });
    }

    // Parallax effect for background elements
    parallaxLayers.current.forEach((layer, index) => {
      const depth = index * 100;
      const moveX = (clientX - window.innerWidth / 2) * depth;
      const moveY = (clientY - window.innerHeight / 2) * depth;

      gsap.to(layer, {
        x: moveX,
        y: moveY,
        duration: 0.5,
        ease: "power1.out",
      });
    });
  }, []);

  // Setup cursor tracking
  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [handleMouseMove]);

  // Preloader sequence with GSAP Context
  useEffect(() => {
    if (!loaderRef.current) return;

    const ctx = createContext((self) => {
      const tl = gsap.timeline({
        onComplete: () => {
          setIsLoading(false);
        },
      });

      tl.to(".loader-text-char", {
        opacity: 1,
        y: 0,
        stagger: 0.05,
        ease: "back.out",
        duration: 0.8,
      })
        .to(
          ".loader-spin",
          {
            scale: 1.2,
            duration: 0.5,
            repeat: 1,
            yoyo: true,
            ease: "power2.inOut",
          },
          "<"
        )
        .to(loaderRef.current, {
          opacity: 0,
          duration: 0.5,
          delay: 0.5,
        })
        .to(
          ".loader-overlay",
          {
            height: 0,
            duration: 1.2,
            ease: "power4.inOut",
          },
          "-=0.3"
        );

      return tl;
    }, loaderRef.current);
  }, [createContext]);

  // Main page animation setup
  useEffect(() => {
    if (isLoading || !landingPageRef.current) return;

    // Initialize scroll animations
    const sections = document.querySelectorAll(".section-reveal");
    sections.forEach((section, i) => {
      // Store section refs
      if (section instanceof HTMLDivElement) {
        sectionRefs.current[i] = section;
      }

      // Add scroll reveal animation
      gsap.fromTo(
        section,
        { opacity: 0, y: 100, ease: "power2.in"},
        {
          opacity: 1,
          y: 0,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 85%",
            end: "bottom 70%",
            toggleActions: "play none none reverse",
          },
        }
      );
    });

    // Initialize parallax layers
    const layers = document.querySelectorAll(".parallax-layer");
    parallaxLayers.current = Array.from(layers as NodeListOf<HTMLDivElement>);

    // Horizontal scroll for showcase elements
    const horizontalSections = document.querySelectorAll(".horizontal-scroll");
    horizontalSections.forEach((section) => {
      const items = section.querySelectorAll(".scroll-item");

      gsap.to(items, {
        xPercent: -100 * (items.length - 1),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          pin: true,
          pinSpacing: true,
          scrub: 1,
          end: () => `+=${section.scrollWidth}`,
        },
      });
    });

    // Text reveal animations
    const splitTexts = document.querySelectorAll(".reveal-text");
    splitTexts.forEach((text) => {
      const split = new SplitText(text, { type: "chars,words" });

      gsap.from(split.chars, {
        opacity: 0,
        y: 50,
        rotationX: -90,
        stagger: 0.02,
        duration: 1,
        ease: "power4.out",
        scrollTrigger: {
          trigger: text,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      });
    });

    // Smooth scroll setup
    const navLinks = document.querySelectorAll("a[href^='#']");
    navLinks.forEach((link) => {
      link.addEventListener("click", (e: Event) => {
        e.preventDefault();
        const target = (e.currentTarget as HTMLAnchorElement).getAttribute(
          "href"
        );

        if (target && target !== "#") {
          gsap.to(window, {
            duration: 1.5,
            scrollTo: {
              y: target,
              offsetY: 50,
            },
            ease: "power4.inOut",
          });
        }
      });
    });

    return () => {
      // Cleanup scroll triggers
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [isLoading]);

  return (
    <>
      {/* Custom cursor */}
      <div
        ref={cursorRef}
        className="fixed w-8 h-8 pointer-events-none z-50 mix-blend-difference hidden md:flex"
        style={{
          left: -20,
          top: -20,
          transform: `translate(${cursorPosition.x}px, ${cursorPosition.y}px)`,
        }}
      >
        <div className="w-full h-full rounded-full bg-orange-500 opacity-50 animate-pulse"></div>
        <div className="absolute w-2 h-2 bg-white rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      {/* Page preloader */}
      {isLoading && (
        <div
          ref={loaderRef}
          className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-[100]"
        >
          <div className="loader-overlay absolute inset-0 bg-orange-600 bottom-0 w-full"></div>
          <div className="relative z-10 text-center">
            <div className="relative mb-6">
              <div className="absolute -inset-8 bg-orange-500/30 rounded-full blur-2xl"></div>
              <Loader2 className="h-24 w-24 text-orange-400 animate-spin mx-auto loader-spin" />
            </div>
            <h2 className="text-4xl font-bold text-white mb-4 overflow-hidden">
              {Array.from("BITPESA").map((char, i) => (
                <span
                  key={i}
                  className="inline-block loader-text-char opacity-0 translate-y-8"
                >
                  {char}
                </span>
              ))}
            </h2>
            <p className="text-slate-400 mt-1 overflow-hidden">
              {Array.from("The future of Bitcoin lending").map((char, i) => (
                <span
                  key={i}
                  className="inline-block loader-text-char opacity-0 translate-y-8"
                  style={{ animationDelay: `${0.1 + i * 0.03}s` }}
                >
                  {char === " " ? "\u00A0" : char}
                </span>
              ))}
            </p>
          </div>
        </div>
      )}

      {/* Main content */}
      <AnimatePresence mode="wait">
        {!isLoading && (
          <motion.div
            ref={landingPageRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
            className="relative overflow-hidden"
            data-page="landing"
          >
            {/* Parallax background elements */}
            <div className="fixed inset-0 -z-20">
              <div className="parallax-layer absolute top-0 left-0 w-full h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"></div>
              <div className="parallax-layer absolute top-10 left-10 w-40 h-40 rounded-full bg-orange-500/10 blur-3xl"></div>
              <div className="parallax-layer absolute top-1/4 right-1/4 w-72 h-72 rounded-full bg-blue-600/10 blur-3xl"></div>
              <div className="parallax-layer absolute bottom-1/3 left-1/3 w-60 h-60 rounded-full bg-indigo-500/10 blur-3xl"></div>
              <div className="parallax-layer absolute bottom-10 right-10 w-80 h-80 rounded-full bg-purple-500/5 blur-3xl"></div>
            </div>

            {/* Grid overlay */}
            <div className="fixed inset-0 bg-[url('/grid.svg')] bg-repeat opacity-[0.02] -z-10"></div>
            {/* Noise texture */}
            <NoiseTexture />

            {/* Scroll progress indicator */}
            <motion.div
              className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 z-50 origin-left"
              style={{
                scaleX: scrollYProgress,
              }}
            />

            {/* Hero Section */}
            <div className="section-reveal">
              <HeroSection
                onOpenCalculator={() => setShowCalculator(true)}
                onOpenWalletConnect={() => { }}
              />
            </div>
            {/* Features Overview */}
            <div id="features" className="section-reveal">
              <FeaturesSection />
            </div>

            {/* How It Works */}
            <div id="how-it-works" className="section-reveal">
              <HowItWorksSection />
            </div>

            <div id="rates" className="section-reveal">
              <RatesSection />
            </div>

            {/* ICP Integration Section */}
            <div id="icp-integration" className="section-reveal">
              <ICPIntegrationSection />
            </div>

            {/* Roadmap */}
            <div id="roadmap" className="section-reveal">
              <RoadmapSection />
            </div>

            {/* Modals */}
            {showCalculator && (
              <LoanCalculator onClose={() => setShowCalculator(false)} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
