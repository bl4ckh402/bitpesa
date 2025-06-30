"use client"

import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

interface WillCardProps {
  will: any;
  active?: boolean;
  onClick?: () => void;
}

export function WillCard({ will, active = false, onClick }: WillCardProps) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  
  // Format inactivity period
  const formatInactivityPeriod = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    return `${days} day${days !== 1 ? 's' : ''}`;
  };
  
  // GSAP animation on hover
  useEffect(() => {
    if (!cardRef.current) return;
    
    const card = cardRef.current;
    
    if (hovered) {
      gsap.to(card, {
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
        y: -5,
        duration: 0.3,
      });
      
      // Subtle scale effect on inner elements
      gsap.to(card.querySelectorAll('.animate-on-hover'), {
        scale: 1.02,
        duration: 0.3,
        stagger: 0.05,
      });
      
    } else {
      gsap.to(card, {
        boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)',
        y: 0,
        duration: 0.3,
      });
      
      // Reset scale
      gsap.to(card.querySelectorAll('.animate-on-hover'), {
        scale: 1,
        duration: 0.3,
        stagger: 0.05,
      });
    }
  }, [hovered]);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative rounded-xl transition-all duration-300 ${active ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      <Card className={`${will.executed ? 'bg-gradient-to-br from-red-50 to-amber-50 border-red-100' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100'} shadow-lg overflow-hidden h-full`}>
        <div className={`absolute top-0 left-0 h-1 w-full ${will.executed ? 'bg-gradient-to-r from-red-500 to-amber-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}></div>
        
        <CardHeader className="animate-on-hover">
          <CardTitle className="flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-2xl font-bold">Will #{will.id}</span>
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="ml-3"
              >
                <span className={`text-sm px-3 py-1 rounded-full ${will.executed ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-green-100 text-green-800 border border-green-200'}`}>
                  {will.executed ? 'Executed' : 'Active'}
                </span>
              </motion.div>
            </div>
            {!will.executed && (
              <motion.div
                whileHover={{ rotate: [0, -5, 5, -5, 0] }}
                transition={{ duration: 0.5 }}
                className={will.executed ? "text-amber-500" : "text-blue-500"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v1M12 21v1M4.93 4.93l.7.7M18.36 18.36l.7.7M2 12h1M21 12h1M6.34 17.66l-.7.7M18.36 5.64l-.7.7" /></svg>
              </motion.div>
            )}
          </CardTitle>
          <CardDescription className="flex items-center">
            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded mr-2">
              {will.creator.slice(0, 8)}...{will.creator.slice(-6)}
            </span>
            <span className="text-sm text-muted-foreground">
              Last updated: {formatDistanceToNow(will.lastActivityTimestamp, { addSuffix: true })}
            </span>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="animate-on-hover">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg ${will.executed ? 'bg-red-50/70' : 'bg-blue-50/70'}`}>
              <h3 className="font-medium mb-1 flex items-center">
                <svg className="mr-2" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 6v6l4 2M12 2a10 10 0 110 20 10 10 0 010-20z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Inactivity Period
              </h3>
              <p className="text-xl font-bold text-gray-800">{formatInactivityPeriod(will.inactivityPeriod)}</p>
            </div>
            
            <div className={`p-4 rounded-lg ${will.executed ? 'bg-amber-50/70' : 'bg-indigo-50/70'}`}>
              <h3 className="font-medium mb-1 flex items-center">
                <svg className="mr-2" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8v4l2 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Last Activity
              </h3>
              <p className="text-xl font-bold text-gray-800">{formatDistanceToNow(will.lastActivityTimestamp, { addSuffix: true })}</p>
            </div>
          </div>
          
          <div className={`mt-4 p-4 rounded-lg ${will.executed ? 'bg-purple-50/70' : 'bg-violet-50/70'}`}>
            <h3 className="font-medium mb-1 flex items-center">
              <svg className="mr-2" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2l2 5h5l-4 4 2 5-5-3-5 3 2-5-4-4h5l2-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Assets
            </h3>
            <p className="text-xl font-bold text-gray-800 flex items-center">
              <span className="text-amber-500 font-mono mr-2">₿</span> 
              {will.assetsAmount} WBTC
            </p>
          </div>
          
          <div className="mt-4 bg-white/80 rounded-lg border border-gray-100 overflow-hidden">
            <h3 className="font-medium p-3 border-b border-gray-100">Beneficiaries</h3>
            <div className="p-2 max-h-32 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Address</TableHead>
                    <TableHead className="text-right">Share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {will.beneficiaries.map((beneficiary: string, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-xs py-1">
                        {beneficiary.slice(0, 6)}...{beneficiary.slice(-4)}
                      </TableCell>
                      <TableCell className="text-right py-1">
                        <div className="flex items-center justify-end">
                          <motion.div 
                            className="w-full max-w-[60px] h-2 bg-gray-100 rounded-full mr-2 overflow-hidden"
                            initial={{ opacity: 0.5 }}
                            whileHover={{ opacity: 1 }}
                          >
                            <motion.div
                              initial={{ width: "0%" }}
                              animate={{ width: `${will.shares[index]}%` }}
                              transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
                              className={`h-full ${will.executed ? 'bg-gradient-to-r from-amber-400 to-red-400' : 'bg-gradient-to-r from-blue-400 to-indigo-400'}`}
                            />
                          </motion.div>
                          <span className="font-medium">{will.shares[index].toFixed(0)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end gap-3 pt-3 mt-3 border-t border-gray-100">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <Button 
              variant="outline" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/wills/register-activity/${will.id}`);
              }}
              disabled={will.executed}
              className="bg-white hover:bg-gray-50"
            >
              Register Activity
            </Button>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <Button 
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/wills/edit/${will.id}`);
              }}
              disabled={will.executed}
              className="bg-white hover:bg-gray-50"
            >
              Edit
            </Button>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <Button 
              variant="destructive"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/wills/revoke/${will.id}`);
              }}
              disabled={will.executed}
              className={will.executed ? "bg-gray-500" : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"}
            >
              Revoke
            </Button>
          </motion.div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
