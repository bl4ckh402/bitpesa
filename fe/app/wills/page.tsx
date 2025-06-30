"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useWeb3 } from "@/lib/providers/web3-provider";
import { useUserWills, useWillDetails } from "@/lib/hooks/useWill";
import { formatDistanceToNow } from "date-fns";
import {
  motion,
  AnimatePresence,
  MotionValue,
  useMotionValue,
  useTransform,
} from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TextPlugin } from "gsap/TextPlugin";
import { NoiseTexture } from "@/components/noise-texture";
import { ShimmerEffect } from "@/components/ui/shimmer-effect";
import { GradientBorderCard } from "@/components/ui/gradient-border-card";
import { ParallaxCard } from "@/components/ui/parallax-card";
import { FloatingElements } from "@/components/ui/floating-elements";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { WillCard } from "@/components/wills/will-card";
import { useGSAPContext, useGSAPCleanup, useMultiGSAPContexts } from "@/lib/gsap-cleanup";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, TextPlugin);
}

export default function WillsPage() {
  const router = useRouter();
  const { isConnected, isCorrectNetwork, switchToFujiNetwork } = useWeb3();
  const { willIds, isLoading: isLoadingWills } = useUserWills();
  const [selectedWillId, setSelectedWillId] = useState<number | undefined>(
    undefined
  );
  const { will, isLoading: isLoadingWillDetails } =
    useWillDetails(selectedWillId);

  // Refs for animations
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const willListRef = useRef<HTMLDivElement>(null);
  const willDetailRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  // Loading animation states
  const [loadingAnimation, setLoadingAnimation] =
    useState<gsap.core.Timeline | null>(null);
  const mousePosition = useMotionValue({ x: 0, y: 0 });
  
  // Use GSAP Context for better cleanup
  const { createContext } = useGSAPContext();
  
  // Add a global cleanup for all animations when component unmounts
  useGSAPCleanup();

  // Handle mouse movement for hover effects
  const handleMouseMove = (e: React.MouseEvent) => {
    mousePosition.set({ x: e.clientX, y: e.clientY });
  };

  // Initialize animations with GSAP Context for proper cleanup
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Create a GSAP context for this component
    const ctx = createContext((self) => {
      // Enhanced page entrance animation
      const tl = gsap.timeline();

      if (pageContainerRef.current) {
        tl.from(pageContainerRef.current, {
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
        });
      }

      if (headerRef.current) {
        tl.from(
          headerRef.current.querySelectorAll("h1"),
          {
            y: -50,
            opacity: 0,
            duration: 0.8,
            ease: "back.out(1.7)",
          },
          "-=0.4"
        );

        tl.from(
          headerRef.current.querySelectorAll("p"),
          {
            opacity: 0,
            duration: 0.6,
            ease: "power2.out",
          },
          "-=0.6"
        );

        tl.from(
          headerRef.current.querySelectorAll("button"),
          {
            scale: 0.8,
            opacity: 0,
            duration: 0.6,
            ease: "back.out(1.7)",
          },
          "-=0.4"
        );
      }

      // Setup scroll animations with enhanced effects
      if (willListRef.current) {
        ScrollTrigger.batch(".will-item", {
          start: "top bottom-=50",
          onEnter: (batch) =>
            gsap.to(batch, {
              opacity: 1,
              y: 0,
              stagger: 0.1,
              duration: 0.6,
              ease: "power3.out",
            }),
          once: true,
        });
      }
      
      // Return the timeline for potential future reference
      return tl;
    }, pageContainerRef.current || undefined); // Scope to the page container or use undefined if null
    
    // No need for explicit cleanup as useGSAPContext handles it
  }, [createContext]);

  // Loading animation with enhanced effects
  useEffect(() => {
    if (!isLoadingWills && !isLoadingWillDetails) {
      if (loadingAnimation) {
        loadingAnimation.progress(1);
      }
      return;
    }

    if (loadingRef.current) {
      // Create a GSAP context for the loading animation
      const loadingCtx = createContext((self) => {
        const loadingTl = gsap.timeline({ repeat: -1 });

        loadingTl.to(".loading-pulse", {
          scale: 1.3,
          opacity: 1,
          duration: 0.8,
          ease: "sine.inOut",
          stagger: 0.2,
        });

        loadingTl.to(".loading-pulse", {
          scale: 0.8,
          opacity: 0.5,
          duration: 0.8,
          ease: "sine.inOut",
          stagger: 0.2,
        });

        setLoadingAnimation(loadingTl);
        
        return loadingTl;
      }, loadingRef.current);
      
      // No need for explicit cleanup as useGSAPContext handles it
    }
  }, [isLoadingWills, isLoadingWillDetails, createContext]);

  // Animation when selecting a will with smooth transitions
  useEffect(() => {
    if (selectedWillId && willDetailRef.current) {
      const ctx = createContext((self) => {
        return gsap.fromTo(
          willDetailRef.current,
          { opacity: 0.7, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
        );
      }, willDetailRef.current);
      
      // No need for explicit cleanup as useGSAPContext handles it
    }
  }, [selectedWillId, createContext]);

  // Select the first will by default when will IDs are loaded
  useEffect(() => {
    if (willIds && willIds.length > 0 && !selectedWillId) {
      setSelectedWillId(Number(willIds[0]));
    }
  }, [willIds, selectedWillId]);

  const formatInactivityPeriod = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    return `${days} day${days !== 1 ? "s" : ""}`;
  };

  if (!isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="container mx-auto max-w-7xl py-12"
      >
        <ParallaxCard className="overflow-hidden">
          <Card className="border-2 border-red-300 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardContent className="py-16">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Alert
                  variant="destructive"
                  className="animate-pulse bg-red-50"
                >
                  <AlertTitle className="text-2xl font-bold">
                    Connection Required
                  </AlertTitle>
                  <AlertDescription className="text-lg mt-3">
                    Please connect your wallet to access your crypto wills and
                    manage your digital assets.
                  </AlertDescription>
                </Alert>
              </motion.div>
              <div className="mt-8 flex justify-center">
                <FloatingElements />
                <NoiseTexture opacity={0.05} />
              </div>
            </CardContent>
          </Card>
        </ParallaxCard>
      </motion.div>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="container mx-auto max-w-7xl py-12"
      >
        <ParallaxCard className="overflow-hidden">
          <Card className="border-2 border-amber-300 shadow-xl overflow-hidden bg-white/90 backdrop-blur-sm">
            <CardContent className="py-16">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Alert
                  variant="destructive"
                  className="bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200"
                >
                  <AlertTitle className="text-2xl font-bold text-amber-800">
                    Wrong Network
                  </AlertTitle>
                  <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-3 gap-4">
                    <span className="text-lg text-amber-700">
                      Please switch to Avalanche Fuji Testnet to use BitPesa.
                    </span>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={switchToFujiNetwork}
                        className="bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-600 hover:to-red-600 text-white shadow-md"
                        size="lg"
                      >
                        Switch Network
                      </Button>
                    </motion.div>
                  </AlertDescription>
                </Alert>
              </motion.div>
              <div className="mt-8 flex justify-center">
                <FloatingElements />
                <NoiseTexture opacity={0.05} />
              </div>
            </CardContent>
          </Card>
        </ParallaxCard>
      </motion.div>
    );
  }

  // Enhanced loading state with shimmer effect
  const LoadingState = () => (
    <div className="py-12" ref={loadingRef}>
      <ShimmerEffect className="mb-8">
        <div className="h-16 w-72 bg-gray-200 rounded-xl mx-auto"></div>
      </ShimmerEffect>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
        <ShimmerEffect>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </ShimmerEffect>
        <ShimmerEffect>
          <div className="h-64 bg-gray-200 rounded-xl md:block hidden"></div>
        </ShimmerEffect>
        <ShimmerEffect>
          <div className="h-64 bg-gray-200 rounded-xl lg:block hidden"></div>
        </ShimmerEffect>
      </div>

      <div className="mt-12 text-center">
        <p className="text-xl font-medium text-gray-500">
          Loading your wills...
        </p>
        <div className="mt-4 flex justify-center items-center space-x-3">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="loading-pulse w-3 h-3 bg-blue-500 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div
      ref={pageContainerRef}
      className="container mx-auto max-w-7xl py-10 relative min-h-screen"
      onMouseMove={handleMouseMove}
    >
      {/* Animated page header with 3D effect */}
      <div ref={headerRef} className="relative mb-12 z-10">
        <ScrollReveal>
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 py-6">
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
            >
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-[#f7931a] via-[#fbbf24] to-[#ff6b35] bg-clip-text text-transparent pb-2">
                Your Crypto Wills
              </h1>
              <p className="text-gray-500 mt-2 max-w-xl">
                Secure your digital legacy with BitPesa's smart contract wills.
                Ensure your crypto assets reach your loved ones.
              </p>
            </motion.div>

            <ParallaxCard
              className="overflow-visible"
              backgroundColors={["#4f46e5", "#8b5cf6"]}
            >
              <Button
                onClick={() => router.push("/wills/create")}
                className="bg-gradient-to-r from-[#f7931a] via-[#fbbf24] to-[#ff6b35] hover:from-blue-700 hover:to-purple-700 text-white shadow-md"
                size="lg"
              >
                <svg
                  className="mr-2 w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  ></path>
                </svg>
                Create New Will
              </Button>
            </ParallaxCard>
          </div>
        </ScrollReveal>
      </div>

      <AnimatePresence mode="wait">
        {isLoadingWills ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <LoadingState />
          </motion.div>
        ) : willIds && willIds.length > 0 ? (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Enhanced Will List */}
            <ScrollReveal
              className="lg:col-span-3"
              direction="left"
              once={false}
            >
              <div ref={willListRef}>
                <ParallaxCard
                  className="overflow-hidden"
                  backgroundColors={["#6366f1", "#8b5cf6"]}
                  depth={15}
                >
                  <Card className="bg-white/80 border-0 shadow-none h-full">
                    <CardHeader>
                      <CardTitle className="text-xl text-white/70 flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-blue-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          ></path>
                        </svg>
                        Your Wills
                      </CardTitle>
                      <CardDescription>
                        Select a will to view details
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {willIds.map((id, index) => (
                          <ScrollReveal
                            key={Number(id)}
                            direction="left"
                            delay={index * 0.1}
                            distance={15}
                          >
                            <motion.div
                              className="will-item"
                              initial={{ opacity: 0, y: 20 }}
                              whileHover={{
                                scale: 1.02,
                                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                              }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Button
                                variant={
                                  selectedWillId === Number(id)
                                    ? "default"
                                    : "outline"
                                }
                                className={`w-full justify-start py-6 ${
                                  selectedWillId === Number(id)
                                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                                    : "hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50"
                                }`}
                                onClick={() => setSelectedWillId(Number(id))}
                              >
                                <svg
                                  className="mr-3 w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  ></path>
                                </svg>
                                Will #{Number(id)}
                              </Button>
                            </motion.div>
                          </ScrollReveal>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </ParallaxCard>
              </div>
            </ScrollReveal>

            {/* Will Details - Enhanced with custom will card */}
            <div className="lg:col-span-9" ref={willDetailRef}>
              <AnimatePresence mode="wait">
                {isLoadingWillDetails ? (
                  <motion.div
                    key="loading-details"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <LoadingState />
                  </motion.div>
                ) : will ? (
                  <motion.div
                    key={`will-${will.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    className="relative"
                  >
                    <ScrollReveal direction="right">
                      <WillCard will={will} active={true} />
                    </ScrollReveal>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <ParallaxCard className="overflow-hidden">
                      <Card className="bg-white/80 border border-gray-100">
                        <CardContent className="text-center py-12">
                          <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="flex flex-col items-center"
                          >
                            <div className="rounded-full bg-gray-100 p-5 mb-4">
                              <svg
                                className="w-10 h-10 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                ></path>
                              </svg>
                            </div>
                            <p className="mb-4 text-xl text-gray-700 font-semibold">
                              No will selected or details not available
                            </p>
                            <p className="text-gray-500">
                              Please select a will from the list or create a new
                              one.
                            </p>
                          </motion.div>
                        </CardContent>
                      </Card>
                    </ParallaxCard>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ParallaxCard className="overflow-hidden">
              <Card className="bg-transparent shadow-xl border border-gray-100 overflow-hidden">
                <CardContent className="text-center py-20 relative">
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/5 rounded-full"></div>
                    <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-500/5 rounded-full"></div>
                  </div>

                  <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    className="relative z-10"
                  >
                    <div className="mb-8 inline-block p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full shadow-inner">
                      <svg
                        width="80"
                        height="80"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M9 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-4M13 3l9 9m-9-9v9h9"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-indigo-400"
                        />
                      </svg>
                    </div>

                    <h2 className="mb-6 text-3xl font-bold text-white/70">
                      You don&apos;t have any wills yet
                    </h2>
                    <p className="mb-10 text-gray-500 max-w-lg mx-auto text-lg">
                      Create your first crypto will to ensure your digital
                      assets are transferred according to your wishes, even when
                      you&apos;re not around to manage them.
                    </p>

                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-block"
                    >
                      <Button
                        onClick={() => router.push("/wills/create")}
                        className="bg-gradient-to-r from-[#f7931a] via-[#fbbf24] to-[#ff6b35] hover:from-blue-700 hover:to-purple-700 text-white shadow-lg px-8 py-6 text-lg"
                        size="lg"
                      >
                        <svg
                          className="mr-3 w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          ></path>
                        </svg>
                        Create Your First Will
                      </Button>
                    </motion.div>
                  </motion.div>
                </CardContent>
              </Card>
            </ParallaxCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
