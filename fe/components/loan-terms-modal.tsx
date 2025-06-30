"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { X, DollarSign, AlertTriangle, FileText, Loader2 } from "lucide-react"
import { useAccount } from "wagmi"
import { parseUnits } from "viem"
import { 
  useCreateLoan, 
  useApproveWBTC,
  useRequiredCollateralRatio
} from "@/lib/hooks/useContracts"
import { useTokenAllowance } from "@/lib/hooks/useTokenAllowance"
import { contractAddresses, AVALANCHE_FUJI_CHAIN_ID } from "@/lib/config"
import { toast } from "sonner"

interface LoanTermsModalProps {
  onClose: () => void
  btcPrice: number
  collateral: number
}

export function LoanTermsModal({ onClose, btcPrice, collateral }: LoanTermsModalProps) {
  const [loanAmount, setLoanAmount] = useState("10000")
  const [currency, setCurrency] = useState("USD")
  const [duration, setDuration] = useState("90")
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [step, setStep] = useState<number>(1)
  const { address } = useAccount()
  
  const { ratio: requiredCollateralRatio } = useRequiredCollateralRatio()
  
  // Calculate max allowed loan amount based on collateral
  const maxLoanAmount = collateral * btcPrice * (requiredCollateralRatio ? 1 / (requiredCollateralRatio / 100) : 0.6)
  
  // Calculate interest rates based on duration
  const interestRates: Record<string, number> = { "30": 8, "90": 10, "180": 12, "365": 15 }
  const interestRate = interestRates[duration as keyof typeof interestRates]
  const originationFee = Number.parseFloat(loanAmount) * 0.01 // 1% origination fee
  const totalRepayment = Number.parseFloat(loanAmount) * (1 + (interestRate / 100) * (Number.parseInt(duration) / 365))
  
  // Calculate how much collateral is needed for this loan
  const collateralNeeded = Number(loanAmount) / btcPrice * (requiredCollateralRatio ? requiredCollateralRatio / 100 : 0.6)
  
  // Token allowance check
  const { allowance, hasAllowance, isLoading: isAllowanceLoading } = useTokenAllowance(
    'WBTC',
    address,
    contractAddresses[AVALANCHE_FUJI_CHAIN_ID].BitPesaLending as string
  )
  
  // Approve WBTC
  const { approve: approveWbtc, isPending: isApproving, isSuccess: isApproved, isConfirming: isApproveConfirming } = useApproveWBTC()
  
  // Create loan
  const { createLoan, isPending: isCreatingLoan, isSuccess: isLoanCreated, isConfirming: isLoanConfirming } = useCreateLoan()
  
  // Check if user has enough allowance for the collateral
  const hasEnoughAllowance = () => {
    if (!collateralNeeded || isNaN(collateralNeeded)) return false
    return hasAllowance(parseUnits(collateralNeeded.toFixed(8), 8))
  }
  
  // Handle approving WBTC
  const handleApprove = async () => {
    try {
      await approveWbtc(collateralNeeded.toFixed(8))
      toast.success("Approval initiated. Please confirm the transaction.")
    } catch (error) {
      console.error("Failed to approve WBTC:", error)
      toast.error("Failed to approve WBTC")
    }
  }
  
  // Handle creating loan
  const handleCreateLoan = async () => {
    if (!agreedToTerms) {
      toast.error("Please agree to the terms and conditions")
      return
    }
    
    try {
      await createLoan(
        collateralNeeded.toFixed(8), // Collateral amount in WBTC
        loanAmount,                  // Loan amount in USDC
        Number(duration)             // Duration in days
      )
      toast.success("Loan creation initiated. Please confirm the transaction.")
    } catch (error) {
      console.error("Failed to create loan:", error)
      toast.error("Failed to create loan")
    }
  }
  
  // Handle step completion
  useEffect(() => {
    if (isApproved) {
      toast.success("WBTC approved successfully!")
      setStep(2)
    }
    if (isLoanCreated) {
      toast.success("Loan created successfully!")
      onClose()
    }
  }, [isApproved, isLoanCreated, onClose])
  
  // Validate loan amount
  const isValidLoan = Number(loanAmount) > 0 && Number(loanAmount) <= maxLoanAmount
  
  // Calculate liquidation price
  const liquidationPrice = (Number(loanAmount) * (requiredCollateralRatio ? requiredCollateralRatio / 100 : 0.6)) / collateral
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <Card className="w-full max-w-2xl bg-background border max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center">
            <DollarSign className="h-6 w-6 text-green-500 mr-2" />
            Loan Terms
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isApproving || isCreatingLoan}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <>
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
                    max={maxLoanAmount}
                  />
                  {Number(loanAmount) > maxLoanAmount && (
                    <p className="text-red-400 text-xs mt-1">
                      Maximum loan amount with your collateral: ${maxLoanAmount.toLocaleString()}
                    </p>
                  )}
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
              
              <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                <p className="text-slate-300 text-sm">Collateral Required</p>
                <p className="text-white text-xl font-bold">{collateralNeeded.toFixed(8)} WBTC</p>
                <p className="text-slate-400 text-xs mt-1">Your available collateral: {collateral.toFixed(8)} WBTC</p>
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
                        <li>• Liquidation threshold: ${liquidationPrice.toLocaleString()} BTC price</li>
                        <li>• Current safety margin: {((btcPrice - liquidationPrice) / liquidationPrice * 100).toFixed(1)}%</li>
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
              </div>

              {/* Action Buttons */}
              {hasEnoughAllowance() ? (
                <Button 
                  className="w-full bg-green-500 hover:bg-green-600"
                  onClick={handleCreateLoan} 
                  disabled={!agreedToTerms || !isValidLoan || isCreatingLoan || isLoanConfirming}
                >
                  {isCreatingLoan || isLoanConfirming ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {isCreatingLoan ? "Waiting for approval" : "Creating loan..."}
                    </>
                  ) : (
                    "Create Loan"
                  )}
                </Button>
              ) : (
                <Button 
                  className="w-full bg-blue-500 hover:bg-blue-600"
                  onClick={handleApprove} 
                  disabled={!isValidLoan || isApproving || isApproveConfirming}
                >
                  {isApproving || isApproveConfirming ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {isApproving ? "Awaiting approval" : "Approving..."}
                    </>
                  ) : (
                    "Approve WBTC Collateral"
                  )}
                </Button>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <div className="bg-slate-800/50 border-slate-700 rounded p-4">
                <h4 className="font-medium text-white text-center mb-4">Transaction Details</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Loan Amount:</span>
                    <span className="text-white">{loanAmount} USDC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Collateral:</span>
                    <span className="text-white">{collateralNeeded.toFixed(8)} WBTC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Duration:</span>
                    <span className="text-white">{duration} days</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <h4 className="text-yellow-400 font-medium mb-2">Important Notes</h4>
                <ul className="text-yellow-300 text-sm space-y-1">
                  <li>• WBTC has been approved as collateral</li>
                  <li>• Click create loan to finalize your transaction</li>
                  <li>• Your loan must be repaid within {duration} days</li>
                  <li>• Maintain sufficient collateral to avoid liquidation</li>
                </ul>
              </div>

              <Button 
                className="w-full bg-green-500 hover:bg-green-600"
                onClick={handleCreateLoan}
                disabled={!agreedToTerms || isCreatingLoan || isLoanConfirming}
              >
                {isCreatingLoan || isLoanConfirming ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {isCreatingLoan ? "Waiting for approval" : "Creating loan..."}
                  </>
                ) : (
                  "Create Loan"
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
