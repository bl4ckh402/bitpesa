"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Shield, Zap, TrendingUp, Bitcoin, DollarSign, Euro, PoundSterling, Wallet } from "lucide-react"
import { LoanCalculator } from "@/components/loan-calculator"
import { WalletConnect } from "@/components/wallet-connect"
import { LightningWalletConnect } from "@/components/lightning-wallet-connect"
import { ThemeToggle } from "@/components/theme-toggle"

export default function LandingPage() {
  const [showCalculator, setShowCalculator] = useState(false)
  const [showWalletConnect, setShowWalletConnect] = useState(false)
  const [showLightningConnect, setShowLightningConnect] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 backdrop-blur-sm bg-slate-900/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bitcoin className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
            <span className="text-xl sm:text-2xl font-bold text-white">VaultFi</span>
          </div>
          <div className="flex items-center space-x-2 md:hidden">
            <ThemeToggle />
            <Button
              size="sm"
              variant="outline"
              className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
              onClick={() => setShowWalletConnect(true)}
            >
              <Wallet className="h-4 w-4" />
            </Button>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#how-it-works" className="text-slate-300 hover:text-white transition-colors">
              How it Works
            </a>
            <a href="#security" className="text-slate-300 hover:text-white transition-colors">
              Security
            </a>
            <a href="#rates" className="text-slate-300 hover:text-white transition-colors">
              Rates
            </a>
            <ThemeToggle />
            <Button
              variant="outline"
              className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
              onClick={() => setShowWalletConnect(true)}
            >
              Connect Wallet
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-6">
            Borrow Fiat.
            <br />
            <span className="text-orange-500">Keep Your Bitcoin.</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 mb-8 max-w-2xl mx-auto px-4">
            Use your BTC as collateral to access instant loans in USD, EUR, and more. 100% non-custodial, smart
            contract-powered lending.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              size="lg"
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg"
              onClick={() => setShowWalletConnect(true)}
            >
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-800 px-8 py-4 text-lg"
              onClick={() => setShowCalculator(true)}
            >
              Try Calculator
            </Button>
          </div>

          {/* Animated Visual */}
          <div className="relative max-w-2xl mx-auto mb-16">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <Bitcoin className="h-16 w-16 text-orange-500 mx-auto mb-2" />
                    <p className="text-slate-300">Your BTC</p>
                    <p className="text-white font-bold">Stays Yours</p>
                  </div>
                  <ArrowRight className="h-8 w-8 text-slate-500 animate-pulse" />
                  <div className="text-center">
                    <div className="flex justify-center space-x-2 mb-2">
                      <DollarSign className="h-8 w-8 text-green-500" />
                      <Euro className="h-8 w-8 text-blue-500" />
                      <PoundSterling className="h-8 w-8 text-purple-500" />
                    </div>
                    <p className="text-slate-300">Instant Fiat</p>
                    <p className="text-white font-bold">In Your Account</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security Badges */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
            <Badge
              variant="secondary"
              className="bg-slate-800 text-slate-300 px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm"
            >
              <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              100% Non-Custodial
            </Badge>
            <Badge
              variant="secondary"
              className="bg-slate-800 text-slate-300 px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm"
            >
              <Zap className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Smart Contract-Powered
            </Badge>
            <Badge
              variant="secondary"
              className="bg-slate-800 text-slate-300 px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm"
            >
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Competitive Rates
            </Badge>
          </div>
        </div>
      </section>

      {/* Lightning Network Features */}
      <section className="py-16 bg-slate-800/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Lightning Network Integration</h2>
            <p className="text-slate-300 max-w-2xl mx-auto">
              Experience instant, low-cost Bitcoin transactions with our Lightning Network integration.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Zap className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Instant Settlements</h3>
                <p className="text-slate-300">Lightning-fast loan disbursements and repayments</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <DollarSign className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Minimal Fees</h3>
                <p className="text-slate-300">Reduce transaction costs with Lightning channels</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Shield className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Enhanced Privacy</h3>
                <p className="text-slate-300">Private payment channels for secure transactions</p>
              </CardContent>
            </Card>
          </div>
          <div className="text-center mt-8">
            <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => setShowLightningConnect(true)}>
              <Zap className="h-4 w-4 mr-2" />
              Connect Lightning Wallet
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-slate-800/30">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-white text-center mb-16">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="bg-orange-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-orange-500">1</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Deposit BTC</h3>
                <p className="text-slate-300">Connect your wallet and securely lock your Bitcoin as collateral</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="bg-green-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-green-500">2</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Get Fiat Loan</h3>
                <p className="text-slate-300">Receive instant fiat loans up to 70% of your BTC value</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="bg-blue-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-500">3</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Repay & Withdraw</h3>
                <p className="text-slate-300">Repay your loan and withdraw your Bitcoin collateral</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Rates Section */}
      <section id="rates" className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-white text-center mb-16">Competitive Rates</h2>
          <div className="max-w-4xl mx-auto">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-3 gap-8 text-center">
                  <div>
                    <div className="text-4xl font-bold text-orange-500 mb-2">1%</div>
                    <div className="text-slate-300">Starting APY</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-green-500 mb-2">70%</div>
                    <div className="text-slate-300">Max LTV</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-blue-500 mb-2">0%</div>
                    <div className="text-slate-300">Origination Fee</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Modals */}
      {showCalculator && <LoanCalculator onClose={() => setShowCalculator(false)} />}

      {showWalletConnect && <WalletConnect onClose={() => setShowWalletConnect(false)} />}

      {showLightningConnect && <LightningWalletConnect onClose={() => setShowLightningConnect(false)} />}
    </div>
  )
}
