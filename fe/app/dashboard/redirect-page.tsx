"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/dashboard/motoko');
  }, [router]);
  
  return <div className="flex items-center justify-center min-h-screen">Redirecting to Motoko dashboard...</div>;
}
