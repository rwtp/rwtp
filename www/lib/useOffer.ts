import { SellOrderData } from './useSellOrder';
import { useSubgraph } from './useSubgraph';

export interface OfferData {
  index: string;
  stakePerUnit: string;
  pricePerUnit: string;
  uri: string;
  quantity: string;
  buyer: string;
  createdAt: string;
  state: 'Closed' | 'Open' | 'Committed';
}
