// Frontend Integration Example for BitPesa
// This shows how to properly use your ICP canister with auth-client

import { AuthClient } from '@dfinity/auth-client';
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';

// Your canister's IDL factory (generated from your .did file)
const idlFactory = ({ IDL }) => {
  const HttpHeader = IDL.Record({ 'name': IDL.Text, 'value': IDL.Text });
  const HttpResponse = IDL.Record({
    'status': IDL.Nat,
    'headers': IDL.Vec(HttpHeader),
    'body': IDL.Vec(IDL.Nat8),
  });
  
  return IDL.Service({
    'greet': IDL.Func([IDL.Text], [IDL.Text], ['query']),
    'getBtcPrice': IDL.Func([], [IDL.Variant({ 'ok': IDL.Text, 'err': IDL.Text })], []),
    'transform': IDL.Func([HttpResponse], [HttpResponse], ['query']),
    'health': IDL.Func([], [IDL.Record({ 'status': IDL.Text, 'timestamp': IDL.Int })], ['query']),
  });
};

// Your canister ID (from .dfx/local/canister_ids.json)
const canisterId = process.env.CANISTER_ID_BITPESA_BACKEND || 'uxrrr-q7777-77774-qaaaq-cai';

class BitPesaService {
  private authClient: AuthClient | null = null;
  private actor: any = null;
  
  async init() {
    // Initialize auth client
    this.authClient = await AuthClient.create();
    
    // Check if already authenticated
    const isAuthenticated = await this.authClient.isAuthenticated();
    if (isAuthenticated) {
      await this.createActor();
    }
  }
  
  async login() {
    if (!this.authClient) throw new Error('Auth client not initialized');
    
    return new Promise<void>((resolve, reject) => {
      this.authClient!.login({
        // 7 days in nanoseconds
        maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000),
        onSuccess: async () => {
          await this.createActor();
          resolve();
        },
        onError: reject,
      });
    });
  }
  
  async logout() {
    if (!this.authClient) return;
    await this.authClient.logout();
    this.actor = null;
  }
  
  private async createActor() {
    if (!this.authClient) throw new Error('Auth client not initialized');
    
    const identity = this.authClient.getIdentity();
    
    const agent = new HttpAgent({
      identity,
      host: process.env.DFX_NETWORK === 'ic' ? 'https://icp-api.io' : 'http://localhost:4943',
    });
    
    // Fetch root key for local development
    if (process.env.DFX_NETWORK !== 'ic') {
      try {
        await agent.fetchRootKey();
      } catch (err) {
        console.warn('Unable to fetch root key. Check local replica is running:', err);
      }
    }
    
    this.actor = Actor.createActor(idlFactory, {
      agent,
      canisterId,
    });
  }
  
  // Your canister methods
  async greet(name: string): Promise<string> {
    if (!this.actor) throw new Error('Not authenticated');
    return await this.actor.greet(name);
  }
  
  async getBtcPrice(): Promise<{ ok?: string; err?: string }> {
    if (!this.actor) throw new Error('Not authenticated');
    const result = await this.actor.getBtcPrice();
    return result;
  }
  
  async getHealth(): Promise<{ status: string; timestamp: number }> {
    if (!this.actor) throw new Error('Not authenticated');
    return await this.actor.health();
  }
  
  isAuthenticated(): boolean {
    return this.actor !== null;
  }
  
  getPrincipal(): Principal | null {
    if (!this.authClient) return null;
    return this.authClient.getIdentity().getPrincipal();
  }
}

// Usage example
export const bitPesaService = new BitPesaService();

// React hook example
export function useBitPesa() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [principal, setPrincipal] = useState<Principal | null>(null);
  
  useEffect(() => {
    bitPesaService.init().then(() => {
      setIsAuthenticated(bitPesaService.isAuthenticated());
      setPrincipal(bitPesaService.getPrincipal());
      setIsLoading(false);
    });
  }, []);
  
  const login = async () => {
    setIsLoading(true);
    try {
      await bitPesaService.login();
      setIsAuthenticated(true);
      setPrincipal(bitPesaService.getPrincipal());
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = async () => {
    await bitPesaService.logout();
    setIsAuthenticated(false);
    setPrincipal(null);
  };
  
  const getBtcPrice = async () => {
    return await bitPesaService.getBtcPrice();
  };
  
  return {
    isAuthenticated,
    isLoading,
    principal,
    login,
    logout,
    getBtcPrice,
    greet: bitPesaService.greet.bind(bitPesaService),
    getHealth: bitPesaService.getHealth.bind(bitPesaService),
  };
}
