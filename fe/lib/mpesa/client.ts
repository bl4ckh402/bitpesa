import axios from 'axios';

// Environment variables for M-Pesa API
const MPESA_CONSUMER_KEY = process.env.NEXT_PUBLIC_MPESA_CONSUMER_KEY || '';
const MPESA_CONSUMER_SECRET = process.env.NEXT_PUBLIC_MPESA_CONSUMER_SECRET || '';
const MPESA_BASE_URL = process.env.NEXT_PUBLIC_MPESA_BASE_URL || 'https://sandbox.safaricom.co.ke';
const MPESA_B2C_SHORTCODE = process.env.NEXT_PUBLIC_MPESA_B2C_SHORTCODE || '';
const MPESA_INITIATOR_NAME = process.env.NEXT_PUBLIC_MPESA_INITIATOR_NAME || '';
const MPESA_SECURITY_CREDENTIAL = process.env.NEXT_PUBLIC_MPESA_SECURITY_CREDENTIAL || '';
const MPESA_QUEUE_TIMEOUT_URL = process.env.NEXT_PUBLIC_MPESA_QUEUE_TIMEOUT_URL || '';
const MPESA_RESULT_URL = process.env.NEXT_PUBLIC_MPESA_RESULT_URL || '';

// Define the command IDs for B2C transactions
export enum CommandID {
  BUSINESS_PAYMENT = 'BusinessPayment',
  SALARY_PAYMENT = 'SalaryPayment',
  PROMOTION_PAYMENT = 'PromotionPayment',
}

// Interfaces for M-Pesa API responses and requests
export interface MpesaAuthResponse {
  access_token: string;
  expires_in: string;
}

export interface MpesaB2CRequest {
  OriginatorConversationID: string;
  InitiatorName: string;
  SecurityCredential: string;
  CommandID: CommandID;
  Amount: number;
  PartyA: number;
  PartyB: number;
  Remarks: string;
  QueueTimeOutURL: string;
  ResultURL: string;
  Occasion?: string;
}

export interface MpesaB2CResponse {
  ConversationID: string;
  OriginatorConversationID: string;
  ResponseCode: string;
  ResponseDescription: string;
}

// Helper function to generate UUID for conversation IDs
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Class for handling M-Pesa API calls
export class MpesaApiClient {
  private accessToken: string = '';
  private tokenExpiry: number = 0;

  // Get OAuth token for API calls
  async getAccessToken(): Promise<string> {
    // If token is still valid, return it
    if (this.accessToken && this.tokenExpiry > Date.now()) {
      return this.accessToken;
    }

    try {
      // Create base64 encoded auth string
      const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
      
      const response = await axios({
        method: 'get',
        url: `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
        headers: {
          'Authorization': `Basic ${auth}`
        }
      });

      // Set token and expiry time (subtract 5 minutes for safety)
      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (parseInt(response.data.expires_in) * 1000) - 300000;
      
      return this.accessToken;
    } catch (error) {
      console.error('Error getting M-Pesa access token:', error);
      throw new Error('Failed to get M-Pesa access token');
    }
  }

  // Make B2C payment
  async sendB2CPayment(
    phoneNumber: string, 
    amount: number, 
    remarks: string = 'BitPesa Loan Disbursement',
    occasion: string = 'Loan',
    commandId: CommandID = CommandID.BUSINESS_PAYMENT
  ): Promise<MpesaB2CResponse> {
    try {
      const token = await this.getAccessToken();
      
      // Format phone number to required format (remove + if present)
      const formattedPhone = phoneNumber.startsWith('+') ? 
        phoneNumber.substring(1) : phoneNumber;
      
      // Create B2C request payload
      const payload: MpesaB2CRequest = {
        OriginatorConversationID: generateUUID(),
        InitiatorName: MPESA_INITIATOR_NAME,
        SecurityCredential: MPESA_SECURITY_CREDENTIAL,
        CommandID: commandId,
        Amount: amount,
        PartyA: parseInt(MPESA_B2C_SHORTCODE),
        PartyB: parseInt(formattedPhone),
        Remarks: remarks,
        QueueTimeOutURL: MPESA_QUEUE_TIMEOUT_URL,
        ResultURL: MPESA_RESULT_URL,
        Occasion: occasion,
      };

      const response = await axios({
        method: 'post',
        url: `${MPESA_BASE_URL}/mpesa/b2c/v3/paymentrequest`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        data: payload
      });

      return response.data as MpesaB2CResponse;
    } catch (error) {
      console.error('Error sending B2C payment:', error);
      throw new Error('Failed to send B2C payment');
    }
  }
}

// Create and export singleton instance
export const mpesaClient = new MpesaApiClient();
