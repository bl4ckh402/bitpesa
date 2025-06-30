import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface MpesaDisbursementProps {
  transactionId: string;
  loanId?: number;
  amount: string;
  tokenSymbol: string;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  showSuccessMessage?: boolean;
}

export function MpesaDisbursement({
  transactionId,
  loanId,
  amount,
  tokenSymbol,
  onSuccess,
  onError,
  showSuccessMessage = true,
}: MpesaDisbursementProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mpesaResponse, setMpesaResponse] = useState<any>(null);

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove any non-digit characters
    const cleaned = e.target.value.replace(/\D/g, '');
    setPhoneNumber(cleaned);
  };

  const formatPhoneNumber = (phone: string) => {
    // Format phone number to Kenyan format (254XXXXXXXXX)
    if (phone.startsWith('254')) {
      return phone;
    }
    
    if (phone.startsWith('0')) {
      return `254${phone.slice(1)}`;
    }
    
    if (phone.startsWith('+254')) {
      return phone.slice(1);
    }
    
    // If it's just 9 digits (without prefix), add 254
    if (phone.length === 9) {
      return `254${phone}`;
    }
    
    return phone;
  };

  const validatePhoneNumber = (phone: string) => {
    // Basic validation for Kenyan phone numbers
    const formattedPhone = formatPhoneNumber(phone);
    
    // Should be 12 digits for Kenya (254XXXXXXXXX)
    if (formattedPhone.length !== 12) {
      return false;
    }
    
    // Should start with 254
    if (!formattedPhone.startsWith('254')) {
      return false;
    }
    
    return true;
  };

  const handleDisbursement = async () => {
    // Clear previous states
    setError(null);
    setSuccess(false);
    setMpesaResponse(null);
    
    // Validate phone number
    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid Kenyan phone number');
      return;
    }
    
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    try {
      setLoading(true);
      
      // Call the API endpoint to initiate M-Pesa disbursement
      const response = await fetch('/api/mpesa/disburse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId,
          phoneNumber: formattedPhone,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process M-Pesa disbursement');
      }
      
      // Handle success
      setSuccess(true);
      setMpesaResponse(data);
      
      if (onSuccess) {
        onSuccess(data);
      }
      
    } catch (err) {
      // Handle error
      const errorMessage = err instanceof Error ? err.message : 'Failed to process M-Pesa disbursement';
      setError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>M-Pesa Disbursement</CardTitle>
        <CardDescription>
          Enter your M-Pesa number to receive {amount} {tokenSymbol} (KES equivalent)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && showSuccessMessage && (
          <Alert variant="default" className="mb-4 bg-green-50 border-green-200">
            <AlertTitle>Disbursement Initiated</AlertTitle>
            <AlertDescription>
              M-Pesa disbursement has been initiated successfully. You will receive the funds shortly.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              placeholder="e.g. 0712345678 or 254712345678"
              value={phoneNumber}
              onChange={handlePhoneNumberChange}
              disabled={loading || success}
            />
            <p className="text-sm text-gray-500">
              Enter your phone number with or without the country code
            </p>
          </div>
          
          {mpesaResponse && (
            <div className="text-sm mt-4 p-3 bg-gray-50 rounded-md">
              <p><strong>Transaction ID:</strong> {transactionId}</p>
              <p><strong>M-Pesa Conversation ID:</strong> {mpesaResponse?.data?.conversationId}</p>
              <p><strong>Status:</strong> {mpesaResponse?.data?.responseDescription || 'Processing'}</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleDisbursement}
          disabled={loading || success || !phoneNumber}
          className="w-full"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? 'Processing...' : success ? 'Disbursed' : 'Receive via M-Pesa'}
        </Button>
      </CardFooter>
    </Card>
  );
}
