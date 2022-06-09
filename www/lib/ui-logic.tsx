import { fromBn } from 'evm-bn';
import { BigNumber } from 'ethers';
import { OfferData, OrderData } from './useOrder';
// import dayjs from 'dayjs';

export function toUIString(amount: BigNumber, decimals: number) {
  return fromBn(amount, decimals);
}

export function getUserFriendlyBuyerCost(
  order: OrderData
): [string, string, boolean] {
  const price = BigNumber.from(
    order.priceSuggested ? order.priceSuggested : '0'
  );
  const cost = BigNumber.from(
    order.buyersCostSuggested ? order.buyersCostSuggested : '0'
  );

  if (cost.gt(price)) {
    const buyersDeposit = cost.sub(price);
    return [
      "Buyer's Deposit",
      toUIString(buyersDeposit, order.tokensSuggested[0].decimals),
      false,
    ];
  } else {
    const buyersRefund = price.sub(cost);
    return [
      "Buyer's Refund",
      toUIString(buyersRefund, order.tokensSuggested[0].decimals),
      true,
    ];
  }
}

export function getExpirationNum(offer: OfferData) {
  const timeout = Number.parseInt(offer.timeout);
  const acceptedAt = Number.parseInt(offer.acceptedAt);
  if (acceptedAt != 0) {
    return acceptedAt + timeout;
  } else {
    return 0;
  }
}

export function getBuyerFriendlyStatus(status: string) {
  if (status === 'Committed') {
    return 'In Progress';
  } else if (status === 'Open') {
    return "Pending Seller's Approval";
  } else if (status === 'Confirmed') {
    return 'Complete';
  } else {
    return status;
  }
}
