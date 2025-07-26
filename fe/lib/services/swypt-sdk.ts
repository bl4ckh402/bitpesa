/**
 * Swypt SDK Integration Service
 * Handles all interactions with the Swypt API for on-ramp and off-ramp operations
 */

export interface SwyptQuoteRequest {
  type: 'onramp' | 'offramp';
  amount: string;
  fiatCurrency: string;
  cryptoCurrency: string;
  network: string;
  category?: string; // For offramp only
}

export interface SwyptQuoteResponse {
  statusCode: number;
  message: string;
  data: {
    inputAmount: string;
    outputAmount: number;
    inputCurrency: string;
    outputCurrency: string;
    exchangeRate: number;
    type: 'onramp' | 'offramp';
    network: string;
    fee: {
      amount: number;
      currency: string;
      details: {
        feeInKES: number;
        estimatedOutputKES: number;
      };
    };
  };
}

export interface SwyptSupportedAssets {
  networks: string[];
  fiat: string[];
  crypto: {
    [network: string]: Array<{
      symbol: string;
      name: string;
      decimals: number;
      address: string;
    }>;
  };
}

export interface SwyptOnrampRequest {
  partyA: string; // Kenyan phone number
  amount: string;
  side: 'onramp';
  userAddress: string;
  tokenAddress: string;
}

export interface SwyptOfframpRequest {
  chain: string;
  hash: string; // Transaction hash from blockchain
  partyB: string; // Kenyan phone number
  tokenAddress: string;
}

export interface SwyptOrderStatus {
  status: 'success' | 'error';
  data: {
    status: 'PENDING' | 'SUCCESS' | 'FAILED';
    message: string;
    orderID?: string;
    details: {
      phoneNumber: string;
      transactionSize?: string;
      transactionSide?: string;
      initiatedAt: string;
      mpesaReceipt?: string;
      completedAt?: string;
      ReceiverPartyPublicName?: string;
      transactionDate?: string;
      resultDescription?: string;
    };
  };
}

export interface SwyptTicketRequest {
  orderID?: string;
  phone?: string;
  amount?: string;
  description: string;
  side?: 'on-ramp' | 'off-ramp';
  userAddress?: string;
  symbol?: string;
  tokenAddress?: string;
  chain?: string;
}

class SwyptSDK {
  private baseURL: string;
  private apiKey: string;
  private apiSecret: string;

  constructor() {
    const baseURL = process.env.NEXT_PUBLIC_SWYPT_API_URL || 'https://pool.swypt.io/api';
    const apiKey = process.env.SWYPT_API_KEY || process.env.NEXT_PUBLIC_SWYPT_API_KEY;
    const apiSecret = process.env.SWYPT_API_SECRET || process.env.NEXT_PUBLIC_SWYPT_API_SECRET;

    if (!apiKey || !apiSecret) {
      console.warn('Swypt API credentials not found. Some features may not work properly.');
      // Don't throw error in constructor to allow static method usage
    }

    this.baseURL = baseURL;
    this.apiKey = apiKey || '';
    this.apiSecret = apiSecret || '';
  }

  private getHeaders(): HeadersInit {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('Swypt API credentials are required. Please set SWYPT_API_KEY and SWYPT_API_SECRET in your environment variables.');
    }
    
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      'x-api-secret': this.apiSecret,
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Get a quote for converting between fiat and crypto
   */
  async getQuote(request: SwyptQuoteRequest): Promise<SwyptQuoteResponse> {
    const response = await fetch(`${this.baseURL}/swypt-quotes`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });

    return this.handleResponse<SwyptQuoteResponse>(response);
  }

  /**
   * Get all supported assets, networks, and currencies
   */
  async getSupportedAssets(): Promise<SwyptSupportedAssets> {
    const response = await fetch(`${this.baseURL}/swypt-supported-assets`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<SwyptSupportedAssets>(response);
  }

  /**
   * Initiate on-ramp process (STK Push for M-Pesa payment)
   */
  async initiateOnramp(request: SwyptOnrampRequest) {
    const response = await fetch(`${this.baseURL}/swypt-onramp`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });

    return this.handleResponse(response);
  }

  /**
   * Check on-ramp order status
   */
  async getOnrampStatus(orderID: string): Promise<SwyptOrderStatus> {
    const response = await fetch(`${this.baseURL}/order-onramp-status/${orderID}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<SwyptOrderStatus>(response);
  }

  /**
   * Process crypto transfer after successful M-Pesa payment
   */
  async processDeposit(data: {
    chain: string;
    address: string;
    orderID: string;
    project: string;
  }) {
    const response = await fetch(`${this.baseURL}/swypt-deposit`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  /**
   * Process off-ramp transaction after blockchain withdrawal
   */
  async processOfframp(request: SwyptOfframpRequest) {
    const response = await fetch(`${this.baseURL}/swypt-order-offramp`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });

    return this.handleResponse(response);
  }

  /**
   * Check off-ramp order status
   */
  async getOfframpStatus(orderID: string): Promise<SwyptOrderStatus> {
    const response = await fetch(`${this.baseURL}/order-offramp-status/${orderID}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<SwyptOrderStatus>(response);
  }

  /**
   * Create support ticket for off-ramp issues
   */
  async createOfframpTicket(request: SwyptTicketRequest) {
    const response = await fetch(`${this.baseURL}/create-offramp-ticket`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });

    return this.handleResponse(response);
  }

  /**
   * Create support ticket for on-ramp issues
   */
  async createOnrampTicket(request: SwyptTicketRequest) {
    const response = await fetch(`${this.baseURL}/user-onramp-ticket`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });

    return this.handleResponse(response);
  }

  /**
   * Validate Kenyan phone number format (instance method)
   */
  validateKenyanPhone(phone: string): boolean {
    return SwyptSDK.validateKenyanPhone(phone);
  }

  /**
   * Format phone number to international format (instance method)
   */
  formatKenyanPhone(phone: string): string {
    return SwyptSDK.formatKenyanPhone(phone);
  }

  /**
   * Validate Kenyan phone number format (static method)
   */
  static validateKenyanPhone(phone: string): boolean {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Check if it starts with 254 (country code) or is a local number
    if (cleaned.startsWith('254')) {
      return cleaned.length === 12 && /^254[17][0-9]{8}$/.test(cleaned);
    } else if (cleaned.startsWith('0')) {
      return cleaned.length === 10 && /^0[17][0-9]{8}$/.test(cleaned);
    } else {
      return cleaned.length === 9 && /^[17][0-9]{8}$/.test(cleaned);
    }
  }

  /**
   * Format phone number to international format (static method)
   */
  static formatKenyanPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('254')) {
      return cleaned;
    } else if (cleaned.startsWith('0')) {
      return '254' + cleaned.substring(1);
    } else {
      return '254' + cleaned;
    }
  }
}

// Singleton instance - safely created
let swyptSDKInstance: SwyptSDK | null = null;

export const swyptSDK = (() => {
  if (!swyptSDKInstance) {
    try {
      swyptSDKInstance = new SwyptSDK();
    } catch (error) {
      console.error('Failed to initialize Swypt SDK:', error);
      // Return a fallback object with static methods still available
      return {
        validateKenyanPhone: SwyptSDK.validateKenyanPhone,
        formatKenyanPhone: SwyptSDK.formatKenyanPhone,
        // Throw errors for API methods if credentials are missing
        getQuote: () => Promise.reject(new Error('Swypt API credentials not configured')),
        getSupportedAssets: () => Promise.reject(new Error('Swypt API credentials not configured')),
        initiateOnramp: () => Promise.reject(new Error('Swypt API credentials not configured')),
        getOnrampStatus: () => Promise.reject(new Error('Swypt API credentials not configured')),
        processDeposit: () => Promise.reject(new Error('Swypt API credentials not configured')),
        processOfframp: () => Promise.reject(new Error('Swypt API credentials not configured')),
        getOfframpStatus: () => Promise.reject(new Error('Swypt API credentials not configured')),
        createOfframpTicket: () => Promise.reject(new Error('Swypt API credentials not configured')),
        createOnrampTicket: () => Promise.reject(new Error('Swypt API credentials not configured'))
      };
    }
  }
  return swyptSDKInstance;
})();

export default SwyptSDK;
