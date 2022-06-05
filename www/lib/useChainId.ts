import { useRouter } from 'next/router';
import { useNetwork } from 'wagmi';
import { DEFAULT_CHAIN_ID } from './constants';

// Helper to get the number of the current chainId or default
export function useChainId(): number {
  const router = useRouter();
  const network = useNetwork();
  const chainId = Number.parseInt(router.query.chain as string);

  if (chainId) return chainId; // use chain in query if exists
  return network.activeChain?.id ?? DEFAULT_CHAIN_ID; // else use active chain or default
}
