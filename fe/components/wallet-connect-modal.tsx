"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Wallet, ArrowRight, ChevronRight } from "lucide-react"
import { useAppKit } from "@reown/appkit/react"
import { useAccount } from "wagmi"

interface WalletConnectProps {
  onClose: () => void
}

export function WalletConnect({ onClose }: WalletConnectProps) {
  const { open } = useAppKit()
  const { isConnected, address } = useAccount()

  const openConnectModal = () => {
    open({ view: 'Connect' })
  }

  const handleGetStarted = () => {
    if (isConnected) {
      // Redirect to dashboard or appropriate page
      onClose()
    } else {
      openConnectModal()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-700">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          <CardTitle className="text-2xl font-bold text-white">Connect Your Wallet</CardTitle>
          <CardDescription className="text-slate-300">
            Connect your wallet to get started with BitPesa
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="border border-slate-700 rounded-lg p-4 cursor-pointer hover:bg-slate-800/50 transition-colors" onClick={openConnectModal}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-500/20 p-2 rounded-full">
                    <Wallet className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Crypto Wallets</h3>
                    <p className="text-sm text-slate-400">Connect via Metamask, WalletConnect, Coinbase</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-500" />
              </div>
            </div>
          </div>
          
          <Button 
            className="w-full bg-orange-500 hover:bg-orange-600" 
            size="lg"
            onClick={handleGetStarted}
          >
            {isConnected ? "Continue" : "Connect Wallet"} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          
          <p className="text-center text-xs text-slate-500 px-6">
            By connecting your wallet, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
