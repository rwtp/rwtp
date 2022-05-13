import { useSubgraph } from './useSubgraph';

export interface OfferData {
  id: string
  buyer: string
  seller: string
  index: number
  quantity: number
  pricePerUnit: number
  stakePerUnit: number
  uri: string
  createdAt: number
}

export function useOffers(args: { first: number; skip: number, seller: string }) {
  const metadata = useSubgraph<{
    offers: OfferData[];
  }>([
    `
    query metadata($first:Int, $skip:Int, $seller:Bytes){
      offers(first:$first, skip:$skip, where: {
        seller:$seller
      }) {
        buyer
        seller
        index
        quantity
        pricePerUnit
        stakePerUnit
        uri
        createdAt
      }
    }
  `,
    {
      skip: args.skip,
      first: args.first,
      seller: args.seller,
    },
  ]);

  return {
    ...metadata,
    data: metadata.data?.offers,
  };
}
