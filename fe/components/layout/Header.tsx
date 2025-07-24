'use client';

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Bitcoin, Wallet } from "lucide-react";
import { WalletConnect as WalletConnectButton } from "@/components/wallet-connect";
import { WalletConnect } from "@/components/wallet-connect-modal";
import { ICPWalletConnect } from "@/components/icp/ICPWalletConnect";
import { EnhancedDesktopNavigation } from "@/components/enhanced-desktop-navigation";
import { useGSAPCleanup } from "@/lib/gsap-cleanup";
import gsap from "gsap";

export function Header() {
  const [showWalletConnect, setShowWalletConnect] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  
  // Use GSAP cleanup to ensure animations are properly cleared when component unmounts
  useGSAPCleanup();
  
  // Initialize header animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Initial load animation
      gsap.from(".header-content", {
        y: -20,
        opacity: 0,
        duration: 0.8,
        ease: "power2.out",
      });
      
      // Add scroll animation for the header
      let lastScrollY = window.scrollY;
      
      const handleScroll = () => {
        const currentScrollY = window.scrollY;
        
        // Add shadow and change opacity based on scroll position
        if (currentScrollY > 20) {
          gsap.to(".header-wrapper", {
            boxShadow: "0 5px 20px rgba(0, 0, 0, 0.2)",
            backgroundColor: "rgba(15, 23, 42, 0.95)", // slate-900 with higher opacity
            backdropFilter: "blur(10px)",
            duration: 0.3
          });
        } else {
          gsap.to(".header-wrapper", {
            boxShadow: "none",
            backgroundColor: "rgba(15, 23, 42, 0.8)", // slate-900 with lower opacity
            backdropFilter: "blur(5px)",
            duration: 0.3
          });
        }
        
        lastScrollY = currentScrollY;
      };
      
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }, headerRef);
    
    return () => ctx.revert();
  }, []);
  
  return (
    <>
      <header ref={headerRef} className="sticky top-0 z-50">
        <div className="header-wrapper border-b border-slate-700/50 backdrop-blur-sm bg-slate-900/80">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between header-content">
            <div className="flex items-center space-x-2">
            <a href="/" className="flex items-center space-x-2 group">
              <div className="relative">
                <Bitcoin className="logo-icon h-6 w-6 sm:h-8 sm:w-8 text-orange-500 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
                <div className="absolute inset-0 bg-orange-500/20 rounded-full scale-0 group-hover:scale-150 opacity-0 group-hover:opacity-100 transition-all duration-500 -z-10"></div>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-white relative">
                BitPesa
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-orange-500 to-transparent transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
              </span>
            </a>
            
            {/* Mobile Menu Button */}
            <div className="ml-auto md:hidden">
              <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowWalletConnect(!showWalletConnect)}
              className="text-white p-1"
              >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              </Button>
              
              {/* Mobile Navigation Dropdown */}
              {showWalletConnect && (
              <div className="absolute top-16 left-0 right-0 bg-slate-900 border-b border-slate-700/50 p-4 flex flex-col space-y-4">
                <a href="#how-it-works" className="text-slate-300 hover:text-white transition-colors">How it Works</a>
                <a href="#rates" className="text-slate-300 hover:text-white transition-colors">Rates</a>
                <a href="/dashboard" className="text-slate-300 hover:text-white transition-colors">Dashboard</a>
                <a href="/earn" className="text-slate-300 hover:text-white transition-colors">Earn</a>
                <a href="/cross-chain-borrowing" className="text-slate-300 hover:text-white transition-colors">Crosschain Borrowing</a>
                <a href="/will" className="text-slate-300 hover:text-white transition-colors">Will</a>
              </div>
              )}
            </div>
            </div>
          <div className="flex items-center space-x-2 md:hidden">
            <ThemeToggle />
            {/* Use AppKit WalletConnectButton for mobile */}
            <WalletConnectButton />
            <ICPWalletConnect size="sm" />
          </div>
          <div className="hidden md:flex items-center space-x-4">
            {/* Enhanced Desktop Navigation */}
            <EnhancedDesktopNavigation />
            
            <div className="flex items-center space-x-3 pl-2 border-l border-slate-700/50">
              <ThemeToggle />
              {/* Use AppKit WalletConnectButton for desktop */}
              <WalletConnectButton />
              <ICPWalletConnect />
            </div>
          </div>
          </div>
        </div>
      </header>
    </>
  );
}
