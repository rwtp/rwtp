import { useContractWrite } from 'wagmi';
import { useSubgraph } from './useSubgraph';
import { Order } from 'rwtp';
import { BigNumber } from 'ethers';

export interface ERC20Data {
  decimals: number;
  symbol: string;
  name: string;
  address: string;
}

const ERC20_FIELDS = `
  decimals
  symbol
  name
  address
`

export interface OrderData {
  id: string,
  address: string,
  uri: string,
  title: string,
  description: string,
  primaryImage: string,
  encryptionPublicKey: string,
  tokenAddressesSuggested: string[],
  tokensSuggested: ERC20Data[],
  priceSuggested: string,
  sellersStakeSuggested: string,
  buyersCostSuggested: string,
  suggestedTimeout: string,
  error: string,
  offers: string,
  offerCount: string,
  maker: string,
  createdAt: string,
  offerSchema: string,
  offerSchemaUri: string
}

const ORDER_FIELDS = `
  address
  uri
  title
  description
  primaryImage
  encryptionPublicKey
  tokenAddressesSuggested
  tokensSuggested {
    ${ERC20_FIELDS}
  }
  priceSuggested
  sellersStakeSuggested
  buyersCostSuggested
  suggestedTimeout
  error
  offers
  offerCount
  maker
  createdAt
  offerSchema
  offerSchemaUri
`;

export interface OfferData {
  index: string,
  taker: string,
  price: string,
  tokenAddress: string,
  buyersCost: string,
  sellersStake: string,
  timeout: string,
  uri: string,
  messagePublicKey: string,
  messageNonce: string,
  message: string,
  timestamp: string,
  state: string,
  order: OrderData
  acceptedAt: string,
  makerCanceled: string,
  takerCanceled: string,
  
}

const OFFER_FIELDS = `
  index
  taker
  price
  buyersCost
  sellersStake
  timeout
  uri
  messagePublicKey
  messageNonce
  message
  timestamp
  state
  order {
    ${ORDER_FIELDS}
  }
  acceptedAt
  makerCanceled
  takerCanceled
  tokenAddress
  token {
    ${ERC20_FIELDS}
  }
`;

function useOrdersWrapperWithMetaData<T>(queryString: string, args: any) {
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

export function useOrders(args: { first: number; skip: number, searchText: string }) {
  const searchArg = args.searchText ? `sellOrderSearch(first:$first, skip:$skip, text:"${args.searchText}:*")` : `orders(first:$first, skip:$skip)`;
  let res = useOrdersWrapperWithMetaData(
    `
    ${searchArg} {
      ${ORDER_FIELDS}
    }
    `,
    {
      skip: args.skip,
      first: args.first,
    }
  ) as any;
  const data = args.searchText ? res.data?.sellOrderSearch : res.data?.orders;
  return {
    ...res.metadata,
    data: data,
  }
}

// Returns information about a sell order
export function useOrder(address: string) {
  const metadata = useSubgraph<{
    order: OrderData;
  }>([
    `
  query metadata($id:ID ){
    order(id:$id) {
      ${ORDER_FIELDS}
    }
  }
  `,
    { id: address },
  ]);

  return {
    ...metadata,
    data: metadata.data?.order,
  };
}

export function useOrderMethods(address: string) {
  const submitOffer = useContractWrite(
    {
      addressOrName: address,
      contractInterface: Order.abi,
    },
    'submitOffer'
  );

  const cancel = useContractWrite(
    {
      addressOrName: address,
      contractInterface: Order.abi,
    },
    'cancel'
  );

  const confirm = useContractWrite(
    {
      addressOrName: address,
      contractInterface: Order.abi,
    },
    'confirm'
  );

  const commit = useContractWrite(
    {
      addressOrName: address,
      contractInterface: Order.abi,
    },
    'commit'
  );

  const commitBatch = useContractWrite(
    {
      addressOrName: address,
      contractInterface: Order.abi,
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

export function useOrderSubmitOffer(address: string) {
  const { data, isError, isLoading, write } = useContractWrite(
    {
      addressOrName: address,
      contractInterface: Order.abi,
    },
    'submitOffer'
  );

  function submitOffer(args: {
    index: number;
    quantity: number;
    price: BigNumber;
    sellersStake: BigNumber;
    uri: string;
  }) {
    write({
      args: [
        args.index,
        args.quantity,
        args.price,
        args.sellersStake,
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

export function useOrderOffersFrom(order: string, taker: string) {
  const metadata = useSubgraph<{
    order: OrderData & {
      offers: Array<OfferData>;
    }
  }>([
    `
    query data($order: ID, $taker: ID){
      order(id: $order) {
        ${ORDER_FIELDS}
        offers(where:{buyerAddress:$taker}) {
          ${OFFER_FIELDS}
        }
      }
    }
  `,
    {
      order: order,
      taker: taker,
    },
  ]);

  return {
    ...metadata,
    data: metadata.data?.order,
  };
}

export function useOrderOffers(order: string) {
  const metadata = useSubgraph<{
    order: OrderData & {
      offers: Array<OfferData>;
    }
  }>([
    `
    query data($order: ID){
      order(id: $order) {
        ${ORDER_FIELDS}
        offers {
          ${OFFER_FIELDS}
        }
      }
    }
  `,
    {
      order: order,
    },
  ]);

  return {
    ...metadata,
    data: metadata.data?.order,
  };
}

export function useAllOrderOffers(maker: string) {
  const metadata = useSubgraph<{
    orders: Array<
      OrderData & {
        offers: Array<OfferData>;
      }
    >;
  }>([
    `
    query data($maker: ID){
      orders(where:{maker:$maker}) {
        ${ORDER_FIELDS}
        offers {
          ${OFFER_FIELDS}
        }
      }
    }
  `,
    {
      maker,
    },
  ]);

  return {
    ...metadata,
    data: metadata.data?.orders,
  };
}