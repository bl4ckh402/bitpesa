"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Zap,
  DollarSign,
  Shield,
  Network,
  FlaskConical,
  LightbulbIcon,
  Bitcoin,
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import {
  useFadeInAnimation,
  useStaggerAnimation,
  useParallaxEffect,
} from "@/lib/gsap-utils";
import { LightningDeposit } from "@/components/lightning-deposit";
import gsap from "gsap";

interface LightningNetworkSectionProps {
  onConnectLightningWallet: () => void;
}

export function LightningNetworkSection({
  onConnectLightningWallet,
}: LightningNetworkSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useFadeInAnimation(true, 0.2);
  const subtitleRef = useFadeInAnimation(true, 0.3);
  const cardsRef = useStaggerAnimation(".feature-card", true, 0.15);
  const buttonRef = useFadeInAnimation(true, 0.6);
  const networkGraphicRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: false, margin: "-100px" });

  // Lightning deposit modal state
  const [showLightningDeposit, setShowLightningDeposit] = useState(false);

  // Background parallax effect
  const bgParallaxRef = useParallaxEffect(0.15);

  useEffect(() => {
    if (!networkGraphicRef.current || !isInView) return;

    const bolts = networkGraphicRef.current.querySelectorAll(".lightning-bolt");
    const nodes = networkGraphicRef.current.querySelectorAll(".network-node");

    gsap.fromTo(
      nodes,
      { scale: 0.5, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
        delay: 0.2,
      }
    );

    gsap.fromTo(
      bolts,
      { opacity: 0, strokeDashoffset: 100 },
      {
        opacity: 1,
        strokeDashoffset: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out",
        delay: 0.8,
      }
    );

    // Continuous pulse animation
    gsap.to(nodes, {
      scale: 1.15,
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      stagger: 0.2,
      ease: "sine.inOut",
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
          },
        });
      });
    };

    const flashInterval = setInterval(flashAnimation, 3000);

    gsap.fromTo(
      networkGraphicRef.current.querySelector(".node-icp"),
      { scale: 0, opacity: 0 },
      {
        scale: 1.2,
        opacity: 1,
        duration: 1,
        ease: "elastic.out(1, 0.5)",
        delay: 0.5,
        onComplete: () => {
          gsap.to(networkGraphicRef.current.querySelector(".node-icp"), {
            scale: 1,
            duration: 0.5,
            ease: "power2.out",
          });
        },
      }
    );

    // Special animation for ICP connections
    const icpConnections =
      networkGraphicRef.current.querySelectorAll(".icp-connection");
    gsap.fromTo(
      icpConnections,
      {
        opacity: 0,
        strokeDashoffset: function (index, target) {
          return (target as SVGGeometryElement).getTotalLength();
        },
        strokeDasharray: function (index, target) {
          const length = (target as SVGGeometryElement).getTotalLength();
          return `${length} ${length}`;
        },
      },
      {
        opacity: 1,
        strokeDashoffset: 0,
        duration: 1.5,
        stagger: 0.2,
        ease: "power3.out",
        delay: 1.5,
      }
    );

    // Periodic pulse effect for ICP node
    gsap.to(".node-icp", {
      scale: 1.3,
      duration: 1.8,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    // Special flowing effect on ICP connections
    const icpFlowAnimation = () => {
    icpConnections.forEach((connection, index) => {
      // Create energy flowing through ICP connections
      const svgPath = connection as SVGGeometryElement;
      gsap.to(connection, {
        strokeDashoffset: -svgPath.getTotalLength(),
        duration: 3,
        ease: "none",
        repeat: -1,
        delay: index * 0.5,
      });

        // Periodically highlight the connection
        gsap.to(connection, {
          opacity: 1.5,
          stroke: "#6BE0FF",
          strokeWidth: 4,
          duration: 0.3,
          repeat: -1,
          yoyo: true,
          repeatDelay: 2.7,
          delay: 1 + index * 0.5,
        });
      });
    };

    icpFlowAnimation();

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
            </span>{" "}
            <span className="text-white">Integration</span>
          </motion.h2>

          <motion.p
            ref={subtitleRef as React.RefObject<HTMLParagraphElement>}
            className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto"
          >
            Experience instant, low-cost Bitcoin transactions with our Lightning
            Network integration.
          </motion.p>
        </div>

        {/* Network Visualization */}
        <div
          ref={networkGraphicRef}
          className="relative max-w-4xl mx-auto mb-24 hidden md:block"
        >
          <svg className="w-full h-72" viewBox="0 0 800 200" fill="none">
            {/* Network nodes */}
            <circle
              className="network-node"
              cx="120"
              cy="100"
              r="15"
              fill="url(#node-gradient1)"
            />
            <circle
              className="network-node"
              cx="300"
              cy="60"
              r="15"
              fill="url(#node-gradient2)"
            />
            <circle
              className="network-node"
              cx="400"
              cy="150"
              r="15"
              fill="url(#node-gradient3)"
            />
            <circle
              className="network-node"
              cx="550"
              cy="50"
              r="15"
              fill="url(#node-gradient4)"
            />
            <circle
              className="network-node"
              cx="680"
              cy="120"
              r="15"
              fill="url(#node-gradient5)"
            />
            <circle
              className="network-node"
              cx="250"
              cy="170"
              r="15"
              fill="url(#node-gradient1)"
            />
            <circle
              className="network-node"
              cx="480"
              cy="90"
              r="15"
              fill="url(#node-gradient2)"
            />
            <circle
              className="network-node node-icp"
              cx="400"
              cy="20"
              r="18"
              fill="url(#node-gradient-icp)"
            />
            {/* Lightning bolts/connections - Paths adjusted to connect precisely to node edges */}
            <path
              className="lightning-bolt"
              d="M133 107 L237 180"
              stroke="url(#bolt-gradient)"
              strokeWidth="3"
              strokeDasharray="100"
            />
            <path
              className="lightning-bolt"
              d="M264 165 L386 146"
              stroke="url(#bolt-gradient)"
              strokeWidth="3"
              strokeDasharray="100"
            />
            <path
              className="lightning-bolt"
              d="M312 70 L389 137"
              stroke="url(#bolt-gradient)"
              strokeWidth="3"
              strokeDasharray="100"
            />
            <path
              className="lightning-bolt"
              d="M494 96 L537 56"
              stroke="url(#bolt-gradient)"
              strokeWidth="3"
              strokeDasharray="100"
            />
            <path
              className="lightning-bolt"
              d="M413 142 L468 97"
              stroke="url(#bolt-gradient)"
              strokeWidth="3"
              strokeDasharray="100"
            />
            <path
              className="lightning-bolt"
              d="M494 84 L666 115"
              stroke="url(#bolt-gradient)"
              strokeWidth="3"
              strokeDasharray="100"
            />
            <path
              className="lightning-bolt"
              d="M563 57 L666 112"
              stroke="url(#bolt-gradient)"
              strokeWidth="3"
              strokeDasharray="100"
            />
            <path
              className="lightning-bolt"
              d="M134 92 L286 65"
              stroke="url(#bolt-gradient)"
              strokeWidth="3"
              strokeDasharray="100"
            />
            {/* ICP connections */}
            <path
              className="lightning-bolt icp-connection"
              d="M400 38 L300 54"
              stroke="url(#icp-bolt-gradient)"
              strokeWidth="3"
              strokeDasharray="100"
            />
            <path
              className="lightning-bolt icp-connection"
              d="M416 34 L550 41"
              stroke="url(#icp-bolt-gradient)"
              strokeWidth="3"
              strokeDasharray="100"
            />
            <path
              className="lightning-bolt icp-connection"
              d="M384 34 L250 163"
              stroke="url(#icp-bolt-gradient)"
              strokeWidth="3"
              strokeDasharray="100"
            />
            {/* Gradients */}
            <defs>
              <linearGradient
                id="bolt-gradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#facc15" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
              <radialGradient
                id="node-gradient1"
                cx="0"
                cy="0"
                r="1"
                gradientUnits="userSpaceOnUse"
                gradientTransform="translate(15 15) rotate(45) scale(30)"
              >
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0.6" />
              </radialGradient>
              <radialGradient
                id="node-gradient2"
                cx="0"
                cy="0"
                r="1"
                gradientUnits="userSpaceOnUse"
                gradientTransform="translate(15 15) rotate(45) scale(30)"
              >
                <stop offset="0%" stopColor="#facc15" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.6" />
              </radialGradient>
              <radialGradient
                id="node-gradient3"
                cx="0"
                cy="0"
                r="1"
                gradientUnits="userSpaceOnUse"
                gradientTransform="translate(15 15) rotate(45) scale(30)"
              >
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.6" />
              </radialGradient>
              <radialGradient
                id="node-gradient4"
                cx="0"
                cy="0"
                r="1"
                gradientUnits="userSpaceOnUse"
                gradientTransform="translate(15 15) rotate(45) scale(30)"
              >
                <stop offset="0%" stopColor="#facc15" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0.6" />
              </radialGradient>
              <radialGradient
                id="node-gradient5"
                cx="0"
                cy="0"
                r="1"
                gradientUnits="userSpaceOnUse"
                gradientTransform="translate(15 15) rotate(45) scale(30)"
              >
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#facc15" stopOpacity="0.6" />
              </radialGradient>

              <linearGradient
                id="icp-bolt-gradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#29ABE2" />
                <stop offset="50%" stopColor="#4BC1F1" />
                <stop offset="100%" stopColor="#6BE0FF" />
              </linearGradient>
              <radialGradient
                id="node-gradient-icp"
                cx="0"
                cy="0"
                r="1"
                gradientUnits="userSpaceOnUse"
                gradientTransform="translate(18 18) rotate(45) scale(36)"
              >
                <stop offset="0%" stopColor="#29ABE2" />
                <stop offset="100%" stopColor="#4BC1F1" stopOpacity="0.6" />
              </radialGradient>
            </defs>
          </svg>
        </div>

        {/* Feature cards */}
        <div
          ref={cardsRef as React.RefObject<HTMLDivElement>}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto"
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
                <h3 className="text-2xl font-bold text-white mb-4">
                  Instant Settlements
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  Lightning-fast loan disbursements and repayments with
                  confirmation times of seconds, not minutes.
                </p>
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
                <h3 className="text-2xl font-bold text-white mb-4">
                  Minimal Fees
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  Reduce transaction costs with Lightning channels, paying just
                  fractions of a cent per transaction.
                </p>
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
                <h3 className="text-2xl font-bold text-white mb-4">
                  Enhanced Privacy
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  Private payment channels with improved security and privacy
                  features compared to on-chain transactions.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            className="feature-card"
            whileHover={{ y: -10, scale: 1.03 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/90 border-blue-300/20 hover:border-blue-300/50 backdrop-blur-md rounded-xl shadow-xl h-full">
              <CardContent className="p-8 text-center">
                <div className="relative mb-6">
                  <div className="absolute -inset-2 bg-blue-400/20 rounded-full blur-xl opacity-70"></div>
                  {/* Replace this with actual ICP icon or import an SVG */}
                  <div className="h-16 w-16 text-blue-400 mx-auto relative z-10">
                    <svg
                      viewBox="0 0 64 64"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M32 58.5c14.636 0 26.5-11.864 26.5-26.5S46.636 5.5 32 5.5 5.5 17.364 5.5 32 17.364 58.5 32 58.5z"
                        stroke="#29ABE2"
                        strokeWidth="3"
                      />
                      <path
                        d="M32 46a6 6 0 100-12 6 6 0 000 12z"
                        fill="#29ABE2"
                      />
                      <path
                        d="M32 28a4 4 0 100-8 4 4 0 000 8z"
                        fill="#29ABE2"
                      />
                      <path
                        d="M44 40a4 4 0 100-8 4 4 0 000 8z"
                        fill="#29ABE2"
                      />
                      <path
                        d="M20 40a4 4 0 100-8 4 4 0 000 8z"
                        fill="#29ABE2"
                      />
                      <path
                        d="M20 24.5L32 18M44 24.5L32 18M20 39.5L32 46M44 39.5L32 46"
                        stroke="#29ABE2"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  ICP Integration
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  Seamlessly bridge your transactions to Internet Computer
                  Protocol for enhanced scalability.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          ref={buttonRef as React.RefObject<HTMLDivElement>}
          className="text-center mt-12"
        >
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 px-8 py-6 text-lg rounded-xl shadow-glow-yellow transform transition-all duration-300 hover:scale-105"
              onClick={onConnectLightningWallet}
            >
              <Zap className="h-5 w-5 mr-3 animate-pulse" />
              Connect Lightning Wallet
            </Button>

            <Button
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-8 py-6 text-lg rounded-xl shadow-glow-blue transform transition-all duration-300 hover:scale-105"
              onClick={() => setShowLightningDeposit(true)}
            >
              <Bitcoin className="h-5 w-5 mr-3" />
              Lightning Deposit
            </Button>
          </div>

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

      {/* Lightning Deposit Modal */}
      {showLightningDeposit && (
        <LightningDeposit
          onClose={() => setShowLightningDeposit(false)}
          onSuccess={(amount) => {
            setShowLightningDeposit(false);
            // You can add additional success handling here
          }}
        />
      )}
    </motion.section>
  );
}
