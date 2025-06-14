"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileCode, Shield, CheckCircle, Clock, AlertTriangle, ExternalLink, Copy, Eye } from "lucide-react"

export function SmartContracts() {
  const [deploymentStatus, setDeploymentStatus] = useState("deployed")
  const [copied, setCopied] = useState<string | null>(null)

  const contracts = [
    {
      name: "VaultManager",
      address: "0x742d35Cc6634C0532925a3b8D4C9C4e5C5f8b8A9",
      description: "Manages BTC collateral deposits and withdrawals",
      status: "active",
      version: "v2.1.0",
      gasUsed: "2,847,392",
      functions: ["depositCollateral", "withdrawCollateral", "liquidate", "updatePrice"],
    },
    {
      name: "LoanManager",
      address: "0x1a2b3c4d5e6f7890abcdef1234567890abcdef12",
      description: "Handles fiat loan issuance and repayment",
      status: "active",
      version: "v2.1.0",
      gasUsed: "3,124,567",
      functions: ["issueLoan", "repayLoan", "calculateInterest", "checkHealth"],
    },
    {
      name: "PriceOracle",
      address: "0x9876543210fedcba0987654321fedcba09876543",
      description: "Provides real-time BTC price feeds",
      status: "active",
      version: "v1.8.2",
      gasUsed: "1,234,567",
      functions: ["updatePrice", "getPrice", "getPriceHistory", "setFeedSource"],
    },
    {
      name: "LightningBridge",
      address: "0xabcdef1234567890abcdef1234567890abcdef12",
      description: "Bridges Lightning Network with smart contracts",
      status: "beta",
      version: "v0.9.1",
      gasUsed: "4,567,890",
      functions: ["openChannel", "closeChannel", "routePayment", "syncState"],
    },
  ]

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
    setCopied(address)
    setTimeout(() => setCopied(null), 2000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-600 dark:text-green-400"
      case "beta":
        return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
      case "pending":
        return "bg-blue-500/20 text-blue-600 dark:text-blue-400"
      default:
        return "bg-gray-500/20 text-gray-600 dark:text-gray-400"
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-background border">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileCode className="h-6 w-6 text-orange-500 mr-2" />
            Smart Contract Infrastructure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 text-xs sm:text-sm">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="contracts">Contracts</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm">Total Contracts</p>
                        <p className="text-2xl font-bold">4</p>
                      </div>
                      <FileCode className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm">Active Loans</p>
                        <p className="text-2xl font-bold">1,247</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm">TVL</p>
                        <p className="text-2xl font-bold">$45.2M</p>
                      </div>
                      <Shield className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-lg">System Health</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Contract Uptime</span>
                      <span className="text-sm font-medium">99.97%</span>
                    </div>
                    <Progress value={99.97} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Oracle Accuracy</span>
                      <span className="text-sm font-medium">99.99%</span>
                    </div>
                    <Progress value={99.99} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Lightning Sync</span>
                      <span className="text-sm font-medium">98.5%</span>
                    </div>
                    <Progress value={98.5} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contracts" className="space-y-4">
              {contracts.map((contract) => (
                <Card key={contract.name} className="bg-muted/50">
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold">{contract.name}</h3>
                          <Badge className={getStatusColor(contract.status)}>{contract.status}</Badge>
                          <Badge variant="outline" className="text-xs">
                            {contract.version}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm mb-2">{contract.description}</p>
                        <div className="flex items-center space-x-2">
                          <code className="bg-background px-2 py-1 rounded text-xs font-mono">{contract.address}</code>
                          <Button size="sm" variant="ghost" onClick={() => handleCopyAddress(contract.address)}>
                            {copied === contract.address ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Etherscan
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-muted-foreground text-xs">Gas Used</p>
                        <p className="font-medium">{contract.gasUsed}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Functions</p>
                        <p className="font-medium">{contract.functions.length}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-muted-foreground text-xs mb-2">Available Functions</p>
                      <div className="flex flex-wrap gap-1 text-[10px] sm:text-xs">
                        {contract.functions.map((func) => (
                          <Badge key={func} variant="secondary" className="text-xs">
                            {func}()
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Shield className="h-5 w-5 text-green-500 mr-2" />
                      Security Audits
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">OpenZeppelin</span>
                      <Badge className="bg-green-500/20 text-green-600 dark:text-green-400">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Passed
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">ConsenSys Diligence</span>
                      <Badge className="bg-green-500/20 text-green-600 dark:text-green-400">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Passed
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Trail of Bits</span>
                      <Badge className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
                        <Clock className="h-3 w-3 mr-1" />
                        In Progress
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                      Risk Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Liquidation Risk</span>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">Low</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Oracle Dependency</span>
                      <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Medium</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Smart Contract Risk</span>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">Low</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-lg">Emergency Procedures</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Multi-sig wallet controls (3/5 threshold)</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">24-hour timelock for critical functions</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Circuit breaker for large withdrawals</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Automated liquidation protection</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Transaction Volume (24h)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">$2.4M</div>
                    <div className="text-sm text-green-600 dark:text-green-400">+12.5% from yesterday</div>
                  </CardContent>
                </Card>

                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Gas Efficiency</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">94.2%</div>
                    <div className="text-sm text-muted-foreground">Average optimization</div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Contract Interactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { action: "Loan Issued", amount: "$25,000", time: "2 min ago", tx: "0xabc123..." },
                      { action: "Collateral Deposited", amount: "0.75 BTC", time: "5 min ago", tx: "0xdef456..." },
                      { action: "Price Updated", amount: "$67,500", time: "8 min ago", tx: "0x789abc..." },
                      { action: "Loan Repaid", amount: "$15,000", time: "12 min ago", tx: "0x456def..." },
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 border-b border-border last:border-0"
                      >
                        <div>
                          <p className="text-sm font-medium">{item.action}</p>
                          <p className="text-xs text-muted-foreground">{item.time}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{item.amount}</p>
                          <p className="text-xs text-muted-foreground font-mono">{item.tx}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
