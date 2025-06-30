'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from "sonner"
import { useWeb3 } from '@/lib/providers/web3-provider';
import { formatDistanceToNow } from 'date-fns';
import { 
  useLoanDetails,
  useCalculateInterest,
  useRepayLoan,
  useApproveUSDC
} from '@/lib/hooks/useContracts';

interface LoanCardProps {
  loanId: number;
  onRepay: () => void;
}

function LoanCard({ loanId, onRepay }: LoanCardProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRepaying, setIsRepaying] = useState(false);

  const { loan, isLoading } = useLoanDetails(loanId);
  const { interest } = useCalculateInterest(loanId);
  
  const { 
    approve, 
    isPending: approvalPending, 
    isConfirming: approvalConfirming, 
    isSuccess: approvalSuccess 
  } = useApproveUSDC();
  
  const { 
    repayLoan, 
    isPending: repayPending, 
    isConfirming: repayConfirming, 
    isSuccess: repaySuccess 
  } = useRepayLoan();

  const totalRepaymentAmount = loan ? 
    (parseFloat(loan.loanAmount) + parseFloat(interest)).toFixed(2) : 
    '0';

  const handleApprove = async () => {
    if (!loan) return;
    
    try {
      setIsApproving(true);
      await approve(totalRepaymentAmount);
      toast("Approval initiated");
    } catch (error: any) {
      toast("Approval failed");
    } finally {
      setIsApproving(false);
    }
  };

  const handleRepay = async () => {
    if (!loan) return;
    
    try {
      setIsRepaying(true);
      await repayLoan(loanId, totalRepaymentAmount);
      toast("Repayment initiated");
    } catch (error: any) {
      toast("Repayment failed");
    } finally {
      setIsRepaying(false);
    }
  };

  useEffect(() => {
    if (repaySuccess) {
      toast("Loan repaid successfully");
      onRepay();
    }
  }, [repaySuccess, toast, onRepay]);

  if (isLoading || !loan) {
    return <div className="text-center p-4">Loading loan details...</div>;
  }

  if (!loan.active) {
    return null;
  }

  const startDate = new Date(loan.startTimestamp * 1000);
  const endDate = new Date(loan.endTimestamp * 1000);
  const timeLeft = formatDistanceToNow(endDate, { addSuffix: true });

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Loan #{loan.id}</CardTitle>
          <Badge variant={Date.now() > loan.endTimestamp * 1000 ? "destructive" : "outline"}>
            {Date.now() > loan.endTimestamp * 1000 ? "Expired" : "Active"}
          </Badge>
        </div>
        <CardDescription>
          Created {formatDistanceToNow(startDate, { addSuffix: true })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Collateral</TableCell>
              <TableCell>{parseFloat(loan.collateralAmount).toFixed(8)} WBTC</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Loan Amount</TableCell>
              <TableCell>{parseFloat(loan.loanAmount).toFixed(2)} USDC</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Interest</TableCell>
              <TableCell>{parseFloat(interest).toFixed(2)} USDC</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Total Due</TableCell>
              <TableCell className="font-bold">{totalRepaymentAmount} USDC</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">End Date</TableCell>
              <TableCell>{timeLeft}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        
        <div className="flex flex-col gap-2 mt-4">
          <Button 
            onClick={handleApprove}
            disabled={isApproving || approvalPending || approvalConfirming || repayPending || repayConfirming}
          >
            {isApproving || approvalPending || approvalConfirming ? "Approving..." : "1. Approve USDC"}
          </Button>
          <Button 
            onClick={handleRepay}
            disabled={isRepaying || !approvalSuccess || repayPending || repayConfirming}
            variant="default"
          >
            {isRepaying || repayPending || repayConfirming ? "Repaying..." : "2. Repay Loan"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ActiveLoans() {
  const [loanIds, setLoanIds] = useState<number[]>([]);
  const { isConnected, address } = useWeb3();

  // This would normally come from querying events or indexing service
  // For demo purposes, we'll just show some sample loans
  useEffect(() => {
    if (isConnected && address) {
      // In a real app, we would fetch the user's active loans from an indexer or by parsing events
      // For now, let's pretend the user has these loans
      setLoanIds([1, 2, 3]);
    } else {
      setLoanIds([]);
    }
  }, [isConnected, address]);

  const handleLoanRepaid = (repaidLoanId: number) => {
    setLoanIds(prev => prev.filter(id => id !== repaidLoanId));
    toast("Loan removed from list");
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Loans</CardTitle>
          <CardDescription>Connect your wallet to view your active loans</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Your Active Loans</h2>
      
      {loanIds.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              You don't have any active loans
            </p>
          </CardContent>
        </Card>
      ) : (
        loanIds.map((loanId) => (
          <LoanCard 
            key={loanId} 
            loanId={loanId} 
            onRepay={() => handleLoanRepaid(loanId)} 
          />
        ))
      )}
    </div>
  );
}
