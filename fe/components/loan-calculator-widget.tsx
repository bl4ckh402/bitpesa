'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useBitPesa } from "@/lib/hooks/useBitPesa";

export function LoanCalculator() {  const [collateralAmount, setCollateralAmount] = useState<number>(0.01);
  const [loanAmount, setLoanAmount] = useState<number>(0);
  const { btcPrice, contractHooks } = useBitPesa();
  
  const { ratio: requiredCollateralRatio } = contractHooks.useRequiredCollateralRatio();
  const collateralRatio = requiredCollateralRatio || 150;
  
  // Calculate max loan amount based on collateral
  useEffect(() => {
    if (btcPrice && collateralRatio) {
      const collateralValueUsd = collateralAmount * btcPrice;
      const maxLoan = collateralValueUsd * (100 / collateralRatio);
      setLoanAmount(parseFloat(maxLoan.toFixed(2)));
    }
  }, [collateralAmount, btcPrice, collateralRatio]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Loan Calculator</CardTitle>
        <CardDescription>Calculate loan limits based on your collateral</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>WBTC Collateral</Label>
              <span className="text-muted-foreground">{collateralAmount} BTC</span>
            </div>
            <Slider
              value={[collateralAmount]}
              min={0.01}
              max={1}
              step={0.01}
              onValueChange={(values) => setCollateralAmount(values[0])}
            />
          </div>
          
          <div className="space-y-1">
            <Label>Collateral Value</Label>
            <div className="text-2xl font-bold">
              ${btcPrice ? (collateralAmount * btcPrice).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0.00'}
            </div>
          </div>
          
          <div className="space-y-1">
            <Label>Maximum Loan Amount</Label>
            <div className="text-2xl font-bold text-green-600">
              ${loanAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Based on {collateralRatio}% required collateralization ratio
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
