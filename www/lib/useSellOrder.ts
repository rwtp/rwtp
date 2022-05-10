import { useContract, useContractWrite, useSigner } from 'wagmi';
import { useSubgraph } from './useSubgraph';
import { SellOrder } from 'rwtp';
import { BigNumber } from 'ethers';

const SELL_ORDER_QUERY = `
query metadata($id:ID ){
  sellOrder(id:$id) {
    address
    title
    description
    sellersStake
    priceSuggested
    stakeSuggested
    encryptionPublicKey
    sellersStake
    seller
    token {
      decimals
      symbol
      name
      address
    }
  }
}
`;

export interface SellOrderData {
  address: string;
  title: string;
  description: string;
  sellersStake: string;
  priceSuggested: string;
  stakeSuggested: string;
  encryptionPublicKey: string;
  seller: string;
  token: {
    decimals: number;
    symbol: string;
    name: string;
    address: string;
  };
}

// Returns information about a sell order
export function useSellOrder(address: string) {
  const metadata = useSubgraph<{
    sellOrder: SellOrderData;
  }>([SELL_ORDER_QUERY, { id: address }]);

  return {
    ...metadata,
    data: metadata.data?.sellOrder,
  };
}

export function useSellOrderMethods(address: string) {
  const sellOrder = useContract({
    addressOrName: address,
    contractInterface: SellOrder.abi,
  });

  return sellOrder;
}

export function useSellOrderSubmitOffer(address: string) {
  const { data, isError, isLoading, write } = useContractWrite(
    {
      addressOrName: address,
      contractInterface: SellOrder.abi,
    },
    'submitOffer'
  );

  function submitOffer(args: {
    index: number;
    quantity: number;
    pricePerUnit: BigNumber;
    stakePerUnit: BigNumber;
    uri: string;
  }) {
    write({
      args: [
        args.index,
        args.quantity,
        args.pricePerUnit,
        args.stakePerUnit,
        args.uri,
      ],
    });
  }

  return {
    run: submitOffer,
    data,
    isError,
    isLoading,
  };
}
