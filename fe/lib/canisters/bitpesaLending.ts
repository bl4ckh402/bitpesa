import { icpActorService } from '../services/ICPActorService';
import { idlFactory } from './bitpesa_lending.did';

const canisterId = process.env.NEXT_PUBLIC_BITPESA_LENDING_CANISTER_ID_LOCAL!;

export function createBitPesaLendingActor(identity?: any) {
  // Use the centralized actor service instead of creating new agents
  return icpActorService.createActor(idlFactory, canisterId);
}