import React, { useState } from 'react';
import { MpesaDisbursement } from './mpesa-disbursement';
import { MpesaTransactionHistory } from './mpesa-transaction-history';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MpesaPaymentProps {
  transactionId: string;
  loanId?: number;
  amount: string;
  tokenSymbol: string;
}

export function MpesaPayment({
  transactionId,
  loanId,
  amount,
  tokenSymbol,
}: MpesaPaymentProps) {
  const [activeTab, setActiveTab] = useState('disburse');
  const [disbursementSuccess, setDisbursementSuccess] = useState(false);

  const handleDisbursementSuccess = (data: any) => {
    setDisbursementSuccess(true);
    // After successful disbursement, switch to history tab after a short delay
    setTimeout(() => {
      setActiveTab('history');
    }, 2000);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>M-Pesa Payment</CardTitle>
        <CardDescription>
          Send loan proceeds to your M-Pesa account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="disburse">Disburse Funds</TabsTrigger>
            <TabsTrigger value="history">Transaction History</TabsTrigger>
          </TabsList>
          <TabsContent value="disburse">
            <div className="mt-4">
              <MpesaDisbursement
                transactionId={transactionId}
                loanId={loanId}
                amount={amount}
                tokenSymbol={tokenSymbol}
                onSuccess={handleDisbursementSuccess}
                showSuccessMessage={true}
              />
            </div>
          </TabsContent>
          <TabsContent value="history">
            <div className="mt-4">
              <MpesaTransactionHistory
                loanId={loanId}
                refreshInterval={disbursementSuccess ? 5000 : 0} // Refresh every 5 seconds if a disbursement was just made
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
