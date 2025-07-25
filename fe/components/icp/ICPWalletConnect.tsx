'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useICPIdentity } from '@/lib/hooks/useICP';
import { Loader2, LogIn, LogOut, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ICPWalletConnectProps {
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showDropdown?: boolean;
  className?: string;
}

export function ICPWalletConnect({ 
  variant = 'default', 
  size = 'default',
  showDropdown = true,
  className = ''
}: ICPWalletConnectProps) {
  const { isAuthenticated, principalId, login, logout, isLoading } = useICPIdentity();

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('ICP login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('ICP logout failed:', error);
    }
  };

  const formatPrincipal = (principal: string) => {
    if (principal.length > 20) {
      return `${principal.slice(0, 8)}...${principal.slice(-8)}`;
    }
    return principal;
  };

  if (isLoading) {
    return (
      <Button variant={variant} size={size} disabled className={className}>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Connecting...
      </Button>
    );
  }

  if (!isAuthenticated) {
    return (
      <Button 
        variant={variant} 
        size={size} 
        onClick={handleLogin}
        className={className}
      >
        <LogIn className="mr-2 h-4 w-4" />
        Connect ICP
      </Button>
    );
  }

  if (!showDropdown) {
    return (
      <Button 
        variant={variant} 
        size={size} 
        onClick={handleLogout}
        className={className}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Disconnect ICP
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={`${className} gap-2`}>
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              <User className="h-3 w-3" />
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline">
            {principalId ? formatPrincipal(principalId) : 'ICP Connected'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>ICP Identity</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => principalId && navigator.clipboard.writeText(principalId)}
          className="cursor-pointer"
        >
          <User className="mr-2 h-4 w-4" />
          Copy Principal ID
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleLogout}
          className="cursor-pointer text-red-600 dark:text-red-400"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Simple button version without dropdown
export function ICPLoginButton({ 
  variant = 'default', 
  size = 'default',
  className = ''
}: Omit<ICPWalletConnectProps, 'showDropdown'>) {
  return (
    <ICPWalletConnect 
      variant={variant}
      size={size}
      showDropdown={false}
      className={className}
    />
  );
}
