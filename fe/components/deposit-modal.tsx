"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { X, Bitcoin, Copy, QrCode, CheckCircle, Loader2, Zap } from "lucide-react"
import { useAccount } from "wagmi"
import { parseUnits } from "viem"
import {
  useApproveWBTC,
  useDepositCollateral,
  useUserCollateralBalance
} from "@/lib/hooks/useContracts"
import { useTokenAllowance } from "@/lib/hooks/useTokenAllowance"
import { contractAddresses, AVALANCHE_FUJI_CHAIN_ID } from "@/lib/config"
import { toast } from "sonner"
import { LightningDeposit } from "@/components/lightning-deposit"

interface DepositModalProps {
  onClose: () => void
  btcPrice: number
  currentCollateral: number
  availableWbtc: number
}

export function DepositModal({ onClose, btcPrice, currentCollateral, availableWbtc }: DepositModalProps) {
  const [depositAmount, setDepositAmount] = useState("0.1")
  const [step, setStep] = useState<number>(1)
  const [depositMethod, setDepositMethod] = useState<'traditional' | 'lightning'>('traditional')
  const [showLightningModal, setShowLightningModal] = useState(false)
  const { address } = useAccount()

  // Token allowance
  const { allowance, hasAllowance, isLoading: isAllowanceLoading } = useTokenAllowance(
    'WBTC',
    address,
    contractAddresses[AVALANCHE_FUJI_CHAIN_ID].BitPesaLending as string
  )

  // Approve WBTC
  const { approve: approveWbtc, isPending: isApproving, isSuccess: isApproved, isConfirming: isApproveConfirming } = useApproveWBTC()

  // Deposit collateral
  const { deposit, isPending: isDepositing, isSuccess: isDeposited, isConfirming: isDepositConfirming } = useDepositCollateral()

  // Check if user has enough allowance for the deposit
  const hasEnoughAllowance = () => {
    if (!depositAmount || isNaN(Number(depositAmount))) return false
    return hasAllowance(parseUnits(depositAmount, 8))
  }

  // Handle approving WBTC
  const handleApprove = async () => {
    try {
      await approveWbtc(depositAmount)
      toast.success("Approval initiated. Please confirm the transaction.")
    } catch (error) {
      console.error("Failed to approve WBTC:", error)
      toast.error("Failed to approve WBTC")
    }
  }

  // Handle depositing WBTC
  const handleDeposit = async () => {
    try {
      await deposit(depositAmount)
      toast.success("Deposit initiated. Please confirm the transaction.")
    } catch (error) {
      console.error("Failed to deposit WBTC:", error)
      toast.error("Failed to deposit WBTC")
    }
  }

  // Handle step completion
  useEffect(() => {
    if (isApproved) {
      toast.success("WBTC approved successfully!")
      setStep(2)
    }
    if (isDeposited) {
      toast.success("Collateral deposited successfully!")
      onClose()
    }
  }, [isApproved, isDeposited, onClose])

  // Validate deposit amount
  const isValid = Number(depositAmount) > 0 && Number(depositAmount) <= availableWbtc

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <Card className="w-full max-w-lg bg-background border max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center">
            <Bitcoin className="h-6 w-6 text-orange-500 mr-2" />
            Deposit BTC Collateral
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isApproving || isDepositing}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={depositMethod} onValueChange={(value) => setDepositMethod(value as 'traditional' | 'lightning')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="traditional" className="flex items-center gap-2">
                <Bitcoin className="h-4 w-4" />
                Traditional
              </TabsTrigger>
              <TabsTrigger value="lightning" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Lightning
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="traditional" className="space-y-4">
              {step === 1 && (
                <>
                  <div>
                    <Label htmlFor="amount" className="text-slate-300">
                      Amount to Deposit
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="bg-slate-800 border-slate-700 text-white mt-1"
                      placeholder="0.00"
                      max={availableWbtc}
                    />
                    <p className="text-slate-400 text-sm mt-1">
                      ≈ ${(Number.parseFloat(depositAmount) * btcPrice).toLocaleString()} USD
                    </p>
                    {Number(depositAmount) > availableWbtc && (
                      <p className="text-red-400 text-xs mt-1">
                        Insufficient WBTC balance
                      </p>
                    )}
                  </div>

                  <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                    <p className="text-slate-300 text-sm">Available WBTC Balance</p>
                    <p className="text-white text-xl font-bold">{availableWbtc.toFixed(8)} WBTC</p>
                  </div>

                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-300">Current Collateral:</span>
                        <span className="text-white font-medium">{currentCollateral.toFixed(8)} BTC</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">New Collateral:</span>
                        <span className="text-white font-medium">
                          {(currentCollateral + Number.parseFloat(depositAmount || "0")).toFixed(8)} BTC
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-slate-700 pt-3">
                        <span className="text-slate-300">Collateral Value:</span>
                        <span className="text-white font-medium">
                          ${((currentCollateral + Number.parseFloat(depositAmount || "0")) * btcPrice).toLocaleString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {hasEnoughAllowance() ? (
                    <Button
                      className="w-full bg-orange-500 hover:bg-orange-600"
                      onClick={handleDeposit}
                      disabled={!isValid || isDepositing || isDepositConfirming}
                    >
                      {isDepositing || isDepositConfirming ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          {isDepositing ? "Waiting for approval" : "Depositing..."}
                        </>
                      ) : (
                        "Deposit Collateral"
                      )}
                    </Button>
                  ) : (
                    <Button
                      className="w-full bg-blue-500 hover:bg-blue-600"
                      onClick={handleApprove}
                      disabled={!isValid || isApproving || isApproveConfirming}
                    >
                      {isApproving || isApproveConfirming ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          {isApproving ? "Awaiting approval" : "Approving..."}
                        </>
                      ) : (
                        "Approve WBTC"
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
                        <span className="text-slate-400">Amount:</span>
                        <span className="text-white">{depositAmount} WBTC</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">USD Value:</span>
                        <span className="text-white">${(Number(depositAmount) * btcPrice).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                    <h4 className="text-yellow-400 font-medium mb-2">Important Notes</h4>
                    <ul className="text-yellow-300 text-sm space-y-1">
                      <li>• WBTC has been approved for deposit</li>
                      <li>• Click deposit to confirm your transaction</li>
                      <li>• You can withdraw your collateral at any time</li>
                      <li>• Your collateral earns no interest while deposited</li>
                    </ul>
                  </div>

                  <Button
                    className="w-full bg-green-500 hover:bg-green-600"
                    onClick={handleDeposit}
                    disabled={isDepositing || isDepositConfirming}
                  >
                    {isDepositing || isDepositConfirming ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        {isDepositing ? "Waiting for approval" : "Depositing..."}
                      </>
                    ) : (
                      "Deposit Collateral"
                    )}
                  </Button>
                </>
              )}
            </TabsContent>
            
            <TabsContent value="lightning" className="space-y-4">
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <h4 className="text-yellow-400 font-medium">Lightning Deposit</h4>
                </div>
                <p className="text-yellow-300/80 text-sm">
                  Pay via Lightning Network and receive WBTC collateral credit instantly.
                </p>
              </div>
              
              <Button
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                onClick={() => setShowLightningModal(true)}
              >
                <Zap className="h-4 w-4 mr-2" />
                Use Lightning Deposit
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Lightning Deposit Modal */}
      {showLightningModal && (
        <LightningDeposit
          onClose={() => setShowLightningModal(false)}
          onSuccess={(amount) => {
            setShowLightningModal(false);
            onClose();
            toast.success(`Successfully deposited ${amount} WBTC via Lightning!`);
          }}
        />
      )}
    </div>
  )
}
