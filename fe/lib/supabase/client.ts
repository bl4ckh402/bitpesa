import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Define transaction types
export enum TransactionType {
  LOAN_CREATED = 'LOAN_CREATED',
  LOAN_REPAID = 'LOAN_REPAID',
  COLLATERAL_DEPOSITED = 'COLLATERAL_DEPOSITED',
  COLLATERAL_WITHDRAWN = 'COLLATERAL_WITHDRAWN',
  MPESA_DISBURSEMENT_INITIATED = 'MPESA_DISBURSEMENT_INITIATED',
  MPESA_DISBURSEMENT_COMPLETED = 'MPESA_DISBURSEMENT_COMPLETED',
  MPESA_DISBURSEMENT_FAILED = 'MPESA_DISBURSEMENT_FAILED',
}

// Type for the transaction data
export interface Transaction {
  user_address: string;
  transaction_type: TransactionType;
  amount: string;
  token_symbol: string;
  token_decimals: number;
  tx_hash?: string;
  block_timestamp?: number;
  loan_id?: number;
  interest_rate?: number;
  loan_duration_days?: number;
  metadata?: Record<string, any>;
  id?: string; // Supabase generated UUID
}

// Type for M-Pesa specific metadata
export interface MpesaMetadata {
  phone_number: string;
  mpesa_conversation_id?: string;
  mpesa_originator_conversation_id?: string;
  mpesa_response_description?: string;
  mpesa_result_code?: string;
  mpesa_transaction_id?: string;
  local_currency_amount?: number;
  exchange_rate?: number;
}

// Functions to store different transaction types
export const storeTransaction = async (transaction: Transaction): Promise<Transaction | null> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        ...transaction,
        created_at: new Date().toISOString(),
      }])
      .select();

    if (error) {
      console.error('Error storing transaction:', error);
      throw error;
    }

    console.log('Transaction stored successfully:', data);
    return data?.[0] as Transaction || null;
  } catch (err) {
    console.error('Failed to store transaction:', err);
    return null;
  }
};

// Get a transaction by ID
export const getTransactionById = async (id: string): Promise<Transaction | null> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching transaction:', error);
      return null;
    }

    return data as Transaction;
  } catch (err) {
    console.error('Failed to fetch transaction:', err);
    return null;
  }
};

// Get transactions by loan ID
export const getTransactionsByLoanId = async (loanId: number): Promise<Transaction[]> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('loan_id', loanId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }

    return data as Transaction[];
  } catch (err) {
    console.error('Failed to fetch transactions:', err);
    return [];
  }
};

// Update transaction with M-Pesa information
export const updateTransactionWithMpesaInfo = async (
  transactionId: string, 
  mpesaInfo: Partial<MpesaMetadata>
): Promise<Transaction | null> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .update({
        metadata: supabase.rpc('jsonb_merge', { 
          a: supabase.rpc('get_metadata', { row_id: transactionId }),
          b: mpesaInfo
        })
      })
      .eq('id', transactionId)
      .select();

    if (error) {
      console.error('Error updating transaction with M-Pesa info:', error);
      return null;
    }

    return data?.[0] as Transaction || null;
  } catch (err) {
    console.error('Failed to update transaction:', err);
    return null;
  }
};

// Add M-Pesa disbursement transaction
export const addMpesaDisbursementTransaction = async (
  originalTransactionId: string,
  transactionType: TransactionType.MPESA_DISBURSEMENT_INITIATED | TransactionType.MPESA_DISBURSEMENT_COMPLETED | TransactionType.MPESA_DISBURSEMENT_FAILED,
  mpesaInfo: Partial<MpesaMetadata>
): Promise<Transaction | null> => {
  try {
    // First get the original transaction
    const originalTransaction = await getTransactionById(originalTransactionId);
    if (!originalTransaction) {
      throw new Error(`Original transaction not found with ID: ${originalTransactionId}`);
    }

    // Create a new transaction record for the M-Pesa disbursement
    return await storeTransaction({
      user_address: originalTransaction.user_address,
      transaction_type: transactionType,
      amount: originalTransaction.amount,
      token_symbol: 'KES', // Change to KES for M-Pesa
      token_decimals: 0, // M-Pesa uses whole numbers
      loan_id: originalTransaction.loan_id,
      metadata: {
        ...mpesaInfo,
        original_transaction_id: originalTransactionId,
      },
    });
  } catch (err) {
    console.error('Failed to add M-Pesa disbursement transaction:', err);
    return null;
  }
};
