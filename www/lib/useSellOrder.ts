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

const sellOrderBodyText = `
address
title
description
sellersStake
priceSuggested
stakeSuggested
encryptionPublicKey
seller
token {
  decimals
  symbol
  name
  address
}
`

function useSellOrdersWrapperWithMetaData<T>(queryString: string, args: any) {
  const metadata = useSubgraph<T>([
    `
    query metadata($first:Int, $skip:Int ){
      ${queryString}
    }
    `,
    args,
  ]);
  return {
    metadata: metadata,
    data: metadata.data,
  };

}

function useSellOrdersWithSearch(first: number, skip: number, searchText: string) {
  console.log("useSellOrdersWithSearch: ", searchText);
  let res = useSellOrdersWrapperWithMetaData<{ sellOrderSearch: SellOrderData[]; }>(
    `
      sellOrderSearch(first:$first, skip:$skip, text:"${searchText}") {
        ${sellOrderBodyText}
      }
    `,
    {
      skip: skip,
      first: first,
    }
  )
  console.log(res);
  return {
    ...res.metadata,
    data: res.data?.sellOrderSearch,
  }
}


function useSellOrdersNoSearch(first: number, skip: number) {
  let res = useSellOrdersWrapperWithMetaData<{ sellOrders: SellOrderData[]; }>(
    `
    sellOrders(first:$first, skip:$skip) {
        ${sellOrderBodyText}
      }
    `,
    {
      skip: skip,
      first: first,
    }
  )
  return {
    ...res.metadata,
    data: res.data?.sellOrders,
  }
}

export function useSellOrders(args: { first: number; skip: number, searchText: string }) {
  return args.searchText ? useSellOrdersWithSearch(args.first, args.skip, args.searchText) : useSellOrdersNoSearch(args.first, args.skip);
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
        state: 'Closed' | 'Open' | 'Committed';
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
          state
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

export function useAllSellOrderOffers(seller: string) {
  const metadata = useSubgraph<{
    sellOrders: Array<
      SellOrderData & {
        offers: Array<{
          index: string;
          stakePerUnit: string;
          pricePerUnit: string;
          uri: string;
          quantity: string;
          createdAt: string;
          buyer: string;
          state: 'Closed' | 'Open' | 'Committed';
        }>;
      }
    >;
  }>([
    `
    query data($seller: ID){
      sellOrders(where:{seller:$seller}) {
        offers {
          index
          stakePerUnit
          pricePerUnit
          uri
          quantity
          state
          buyer
          createdAt
        }
        id
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
      seller,
    },
  ]);

  return {
    ...metadata,
    data: metadata.data?.sellOrders,
  };
}
