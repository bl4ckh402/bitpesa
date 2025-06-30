'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Coins, User, Settings, FileText } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Lending', href: '/lending', icon: Coins },
  { name: 'Crypto Wills', href: '/wills', icon: FileText },
  { name: 'Account', href: '/account', icon: User },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function SideNavigation() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col space-y-1">
      {navigation.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`
              flex items-center px-4 py-2 text-sm font-medium rounded-md
              ${isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }
            `}
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
