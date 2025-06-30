'use client';

import { Bitcoin } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Bitcoin className="h-6 w-6 text-orange-500" />
              <span className="text-xl font-bold text-white">BitPesa</span>
            </div>
            <p className="text-sm">
              The Bitcoin-backed lending platform that puts you in control.
            </p>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">Platform</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/#how-it-works" className="hover:text-orange-500 transition-colors">
                  How it Works
                </Link>
              </li>
              <li>
                <Link href="/#rates" className="hover:text-orange-500 transition-colors">
                  Rates
                </Link>
              </li>
              <li>
                <Link href="/demo" className="hover:text-orange-500 transition-colors">
                  Demo
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/docs" className="hover:text-orange-500 transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-orange-500 transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/security" className="hover:text-orange-500 transition-colors">
                  Security
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">Connect</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="https://twitter.com/bitpesa" target="_blank" className="hover:text-orange-500 transition-colors">
                  Twitter
                </Link>
              </li>
              <li>
                <Link href="https://discord.gg/bitpesa" target="_blank" className="hover:text-orange-500 transition-colors">
                  Discord
                </Link>
              </li>
              <li>
                <Link href="https://github.com/bitpesa" target="_blank" className="hover:text-orange-500 transition-colors">
                  GitHub
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-800 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-xs text-slate-500 mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} BitPesa. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <Link href="/terms" className="text-xs text-slate-500 hover:text-orange-500 transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-xs text-slate-500 hover:text-orange-500 transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
