import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { TransactionType } from '@/lib/supabase/client';

interface MpesaTransactionHistoryProps {
  loanId?: number;
  transactionId?: string;
  refreshInterval?: number;
}

export function MpesaTransactionHistory({
  loanId,
  transactionId,
  refreshInterval = 0, // Set to 0 to disable auto-refresh
}: MpesaTransactionHistoryProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      // Build the query parameters
      let queryParams = '';
      if (loanId) {
        queryParams = `loanId=${loanId}`;
      } else if (transactionId) {
        queryParams = `transactionId=${transactionId}`;
      } else {
        throw new Error('Either loanId or transactionId must be provided');
      }
      
      // Fetch transactions from API
      const response = await fetch(`/api/mpesa/status?${queryParams}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch M-Pesa transactions');
      }
      
      // Set transactions
      if (loanId) {
        setTransactions(data.transactions || []);
      } else {
        setTransactions(data.transaction ? [data.transaction] : []);
      }
      
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch M-Pesa transactions';
      setError(errorMessage);
      console.error('Error fetching M-Pesa transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch transactions on mount
  useEffect(() => {
    fetchTransactions();
    
    // Set up refresh interval if specified
    let intervalId: NodeJS.Timeout | null = null;
    if (refreshInterval > 0) {
      intervalId = setInterval(() => {
        fetchTransactions();
      }, refreshInterval);
    }
    
    // Clean up interval on component unmount
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [loanId, transactionId, refreshInterval]);

  const getStatusBadge = (type: TransactionType) => {
    switch (type) {
      case TransactionType.MPESA_DISBURSEMENT_INITIATED:
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case TransactionType.MPESA_DISBURSEMENT_COMPLETED:
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      case TransactionType.MPESA_DISBURSEMENT_FAILED:
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>M-Pesa Transaction History</CardTitle>
        <CardDescription>
          {loanId ? `M-Pesa transactions for loan #${loanId}` : 'Transaction details'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="p-4 text-red-500 bg-red-50 rounded-md">
            {error}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No M-Pesa transactions found
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx, index) => (
              <div key={tx.id || index} className="border rounded-md p-4">
                <div className="flex flex-wrap justify-between mb-2">
                  <div>
                    <span className="font-medium">{tx.transaction_type.replace('MPESA_', '').replace('_', ' ')}</span>
                    {getStatusBadge(tx.transaction_type)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {tx.created_at && formatDate(tx.created_at)}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Amount:</span> {tx.amount} {tx.token_symbol}
                  </div>
                  
                  {tx.metadata?.phone_number && (
                    <div>
                      <span className="text-gray-500">Phone Number:</span> {tx.metadata.phone_number}
                    </div>
                  )}
                  
                  {tx.metadata?.mpesa_conversation_id && (
                    <div>
                      <span className="text-gray-500">Conversation ID:</span> {tx.metadata.mpesa_conversation_id}
                    </div>
                  )}
                  
                  {tx.metadata?.mpesa_transaction_id && (
                    <div>
                      <span className="text-gray-500">M-Pesa Transaction ID:</span> {tx.metadata.mpesa_transaction_id}
                    </div>
                  )}
                  
                  {tx.metadata?.mpesa_response_description && (
                    <div>
                      <span className="text-gray-500">Response:</span> {tx.metadata.mpesa_response_description}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
