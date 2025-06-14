"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Wallet, Shield, ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"

interface WalletConnectProps {
  onClose: () => void
}

export function WalletConnect({ onClose }: WalletConnectProps) {
  const [connecting, setConnecting] = useState<string | null>(null)
  const router = useRouter()

  const wallets = [
    {
      name: "Ledger",
      description: "Hardware wallet for maximum security",
      icon: "🔒",
      recommended: true,
    },
    {
      name: "Sparrow",
      description: "Desktop Bitcoin wallet",
      icon: "🦅",
      recommended: false,
    },
    {
      name: "Electrum",
      description: "Lightweight Bitcoin client",
      icon: "⚡",
      recommended: false,
    },
    {
      name: "Trezor",
      description: "Hardware wallet solution",
      icon: "🛡️",
      recommended: true,
    },
  ]

  const handleConnect = async (walletName: string) => {
    setConnecting(walletName)
    // Simulate connection delay
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setConnecting(null)
    onClose()
    router.push("/dashboard")
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center">
            <Wallet className="h-6 w-6 text-orange-500 mr-2" />
            Connect Wallet
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-300 text-sm mb-6">
            Connect your Bitcoin wallet to start using VaultFi. Your keys remain secure and under your control.
          </p>

          {wallets.map((wallet) => (
            <Button
              key={wallet.name}
              variant="outline"
              className="w-full h-auto p-4 border-slate-700 hover:border-orange-500 hover:bg-slate-800 text-left"
              onClick={() => handleConnect(wallet.name)}
              disabled={connecting !== null}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{wallet.icon}</span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-medium">{wallet.name}</span>
                      {wallet.recommended && (
                        <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 text-xs">
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <p className="text-slate-400 text-sm">{wallet.description}</p>
                  </div>
                </div>
                {connecting === wallet.name ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                ) : (
                  <ExternalLink className="h-4 w-4 text-slate-400" />
                )}
              </div>
            </Button>
          ))}

          <div className="mt-6 p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="h-4 w-4 text-green-500" />
              <span className="text-green-400 text-sm font-medium">Secure Connection</span>
            </div>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>• Your private keys never leave your device</li>
              <li>• All transactions are signed locally</li>
              <li>• Smart contracts are audited and verified</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
