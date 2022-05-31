import useSWR from 'swr';
import { request } from 'graphql-request';
import { useNetwork } from 'wagmi';

const RINKEBY = 'https://api.thegraph.com/subgraphs/name/rwtp/rinkeby';
const OPTIMISM = 'https://api.thegraph.com/subgraphs/name/rwtp/optimism';
const KOVAN = 'https://api.thegraph.com/subgraphs/name/rwtp/kovan';

const fetcher = (url: string, query: any, variables: any) =>
  request(url, query, variables);

export function useSubgraph<T>(args: string | [string, any]) {
  const network = useNetwork();

  let chain = OPTIMISM;
  if (network.activeChain?.id === 4) {
    chain = RINKEBY;
  } else if (network.activeChain?.id === 42) {
    chain = KOVAN;
  }

  return useSWR<T>([chain, ...[args]].flat(), fetcher);
}
