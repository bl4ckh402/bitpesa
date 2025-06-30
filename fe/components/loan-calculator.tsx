"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Bitcoin, AlertTriangle, CheckCircle } from "lucide-react"

interface LoanCalculatorProps {
  onClose: () => void
}

export function LoanCalculator({ onClose }: LoanCalculatorProps) {
  const [btcAmount, setBtcAmount] = useState([1])
  const [ltvRatio, setLtvRatio] = useState([50])
  const [currency, setCurrency] = useState("USD")
  const [duration, setDuration] = useState("30")

  const btcPrice = 45000 // Mock BTC price
  const interestRates = { "30": 1, "90": 1.2, "180": 1.5, "365": 2 }

  const collateralValue = btcAmount[0] * btcPrice
  const loanAmount = (collateralValue * ltvRatio[0]) / 100
  const interestRate = interestRates[duration as keyof typeof interestRates]
  const totalRepayment = loanAmount * (1 + (interestRate / 100) * (Number.parseInt(duration) / 365))

  const getRiskLevel = (ltv: number) => {
    if (ltv <= 40) return { level: "Safe", color: "text-green-500", bg: "bg-green-500/20" }
    if (ltv <= 60) return { level: "Moderate", color: "text-yellow-500", bg: "bg-yellow-500/20" }
    return { level: "High Risk", color: "text-red-500", bg: "bg-red-500/20" }
  }

  const risk = getRiskLevel(ltvRatio[0])

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <Card className="w-full max-w-2xl bg-background border max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center">
            <Bitcoin className="h-6 w-6 text-orange-500 mr-2" />
            Loan Calculator
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* BTC Amount */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">BTC Collateral Amount</label>
            <Slider value={btcAmount} onValueChange={setBtcAmount} max={10} min={0.1} step={0.1} className="mb-2" />
            <div className="flex justify-between text-sm text-slate-400">
              <span>0.1 BTC</span>
              <span className="text-white font-medium">{btcAmount[0]} BTC</span>
              <span>10 BTC</span>
            </div>
            <p className="text-sm text-slate-400 mt-1">≈ ${collateralValue.toLocaleString()} USD</p>
          </div>

          {/* LTV Ratio */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">Loan-to-Value Ratio</label>
            <Slider value={ltvRatio} onValueChange={setLtvRatio} max={70} min={20} step={5} className="mb-2" />
            <div className="flex justify-between text-sm text-slate-400">
              <span>20%</span>
              <span className="text-white font-medium">{ltvRatio[0]}%</span>
              <span>70%</span>
            </div>
            <Badge className={`${risk.bg} ${risk.color} mt-2`}>{risk.level}</Badge>
          </div>

          {/* Currency & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Currency</label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Duration</label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Loan Summary */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-300">Loan Amount:</span>
                <span className="text-white font-medium">
                  {currency === "USD" && "$"}
                  {loanAmount.toLocaleString()} {currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Interest Rate:</span>
                <span className="text-white font-medium">{interestRate}% APR</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Total Repayment:</span>
                <span className="text-white font-medium">
                  {currency === "USD" && "$"}
                  {totalRepayment.toLocaleString()} {currency}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-700 pt-3">
                <span className="text-slate-300">Liquidation Price:</span>
                <span className="text-red-400 font-medium">${(btcPrice * 0.75).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Risk Warning */}
          <div className="flex items-start space-x-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-600 dark:text-yellow-200 font-medium">Risk Warning</p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                If BTC price falls below the liquidation threshold, your collateral may be liquidated to repay the loan.
              </p>
            </div>
          </div>

          <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" onClick={onClose}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Proceed with These Terms
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
