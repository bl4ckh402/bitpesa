import { mpesaClient, CommandID } from './client';
import { 
  Transaction, 
  TransactionType,
  getTransactionById,
  addMpesaDisbursementTransaction,
  updateTransactionWithMpesaInfo,
  MpesaMetadata 
} from '../supabase/client';
import { ethers } from 'ethers';

// Interface for M-Pesa disbursement results
export interface MpesaDisbursementResult {
  success: boolean;
  conversationId?: string;
  originatorConversationId?: string;
  responseDescription?: string;
  error?: string;
  transactionId?: string;
}

// Interface for loan disbursement request
export interface LoanDisbursementRequest {
  transactionId: string;
  phoneNumber: string;
  exchangeRate?: number;
  remarks?: string;
}

// Convert Kenyan Shillings to loan amount
function convertKesAmountFromUsdc(usdcAmount: string, exchangeRate: number = 130): number {
  // USDC has 18 decimals, convert to number
  const usdcValue = parseFloat(usdcAmount) || 0;
  // Convert USD to KES and return whole number amount (M-Pesa requires integer amounts)
  return Math.round(usdcValue * exchangeRate);
}

// Get phone number from metadata or use a default format based on address
function getPhoneNumber(transaction: Transaction): string {
  // First check if phone number is in the metadata
  if (transaction.metadata?.phone_number) {
    return transaction.metadata.phone_number;
  }
  
  // If no phone number is found, we cannot proceed with M-Pesa payment
  throw new Error("Phone number not found in transaction metadata");
}

// The main function to process M-Pesa disbursement
export async function processMpesaDisbursement(
  transaction: Transaction
): Promise<MpesaDisbursementResult> {
  try {
    // Only process loan creation transactions
    if (transaction.transaction_type !== TransactionType.LOAN_CREATED) {
      return {
        success: false,
        error: 'Transaction is not a loan creation'
      };
    }

    // Get phone number from transaction data
    const phoneNumber = getPhoneNumber(transaction);

    // Convert USDC amount to KES for M-Pesa transfer
    const kesAmount = convertKesAmountFromUsdc(transaction.amount);

    // Generate remarks with loan ID if available
    const remarks = transaction.loan_id 
      ? `BitPesa Loan #${transaction.loan_id} Disbursement`
      : 'BitPesa Loan Disbursement';

    // Send M-Pesa payment
    const response = await mpesaClient.sendB2CPayment(
      phoneNumber,
      kesAmount,
      remarks,
      'Loan Disbursement',
      CommandID.BUSINESS_PAYMENT
    );

    // Return success response
    return {
      success: true,
      conversationId: response.ConversationID,
      originatorConversationId: response.OriginatorConversationID,
      responseDescription: response.ResponseDescription
    };
  } catch (error) {
    console.error('Error processing M-Pesa disbursement:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
