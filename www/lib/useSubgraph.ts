import { ConnectButton } from '@rainbow-me/rainbowkit';
import cn from 'classnames';
import { useContract, useProvider } from 'wagmi';
import { OrderBook } from 'rwtp';
import { useEffect } from 'react';
import useSWR from 'swr';
import { request } from 'graphql-request';

const fetcher = (query: any, variables: any) =>
  request(
    'https://api.thegraph.com/subgraphs/name/chitalian/real-world-trade-protocol-rinkeby',
    query,
    variables
  );

export function useSubgraph<T>(args: string | [string, any]) {
  return useSWR<T>(args, fetcher);
}
