import axios from 'axios';
import * as crypto from 'crypto';

// Daraja API configuration
interface MpesaConfig {
  consumerKey: string;
  consumerSecret: string;
  baseUrl: string;
  passkey: string;
  shortCode: string;
  initiatorName: string;
  securityCredential: string;
  queueTimeoutUrl: string;
  resultUrl: string;
}

// Load M-Pesa configuration from environment variables
export const mpesaConfig: MpesaConfig = {
  consumerKey: process.env.MPESA_CONSUMER_KEY || '',
  consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
  baseUrl: process.env.MPESA_API_URL || 'https://sandbox.safaricom.co.ke',
  passkey: process.env.MPESA_PASSKEY || '',
  shortCode: process.env.MPESA_SHORT_CODE || '',
  initiatorName: process.env.MPESA_INITIATOR_NAME || '',
  securityCredential: process.env.MPESA_SECURITY_CREDENTIAL || '',
  queueTimeoutUrl: process.env.MPESA_QUEUE_TIMEOUT_URL || '',
  resultUrl: process.env.MPESA_RESULT_URL || '',
};

// Types
export interface MpesaAuthResponse {
  access_token: string;
  expires_in: string;
}

export interface MpesaB2CRequest {
  InitiatorName: string;
  SecurityCredential: string;
  CommandID: string;
  Amount: number;
  PartyA: string;
  PartyB: string;
  Remarks: string;
  QueueTimeOutURL: string;
  ResultURL: string;
  Occasion: string;
}

export interface MpesaB2CResponse {
  ConversationID: string;
  OriginatorConversationID: string;
  ResponseCode: string;
  ResponseDescription: string;
}

export interface MpesaB2CResult {
  Result: {
    ResultType: number;
    ResultCode: number;
    ResultDesc: string;
    OriginatorConversationID: string;
    ConversationID: string;
    TransactionID: string;
    ResultParameters: {
      ResultParameter: Array<{
        Key: string;
        Value: string | number;
      }>;
    };
  };
}

// Get OAuth token
export async function getAccessToken(): Promise<string> {
  try {
    const auth = Buffer.from(`${mpesaConfig.consumerKey}:${mpesaConfig.consumerSecret}`).toString('base64');
    
    const response = await axios({
      method: 'get',
      url: `${mpesaConfig.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });
    
    return response.data.access_token;
  } catch (error) {
    console.error('Failed to get M-Pesa access token:', error);
    throw new Error('Failed to get M-Pesa access token');
  }
}

// Perform B2C payment (Business to Customer)
export async function sendMoneyB2C(
  phoneNumber: string,
  amount: number,
  remarks: string,
  occasion: string = '',
  transactionId?: string,
): Promise<MpesaB2CResponse> {
  try {
    const token = await getAccessToken();
    
    // Format the phone number (remove leading zeroes or country code if needed)
    const formattedPhone = phoneNumber.startsWith('254')
      ? phoneNumber
      : phoneNumber.startsWith('0')
      ? `254${phoneNumber.slice(1)}`
      : phoneNumber;
    
    const requestBody: MpesaB2CRequest = {
      InitiatorName: mpesaConfig.initiatorName,
      SecurityCredential: mpesaConfig.securityCredential,
      CommandID: 'BusinessPayment', // Use 'BusinessPayment' for normal B2C transfers
      Amount: amount,
      PartyA: mpesaConfig.shortCode,
      PartyB: formattedPhone,
      Remarks: remarks,
      QueueTimeOutURL: mpesaConfig.queueTimeoutUrl,
      ResultURL: mpesaConfig.resultUrl,
      Occasion: occasion,
    };
    
    const response = await axios({
      method: 'post',
      url: `${mpesaConfig.baseUrl}/mpesa/b2c/v1/paymentrequest`,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: requestBody,
    });
    
    return response.data;
  } catch (error) {
    console.error('M-Pesa B2C payment failed:', error);
    throw new Error(`M-Pesa B2C payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Check transaction status
export async function checkTransactionStatus(transactionId: string): Promise<any> {
  try {
    const token = await getAccessToken();
    
    const requestBody = {
      Initiator: mpesaConfig.initiatorName,
      SecurityCredential: mpesaConfig.securityCredential,
      CommandID: 'TransactionStatusQuery',
      TransactionID: transactionId,
      PartyA: mpesaConfig.shortCode,
      IdentifierType: '4', // Shortcode
      ResultURL: mpesaConfig.resultUrl,
      QueueTimeOutURL: mpesaConfig.queueTimeoutUrl,
      Remarks: 'Check transaction status',
      Occasion: '',
    };
    
    const response = await axios({
      method: 'post',
      url: `${mpesaConfig.baseUrl}/mpesa/transactionstatus/v1/query`,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: requestBody,
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to check transaction status:', error);
    throw new Error('Failed to check transaction status');
  }
}

// Process B2C callback result
export function processB2CResult(result: MpesaB2CResult): Record<string, any> {
  try {
    const { Result } = result;
    
    // Extract important parameters into a simplified object
    const resultParams = Result.ResultParameters.ResultParameter.reduce(
      (acc, param) => ({
        ...acc,
        [param.Key]: param.Value,
      }),
      {}
    );
    
    return {
      transactionId: Result.TransactionID,
      conversationId: Result.ConversationID,
      originatorConversationId: Result.OriginatorConversationID,
      resultCode: Result.ResultCode,
      resultDesc: Result.ResultDesc,
      ...resultParams,
    };
  } catch (error) {
    console.error('Failed to process B2C result:', error);
    throw new Error('Failed to process B2C result');
  }
}

// Convert KES to USDC based on exchange rate
export function convertKESToUSDC(kesAmount: number, exchangeRate: number): number {
  return Number((kesAmount / exchangeRate).toFixed(6));
}

// Convert USDC to KES based on exchange rate
export function convertUSDCToKES(usdcAmount: number, exchangeRate: number): number {
  return Math.floor(usdcAmount * exchangeRate);
}
