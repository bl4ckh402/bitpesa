'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Bitcoin, 
  ChevronDown, 
  Shield, 
  Sparkles,
  BookOpen, 
  Layers, 
  Globe, 
  FileText,
  Landmark
} from 'lucide-react';
import { motion } from 'framer-motion';
import gsap from 'gsap';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useGSAPCleanup } from '@/lib/gsap-cleanup';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface DesktopNavItemProps {
  href: string;
  label: string;
  icon?: React.ReactNode;
  isActive?: boolean;
  hasDropdown?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const DesktopNavItem = ({
  href,
  label,
  icon,
  isActive = false,
  hasDropdown = false,
  children,
  className,
}: DesktopNavItemProps) => {
  const itemRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (itemRef.current) {
        const el = itemRef.current;
        
        // Set up hover animations
        el.addEventListener('mouseenter', () => {
          gsap.to(el.querySelector('.nav-indicator'), {
            width: '100%',
            left: '0%',
            duration: 0.3,
            ease: 'power1.out'
          });
          
          gsap.to(el.querySelector('.nav-icon'), {
            scale: 1.2,
            rotate: hasDropdown ? 0 : 5,
            color: '#f97316', // orange-500
            duration: 0.3
          });
          
          gsap.to(el.querySelector('.nav-label'), {
            y: -2,
            duration: 0.2
          });
        });
        
        el.addEventListener('mouseleave', () => {
          gsap.to(el.querySelector('.nav-indicator'), {
            width: isActive ? '80%' : '0%',
            left: isActive ? '10%' : '50%',
            duration: 0.3,
            ease: 'power1.out'
          });
          
          gsap.to(el.querySelector('.nav-icon'), {
            scale: 1,
            rotate: 0,
            color: isActive ? '#f97316' : '#cbd5e1', // orange-500 or slate-300
            duration: 0.3
          });
          
          gsap.to(el.querySelector('.nav-label'), {
            y: 0,
            duration: 0.2
          });
        });
      }
    }, itemRef);
    
    return () => ctx.revert();
  }, [isActive, hasDropdown]);
  
  // Base element for both dropdown and normal links
  const NavContent = () => (
    <div className="flex items-center space-x-1.5 relative px-3 py-2">
      {icon && (
        <span className="nav-icon transition-all duration-300" style={{ color: isActive ? '#f97316' : '#cbd5e1' }}>
          {icon}
        </span>
      )}
      <span className="nav-label relative text-sm font-medium transition-all duration-300" style={{ color: isActive ? 'white' : '#cbd5e1' }}>
        {label}
      </span>
      {hasDropdown && (
        <ChevronDown className="h-3.5 w-3.5 text-slate-400 transition-all duration-300" />
      )}
      <span 
        className={cn(
          "nav-indicator absolute bottom-0 left-1/2 h-0.5 bg-orange-500 transition-all duration-300 rounded-full", 
          isActive ? "w-4/5 left-[10%]" : "w-0"
        )}
      ></span>
    </div>
  );
  
  if (hasDropdown) {
    return (
      <div ref={itemRef} className={cn("relative", className)}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="bg-transparent hover:bg-transparent focus:bg-transparent focus-visible:bg-transparent p-0 h-auto hover:text-white"
            >
              <NavContent />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="center" 
            className="w-52 backdrop-blur-lg bg-slate-900/95 border-slate-700 rounded-lg shadow-xl"
          >
            {children}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }
  
  return (
    <div ref={itemRef} className={cn("relative", className)}>
      <Link href={href}>
        <NavContent />
      </Link>
    </div>
  );
};

export function EnhancedDesktopNavigation() {
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);
  
  // Use GSAP cleanup to ensure animations are properly cleared
  useGSAPCleanup();
  
  // Initialize animations when component mounts
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate nav items on mount
      gsap.from('.desktop-nav-item', {
        y: -15,
        opacity: 0,
        stagger: 0.07,
        ease: 'power2.out',
        duration: 0.6,
        delay: 0.2,
        clearProps: 'all'
      });
      
      // Subtle pulse for active nav item
      if (document.querySelector('.nav-active-indicator')) {
        gsap.to('.nav-active-indicator', {
          boxShadow: '0 0 12px rgba(249, 115, 22, 0.5)',
          repeat: -1,
          yoyo: true,
          duration: 1.5
        });
      }
    }, navRef);
    
    return () => ctx.revert();
  }, []);
  
  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div ref={navRef} className="hidden md:flex items-center gap-1">
      <DesktopNavItem
        href="#how-it-works"
        label="How it Works"
        icon={<BookOpen className="h-4 w-4" />}
        isActive={isActive('#how-it-works')}
        className="desktop-nav-item"
      />
      
      <DesktopNavItem
        href="#rates"
        label="Rates"
        icon={<Sparkles className="h-4 w-4" />}
        isActive={isActive('#rates')}
        className="desktop-nav-item"
      />
      
      <DesktopNavItem
        href="/earn"
        label="Earn"
        icon={<Bitcoin className="h-4 w-4" />}
        isActive={isActive('/earn')}
        className="desktop-nav-item"
      />
      
      <DesktopNavItem
        href="/dashboard"
        label="Dashboard"
        icon={<Layers className="h-4 w-4" />}
        isActive={isActive('/dashboard')}
        className="desktop-nav-item"
      />
      
      {/* <DesktopNavItem
        label="Services"
        icon={<Shield className="h-4 w-4" />}
        hasDropdown={true}
        className="desktop-nav-item"
        href="#"
      >
        <DropdownMenuItem className="hover:bg-slate-800 focus:bg-slate-800">
          <Link href="/earn" className="flex items-center w-full">
            <Bitcoin className="h-4 w-4 mr-2 text-orange-400" />
            <span>Yield Farming</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="hover:bg-slate-800 focus:bg-slate-800">
          <Link href="/cross-chain-borrowing" className="flex items-center w-full">
            <Globe className="h-4 w-4 mr-2 text-blue-400" />
            <span>Crosschain Borrowing</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="hover:bg-slate-800 focus:bg-slate-800">
          <Link href="/will" className="flex items-center w-full">
            <FileText className="h-4 w-4 mr-2 text-amber-400" />
            <span>Crypto Will</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="hover:bg-slate-800 focus:bg-slate-800">
          <Link href="/lending" className="flex items-center w-full">
            <Landmark className="h-4 w-4 mr-2 text-green-400" />
            <span>Lending</span>
          </Link>
        </DropdownMenuItem>
      </DesktopNavItem> */}
      
      <motion.div
        className="desktop-nav-item relative ml-3 overflow-hidden"
        whileHover={{ scale: 1.03 }}
        transition={{ duration: 0.2 }}
      >
        {/* <Link href="/will">
          <div className="group relative flex items-center gap-1.5 px-3 py-2 rounded-md overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md"></div>
            <FileText className="h-4 w-4 text-orange-400 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-sm font-medium text-white">Will</span>
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-orange-500 to-amber-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
          </div>
        </Link> */}
      </motion.div>
    </div>
  );
}
