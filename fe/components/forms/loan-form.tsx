'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { toast } from "sonner"
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useWeb3 } from '@/lib/providers/web3-provider';
import { 
  useUserCollateralBalance,
  useGetBtcUsdPrice,
  useRequiredCollateralRatio,
  useCreateLoan
} from '@/lib/hooks/useContracts';

const formSchema = z.object({
  collateralAmount: z.string()
    .refine(val => !isNaN(Number(val)), {
      message: "Collateral amount must be a number",
    })
    .refine(val => Number(val) > 0, {
      message: "Collateral amount must be greater than zero",
    }),
  loanAmount: z.string()
    .refine(val => !isNaN(Number(val)), {
      message: "Loan amount must be a number",
    })
    .refine(val => Number(val) > 0, {
      message: "Loan amount must be greater than zero",
    }),
  durationDays: z.number().int().min(1).max(30),
});

export default function LoanForm() {
  const { isConnected, isCorrectNetwork, switchToFujiNetwork, btcPrice } = useWeb3();
  
  const { 
    balance: collateralBalance, 
    isLoading: balanceLoading 
  } = useUserCollateralBalance();

  const { ratio: requiredCollateralRatio } = useRequiredCollateralRatio();

  const { 
    createLoan, 
    isPending, 
    isConfirming, 
    isSuccess,
    error
  } = useCreateLoan();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      collateralAmount: "",
      loanAmount: "",
      durationDays: 7,
    },
  });

  const { watch, setValue } = form;
  const collateralAmount = watch("collateralAmount");
  const loanAmount = watch("loanAmount");

  // Calculate max loan based on collateral and price
  useEffect(() => {
    if (collateralAmount && btcPrice && requiredCollateralRatio) {
      const collateralValue = Number(collateralAmount) * btcPrice;
      const maxLoan = (collateralValue * 100 / requiredCollateralRatio);
      setValue("loanAmount", maxLoan.toFixed(2));
    }
  }, [collateralAmount, btcPrice, requiredCollateralRatio, setValue]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!isConnected) {
      toast("Wallet not connected");
      return;
    }

    if (!isCorrectNetwork) {
      toast("Wrong network");
      await switchToFujiNetwork();
      return;
    }

    if (Number(values.collateralAmount) > Number(collateralBalance)) {
      toast("Insufficient collateral");
      return;
    }

    try {
      await createLoan(
        values.collateralAmount,
        values.loanAmount,
        values.durationDays
      );
      
      toast("Loan creation initiated");
    } catch (err: any) {
      toast("Loan creation failed");
    }
  }

  // Success notification
  useEffect(() => {
    if (isSuccess) {
      toast("Loan created successfully");
      form.reset();
    }
  }, [isSuccess, toast, form]);

  // Error notification
  useEffect(() => {
    if (error) {
      toast("Loan creation failed");
    }
  }, [error]);
        

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create Loan</CardTitle>
        <CardDescription>
          Use your WBTC collateral to take out a stablecoin loan
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="collateralAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Collateral Amount (WBTC)</FormLabel>
                  <FormControl>
                    <Input placeholder="0.01" {...field} />
                  </FormControl>
                  <FormDescription>
                    Available: {parseFloat(collateralBalance).toFixed(8)} WBTC
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="loanAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loan Amount (USDC)</FormLabel>
                  <FormControl>
                    <Input placeholder="1000" {...field} />
                  </FormControl>
                  <FormDescription>
                    {btcPrice && collateralAmount ? 
                      `Maximum loan: ${((Number(collateralAmount) * btcPrice * 100) / requiredCollateralRatio).toFixed(2)} USDC` : 
                      "Enter collateral amount to calculate max loan"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="durationDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loan Duration: {field.value} days</FormLabel>
                  <FormControl>
                    <Slider
                      min={1}
                      max={30}
                      step={1}
                      value={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                    />
                  </FormControl>
                  <FormDescription>
                    Select loan duration (1-30 days)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit"
              className="w-full"
              disabled={isPending || isConfirming}
            >
              {isPending || isConfirming ? "Creating Loan..." : "Create Loan"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
