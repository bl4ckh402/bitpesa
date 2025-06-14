"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Bitcoin,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Shield,
} from "lucide-react"
import { LoanTermsModal } from "@/components/loan-terms-modal"
import { DepositModal } from "@/components/deposit-modal"
import { SmartContracts } from "@/components/smart-contracts"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Dashboard() {
  const [showLoanTerms, setShowLoanTerms] = useState(false)
  const [showDeposit, setShowDeposit] = useState(false)

  // Mock user data
  const userData = {
    btcCollateral: 2.5,
    fiatLoan: 67500,
    healthRatio: 75,
    repaymentDue: "2024-02-15",
    status: "Active",
  }

  const btcPrice = 45000
  const collateralValue = userData.btcCollateral * btcPrice

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 backdrop-blur-sm bg-slate-900/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bitcoin className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
            <span className="text-xl sm:text-2xl font-bold text-white">VaultFi</span>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <ThemeToggle />
            <Badge variant="secondary" className="bg-green-500/20 text-green-600 dark:text-green-400 hidden sm:flex">
              <Shield className="h-3 w-3 mr-1" />
              Connected
            </Badge>
            <div className="text-right">
              <p className="text-xs text-muted-foreground hidden xs:block">Wallet</p>
              <p className="text-xs sm:text-sm font-mono">bc1q...7x9k</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">BTC Collateral</p>
                  <p className="text-2xl font-bold text-white">{userData.btcCollateral} BTC</p>
                  <p className="text-slate-400 text-xs">${collateralValue.toLocaleString()}</p>
                </div>
                <Bitcoin className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Fiat Loan</p>
                  <p className="text-2xl font-bold text-white">${userData.fiatLoan.toLocaleString()}</p>
                  <p className="text-slate-400 text-xs">USD</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Health Ratio</p>
                  <p className="text-2xl font-bold text-white">{userData.healthRatio}%</p>
                  <Progress value={userData.healthRatio} className="mt-2 h-2" />
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Status</p>
                  <Badge className="bg-green-500/20 text-green-400 mt-1">{userData.status}</Badge>
                  <p className="text-slate-400 text-xs mt-2">Due: {userData.repaymentDue}</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted border flex flex-wrap">
            <TabsTrigger value="overview" className="flex-1">
              Overview
            </TabsTrigger>
            <TabsTrigger value="deposit" className="flex-1">
              Deposit
            </TabsTrigger>
            <TabsTrigger value="borrow" className="flex-1">
              Borrow
            </TabsTrigger>
            <TabsTrigger value="repay" className="flex-1">
              Repay
            </TabsTrigger>
            <TabsTrigger value="contracts" className="flex-1">
              Contracts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Active Loan */}
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Active Loan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Loan Amount:</span>
                    <span className="text-white font-medium">${userData.fiatLoan.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Interest Rate:</span>
                    <span className="font-medium">1.0% APY</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">LTV Ratio:</span>
                    <span className="text-white font-medium">60%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Liquidation Price:</span>
                    <span className="text-red-400 font-medium">$33,750</span>
                  </div>
                  <Button className="w-full bg-blue-500 hover:bg-blue-600">View Full Details</Button>
                </CardContent>
              </Card>

              {/* Risk Management */}
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                    Risk Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-slate-400">Health Ratio</span>
                      <span className="text-white font-medium">{userData.healthRatio}%</span>
                    </div>
                    <Progress value={userData.healthRatio} className="h-3" />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>Liquidation</span>
                      <span>Safe</span>
                    </div>
                  </div>
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-green-400 text-sm font-medium">Status: Safe</p>
                    <p className="text-green-300 text-xs mt-1">
                      Your position is healthy. BTC can drop to $33,750 before liquidation.
                    </p>
                  </div>
                  <Button variant="outline" className="w-full border-slate-600">
                    Set Price Alerts
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="deposit">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Deposit BTC Collateral</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-slate-300">
                  Increase your collateral to improve your health ratio or enable larger loans.
                </p>
                <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => setShowDeposit(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Deposit More BTC
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="borrow">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Borrow Additional Fiat</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-slate-300">Based on your current collateral, you can borrow up to $22,500 more.</p>
                <Button className="bg-green-500 hover:bg-green-600" onClick={() => setShowLoanTerms(true)}>
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  Borrow More
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="repay">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Repay Loan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Outstanding Balance:</span>
                    <span className="text-white font-medium">${userData.fiatLoan.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Accrued Interest:</span>
                    <span className="text-white font-medium">$1,247</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-700 pt-4">
                    <span className="text-slate-300 font-medium">Total Due:</span>
                    <span className="text-white font-bold">${(userData.fiatLoan + 1247).toLocaleString()}</span>
                  </div>
                </div>
                <Button className="bg-blue-500 hover:bg-blue-600">
                  <ArrowDownLeft className="h-4 w-4 mr-2" />
                  Repay Loan
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="contracts">
            <SmartContracts />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      {showLoanTerms && <LoanTermsModal onClose={() => setShowLoanTerms(false)} />}

      {showDeposit && <DepositModal onClose={() => setShowDeposit(false)} />}
    </div>
  )
}
