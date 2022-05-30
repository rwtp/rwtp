import useSWR from 'swr';
import { request } from 'graphql-request';

const fetcher = (query: any, variables: any) =>
  request(
    'https://api.thegraph.com/subgraphs/name/jacobpedd/rwtp',
    query,
    variables
  );

export function useSubgraph<T>(args: string | [string, any]) {
  return useSWR<T>(args, fetcher);
}
