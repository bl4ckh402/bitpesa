"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, Zap, Shield, ExternalLink, QrCode, Copy, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface LightningWalletConnectProps {
  onClose: () => void
}

export function LightningWalletConnect({ onClose }: LightningWalletConnectProps) {
  const [connecting, setConnecting] = useState<string | null>(null)
  const [lnurlAuth, setLnurlAuth] = useState("")
  const [nodeUri, setNodeUri] = useState("")
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  const lightningWallets = [
    {
      name: "Phoenix",
      description: "Self-custodial Lightning wallet",
      icon: "🔥",
      type: "mobile",
      recommended: true,
    },
    {
      name: "Breez",
      description: "Lightning-native mobile wallet",
      icon: "⚡",
      type: "mobile",
      recommended: true,
    },
    {
      name: "Zeus",
      description: "Lightning node management",
      icon: "⚡",
      type: "node",
      recommended: false,
    },
    {
      name: "Blue Wallet",
      description: "Lightning & on-chain wallet",
      icon: "🔵",
      type: "mobile",
      recommended: false,
    },
    {
      name: "Alby",
      description: "Browser Lightning wallet",
      icon: "🐝",
      type: "browser",
      recommended: true,
    },
  ]

  const handleConnect = async (walletName: string) => {
    setConnecting(walletName)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setConnecting(null)
    onClose()
    router.push("/dashboard")
  }

  const handleCopyLnurl = () => {
    const lnurl =
      "LNURL1DP68GURN8GHJ7UM9WFMXJCM99E3K7MF0V9CXJ0M385EKVCENXC6R2C35XVUKXEFCV5MKVV34X5EKZD3EV56NYD3HXQURZEPEXEJXXEPNXSCRVWFNV9NXZCN9XQ6XYEFHVGCXXCMYXYMNSERXFQ5FNS"
    navigator.clipboard.writeText(lnurl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <Card className="w-full max-w-2xl bg-background border max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center">
            <Zap className="h-6 w-6 text-orange-500 mr-2" />
            Lightning Network Connection
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="wallets" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 text-xs sm:text-sm">
              <TabsTrigger value="wallets">Wallets</TabsTrigger>
              <TabsTrigger value="lnurl">LNURL-Auth</TabsTrigger>
              <TabsTrigger value="node">Node Connect</TabsTrigger>
            </TabsList>

            <TabsContent value="wallets" className="space-y-4">
              <p className="text-muted-foreground text-sm mb-6">
                Connect your Lightning-enabled wallet for instant, low-fee transactions.
              </p>

              {lightningWallets.map((wallet) => (
                <Button
                  key={wallet.name}
                  variant="outline"
                  className="w-full h-auto p-4 text-left hover:border-orange-500"
                  onClick={() => handleConnect(wallet.name)}
                  disabled={connecting !== null}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{wallet.icon}</span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{wallet.name}</span>
                          {wallet.recommended && (
                            <Badge
                              variant="secondary"
                              className="bg-orange-500/20 text-orange-600 dark:text-orange-400 text-xs"
                            >
                              Recommended
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {wallet.type}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm">{wallet.description}</p>
                      </div>
                    </div>
                    {connecting === wallet.name ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                    ) : (
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </Button>
              ))}
            </TabsContent>

            <TabsContent value="lnurl" className="space-y-4">
              <div className="text-center space-y-4">
                <div className="bg-muted p-6 rounded-lg">
                  <QrCode className="h-32 w-32 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm">Scan with Lightning wallet</p>
                </div>

                <div className="space-y-2">
                  <Label>LNURL-Auth String</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      value="LNURL1DP68GURN8GHJ7UM9WFMXJCM99E3K7MF0V9CXJ0M385EKVCENXC6R2C35XVUKXEFCV5MKVV34X5EKZD3EV56NYD3HXQURZEPEXEJXXEPNXSCRVWFNV9NXZCN9XQ6XYEFHVGCXXCMYXYMNSERXFQ5FNS"
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button size="sm" variant="outline" onClick={handleCopyLnurl}>
                      {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button className="w-full bg-orange-500 hover:bg-orange-600" onClick={() => handleConnect("LNURL")}>
                  <Zap className="h-4 w-4 mr-2" />
                  Authenticate with LNURL
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="node" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nodeUri">Lightning Node URI</Label>
                  <Input
                    id="nodeUri"
                    placeholder="03abc123...@192.168.1.100:9735"
                    value={nodeUri}
                    onChange={(e) => setNodeUri(e.target.value)}
                    className="font-mono"
                  />
                  <p className="text-muted-foreground text-xs mt-1">Format: pubkey@host:port</p>
                </div>

                <div>
                  <Label htmlFor="lnurlAuth">LNURL-Auth (Optional)</Label>
                  <Input
                    id="lnurlAuth"
                    placeholder="LNURL1DP68GURN..."
                    value={lnurlAuth}
                    onChange={(e) => setLnurlAuth(e.target.value)}
                    className="font-mono"
                  />
                </div>

                <Button
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  onClick={() => handleConnect("Node")}
                  disabled={!nodeUri}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Connect Lightning Node
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 p-4 bg-muted/50 border rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="h-4 w-4 text-green-500" />
              <span className="text-green-600 dark:text-green-400 text-sm font-medium">Lightning Benefits</span>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Instant transactions with minimal fees</li>
              <li>• Enhanced privacy through payment channels</li>
              <li>• Seamless integration with DeFi protocols</li>
              <li>• Real-time settlement for loan operations</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
