"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { X, Bitcoin, Copy, QrCode, CheckCircle } from "lucide-react"

interface DepositModalProps {
  onClose: () => void
}

export function DepositModal({ onClose }: DepositModalProps) {
  const [depositAmount, setDepositAmount] = useState("0.5")
  const [step, setStep] = useState(1)
  const [copied, setCopied] = useState(false)

  const depositAddress = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
  const btcPrice = 45000

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(depositAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <Card className="w-full max-w-lg bg-background border max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center">
            <Bitcoin className="h-6 w-6 text-orange-500 mr-2" />
            Deposit BTC Collateral
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
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
                />
                <p className="text-slate-400 text-sm mt-1">
                  ≈ ${(Number.parseFloat(depositAmount) * btcPrice).toLocaleString()} USD
                </p>
              </div>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Current Collateral:</span>
                    <span className="text-white font-medium">2.5 BTC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">New Collateral:</span>
                    <span className="text-white font-medium">
                      {(2.5 + Number.parseFloat(depositAmount)).toFixed(2)} BTC
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-700 pt-3">
                    <span className="text-slate-300">Health Ratio:</span>
                    <Badge className="bg-green-500/20 text-green-400">Improved</Badge>
                  </div>
                </CardContent>
              </Card>

              <Button
                className="w-full bg-orange-500 hover:bg-orange-600"
                onClick={() => setStep(2)}
                disabled={!depositAmount || Number.parseFloat(depositAmount) <= 0}
              >
                Continue
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="text-center">
                <div className="bg-slate-800 p-4 rounded-lg mb-4">
                  <QrCode className="h-32 w-32 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-300 text-sm">Scan QR code or copy address below</p>
                </div>

                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <Label className="text-slate-300 text-sm">Deposit Address</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <code className="flex-1 bg-slate-900 p-2 rounded text-xs text-white font-mono break-all">
                      {depositAddress}
                    </code>
                    <Button size="sm" variant="outline" onClick={handleCopyAddress} className="border-slate-600">
                      {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <h4 className="text-yellow-400 font-medium mb-2">Important Notes</h4>
                <ul className="text-yellow-300 text-sm space-y-1">
                  <li>• Send exactly {depositAmount} BTC to this address</li>
                  <li>• Minimum 3 confirmations required</li>
                  <li>• Do not send from exchange wallets</li>
                  <li>• This address expires in 24 hours</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:space-x-4">
                <Button variant="outline" className="flex-1 border-slate-600" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button className="flex-1 bg-green-500 hover:bg-green-600" onClick={onClose}>
                  I've Sent BTC
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
