'use client';

interface SpeedPaymentRequest {
  currency: string;
  amount: number;
  target_currency: string;
  payment_methods: string[];
  metadata?: Record<string, any>;
  ttl?: number;
}

interface SpeedPaymentResponse {
  id: string;
  object: string;
  status: 'unpaid' | 'paid' | 'expired' | 'cancelled';
  currency: string;
  amount: number;
  exchange_rate: number;
  target_currency: string;
  target_amount: number;
  target_amount_paid?: number;
  target_amount_paid_at?: number;
  ttl: number;
  expires_at: number;
  payment_request?: string;
  payment_method_options: {
    lightning?: {
      id: string;
      payment_request: string;
    };
    on_chain?: {
      id: string;
      address: string;
    };
  };
  metadata?: Record<string, any>;
  created: number;
  modified: number;
}

interface LightningDepositRequest {
  amount: string; // Amount in BTC/WBTC
  userAddress: string;
  collateralType: 'WBTC' | 'BTC';
  metadata?: Record<string, any>;
}

interface LightningDepositResponse {
  paymentId: string;
  lightningInvoice: string;
  qrCode: string;
  expiresAt: number;
  amount: number;
  targetAmount: number;
  status: string;
}

class LightningService {
  private apiKey: string;
  private baseUrl: string;
  private apiVersion: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_SPEED_API_KEY || '';
    this.baseUrl = process.env.NEXT_PUBLIC_SPEED_API_URL || 'https://api.tryspeed.com';
    this.apiVersion = '2022-10-15';
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    body?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${btoa(this.apiKey + ':')}`,
      'speed-version': this.apiVersion,
    };

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Speed API Error: ${response.status} - ${errorData.message || response.statusText}`);
    }

    return response.json();
  }

  async createLightningDepositPayment(request: LightningDepositRequest): Promise<LightningDepositResponse> {
    try {
      // Convert WBTC amount to USD for payment creation
      // You might want to get current BTC price here
      const btcPriceUSD = await this.getBtcPrice();
      const amountInUSD = parseFloat(request.amount) * btcPriceUSD;

      const paymentRequest: SpeedPaymentRequest = {
        currency: 'USD',
        amount: amountInUSD,
        target_currency: 'SATS',
        payment_methods: ['lightning'],
        ttl: 1800, // 30 minutes
        metadata: {
          type: 'collateral_deposit',
          user_address: request.userAddress,
          collateral_type: request.collateralType,
          original_amount: request.amount,
          ...request.metadata,
        },
      };

      const payment = await this.makeRequest<SpeedPaymentResponse>('/payments', 'POST', paymentRequest);

      const lightningOptions = payment.payment_method_options.lightning;
      if (!lightningOptions) {
        throw new Error('Lightning payment method not available');
      }

      // Generate QR code data URL
      const qrCode = await this.generateQrCode(lightningOptions.payment_request);

      return {
        paymentId: payment.id,
        lightningInvoice: lightningOptions.payment_request,
        qrCode,
        expiresAt: payment.expires_at,
        amount: payment.amount,
        targetAmount: payment.target_amount,
        status: payment.status,
      };
    } catch (error) {
      console.error('Error creating Lightning deposit payment:', error);
      throw error;
    }
  }

  async checkPaymentStatus(paymentId: string): Promise<SpeedPaymentResponse> {
    return this.makeRequest<SpeedPaymentResponse>(`/payments/${paymentId}`);
  }

  async listRecentPayments(limit: number = 10): Promise<{ data: SpeedPaymentResponse[] }> {
    return this.makeRequest<{ data: SpeedPaymentResponse[] }>(`/payments?limit=${limit}`);
  }

  private async getBtcPrice(): Promise<number> {
    // You can integrate with a price service or use your existing price feed
    // For now, returning a placeholder
    try {
      const response = await fetch('https://api.coindesk.com/v1/bpi/currentprice.json');
      const data = await response.json();
      return parseFloat(data.bpi.USD.rate.replace(',', ''));
    } catch {
      return 50000; // Fallback price
    }
  }

  private async generateQrCode(data: string): Promise<string> {
    // Generate QR code for Lightning invoice
    try {
      // Import the QR code generator
      const { QRCodeGenerator } = await import('../utils/qr-code');
      return QRCodeGenerator.generateDataURL(data, 200);
    } catch {
      return '';
    }
  }

  // Webhook verification
  async verifyWebhookSignature(
    payload: string,
    signature: string,
    timestamp: string,
    webhookId: string,
    secret: string
  ): Promise<boolean> {
    try {
      // Remove the version prefix (e.g., "v1,")
      const cleanSignature = signature.split(',')[1] || signature;
      
      // Prepare the signed payload string
      const signedPayload = `${webhookId}.${timestamp}.${payload}`;
      
      // Extract secret without prefix
      const cleanSecret = secret.startsWith('wsec_') ? secret.slice(5) : secret;
      
      // Convert secret from base64
      const secretBytes = atob(cleanSecret);
      const key = new TextEncoder().encode(secretBytes);
      
      // Create HMAC
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      
      const signatureBytes = await crypto.subtle.sign(
        'HMAC',
        cryptoKey,
        new TextEncoder().encode(signedPayload)
      );
      
      // Convert to base64
      const signatureArray = Array.from(new Uint8Array(signatureBytes));
      const computedSignature = btoa(String.fromCharCode.apply(null, signatureArray));
      
      return computedSignature === cleanSignature;
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return false;
    }
  }
}

export const lightningService = new LightningService();
export type { LightningDepositRequest, LightningDepositResponse, SpeedPaymentResponse };
