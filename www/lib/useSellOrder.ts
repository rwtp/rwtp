import { useContract, useContractWrite, useSigner } from 'wagmi';
import { useSubgraph } from './useSubgraph';
import { SellOrder } from 'rwtp';
import { BigNumber } from 'ethers';

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

export function useSellOrders(args: { first: number; skip: number }) {
  const metadata = useSubgraph<{
    sellOrders: SellOrderData[];
  }>([
    `
    query metadata($first:Int, $skip:Int ){
      sellOrders(first:$first, skip:$skip) {
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
  `,
    {
      skip: args.skip,
      first: args.first,
    },
  ]);

  return {
    ...metadata,
    data: metadata.data?.sellOrders,
  };
}

// Returns information about a sell order
export function useSellOrder(address: string) {
  const metadata = useSubgraph<{
    sellOrder: SellOrderData;
  }>([
    `
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
  `,
    { id: address },
  ]);

  return {
    ...metadata,
    data: metadata.data?.sellOrder,
  };
}

export function useSellOrderMethods(address: string) {
  const submitOffer = useContractWrite(
    {
      addressOrName: address,
      contractInterface: SellOrder.abi,
    },
    'submitOffer'
  );

  const cancel = useContractWrite(
    {
      addressOrName: address,
      contractInterface: SellOrder.abi,
    },
    'cancel'
  );

  const confirm = useContractWrite(
    {
      addressOrName: address,
      contractInterface: SellOrder.abi,
    },
    'confirm'
  );

  const commit = useContractWrite(
    {
      addressOrName: address,
      contractInterface: SellOrder.abi,
    },
    'commit'
  );

  const commitBatch = useContractWrite(
    {
      addressOrName: address,
      contractInterface: SellOrder.abi,
    },
    'commitBatch'
  );

  return {
    submitOffer,
    confirm,
    commit,
    commitBatch,
    cancel,
  };
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

export function useSellOrderOffersFrom(sellOrder: string, buyer: string) {
  const metadata = useSubgraph<{
    sellOrder: {
      id: string;
      address: string;
      offers: Array<{
        index: string;
        stakePerUnit: string;
        pricePerUnit: string;
        uri: string;
        quantity: string;
      }>;
    };
  }>([
    `
    query data($order: ID, $buyer: ID){
      sellOrder(id: $order) {
        id
        address
        offers(where:{buyerAddress:$buyer}) {
          index
          stakePerUnit
          pricePerUnit
          uri
          quantity
        }
      }
    }
  `,
    {
      order: sellOrder,
      buyer: buyer,
    },
  ]);

  return {
    ...metadata,
    data: metadata.data?.sellOrder,
  };
}

export function useSellOrderOffers(sellOrder: string) {
  const metadata = useSubgraph<{
    sellOrder: {
      id: string;
      address: string;
      offers: Array<{
        index: string;
        stakePerUnit: string;
        pricePerUnit: string;
        uri: string;
        quantity: string;
        offerState: 'Closed' | 'Open' | 'Committed';
      }>;
    };
  }>([
    `
    query data($order: ID){
      sellOrder(id: $order) {
        id
        address
        offers {
          index
          stakePerUnit
          pricePerUnit
          uri
          quantity
          offerState
        }
      }
    }
  `,
    {
      order: sellOrder,
    },
  ]);

  return {
    ...metadata,
    data: metadata.data?.sellOrder,
  };
}
