import useSWR from 'swr';
import { request } from 'graphql-request';
import { useChainId } from './useChainId';

const RINKEBY = 'https://api.thegraph.com/subgraphs/name/rwtp/rinkeby';
const OPTIMISM = 'https://api.thegraph.com/subgraphs/name/rwtp/optimism';
const KOVAN = 'https://api.thegraph.com/subgraphs/name/rwtp/kovan';
const MAINNET = 'https://api.thegraph.com/subgraphs/name/rwtp/mainnet';
const POLYGON = 'https://api.thegraph.com/subgraphs/name/rwtp/polygon';
const GOERLI = 'https://api.thegraph.com/subgraphs/name/rwtp/goerli';

const fetcher = (url: string, query: any, variables: any) =>
  request(url, query, variables);

export function useSubgraph<T>(args: string | [string, any]) {
  const chainId = useChainId();

  let chain = OPTIMISM;
  if (chainId === 4) {
    chain = RINKEBY;
  } else if (chainId === 42) {
    chain = KOVAN;
  } else if (chainId === 1) {
    chain = MAINNET;
  } else if (chainId === 137) {
    chain = POLYGON;
  } else if (chainId === 5) {
    chain = GOERLI;
  }

  return useSWR<T>([chain, ...[args]].flat(), fetcher);
}
