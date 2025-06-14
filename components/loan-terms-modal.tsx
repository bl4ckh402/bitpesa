"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { X, DollarSign, AlertTriangle, FileText } from "lucide-react"

interface LoanTermsModalProps {
  onClose: () => void
}

export function LoanTermsModal({ onClose }: LoanTermsModalProps) {
  const [loanAmount, setLoanAmount] = useState("10000")
  const [currency, setCurrency] = useState("USD")
  const [duration, setDuration] = useState("90")
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const interestRates = { "30": 8, "90": 10, "180": 12, "365": 15 }
  const interestRate = interestRates[duration as keyof typeof interestRates]
  const originationFee = Number.parseFloat(loanAmount) * 0.01 // 1% origination fee
  const totalRepayment = Number.parseFloat(loanAmount) * (1 + (interestRate / 100) * (Number.parseInt(duration) / 365))

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <Card className="w-full max-w-2xl bg-background border max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center">
            <DollarSign className="h-6 w-6 text-green-500 mr-2" />
            Loan Terms
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Loan Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
            <div>
              <Label htmlFor="amount" className="text-slate-300">
                Loan Amount
              </Label>
              <Input
                id="amount"
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>
            <div>
              <Label htmlFor="currency" className="text-slate-300">
                Currency
              </Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="bg-slate-800 border-slate-700 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="duration" className="text-slate-300">
              Loan Duration
            </Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="bg-slate-800 border-slate-700 mt-1">
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

          {/* Loan Summary */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-lg">Loan Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-300">Loan Amount:</span>
                <span className="text-white font-medium">
                  {currency === "USD" && "$"}
                  {Number.parseFloat(loanAmount).toLocaleString()} {currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Interest Rate:</span>
                <span className="text-white font-medium">{interestRate}% APR</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Origination Fee:</span>
                <span className="text-white font-medium">
                  {currency === "USD" && "$"}
                  {originationFee.toLocaleString()} {currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Duration:</span>
                <span className="text-white font-medium">{duration} days</span>
              </div>
              <div className="border-t border-slate-700 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-300 font-medium">Total Repayment:</span>
                  <span className="text-white font-bold text-lg">
                    {currency === "USD" && "$"}
                    {totalRepayment.toLocaleString()} {currency}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Information */}
          <Card className="bg-red-500/10 border-red-500/20">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                <div>
                  <h4 className="text-red-400 font-medium mb-2">Liquidation Risk</h4>
                  <ul className="text-red-300 text-sm space-y-1">
                    <li>• Liquidation threshold: $33,750 BTC price</li>
                    <li>• Current safety margin: 33.3%</li>
                    <li>• Auto-liquidation protects lender interests</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terms Agreement */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
              />
              <div>
                <Label htmlFor="terms" className="text-slate-300 cursor-pointer">
                  I agree to the loan terms and conditions
                </Label>
                <p className="text-slate-400 text-xs mt-1">
                  By checking this box, you acknowledge understanding of liquidation risks and repayment obligations.
                </p>
              </div>
            </div>

            <Button variant="outline" className="w-full border-slate-600 text-slate-300">
              <FileText className="h-4 w-4 mr-2" />
              View Full Terms & Conditions
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:space-x-4">
            <Button variant="outline" className="flex-1 border-slate-600" onClick={onClose}>
              Cancel
            </Button>
            <Button className="flex-1 bg-green-500 hover:bg-green-600" disabled={!agreedToTerms}>
              Confirm Loan
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
