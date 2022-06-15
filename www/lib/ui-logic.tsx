import { fromBn } from 'evm-bn';
import { BigNumber } from 'ethers';
import { OfferData, OrderData } from './useOrder';
// import dayjs from 'dayjs';

export function toUIString(amount: BigNumber, decimals: number) {
  return fromBn(amount, decimals);
}

export function getBuyersBuyerCost(
  offer: OfferData
): [string, string, boolean] {
  const price = BigNumber.from(offer.price ? offer.price : '0');
  const cost = BigNumber.from(offer.buyersCost ? offer.buyersCost : '0');

  if (cost.gt(price)) {
    const buyersDeposit = cost.sub(price);
    return [
      "Buyer's Deposit",
      toUIString(buyersDeposit, offer.token.decimals),
      false,
    ];
  } else {
    const buyersRefund = price.sub(cost);
    return [
      "Buyer's Refund",
      toUIString(buyersRefund, offer.token.decimals),
      true,
    ];
  }
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

export function getBuyerFriendlyStatus(offer: OfferData) {
  const status = offer.state;
  if (status === 'Committed') {
    if (offer.makerCanceled) {
      return 'Seller Canceled';
    } else if (offer.takerCanceled) {
      return "Pending Seller's Cancellation";
    }
    return 'In Progress';
  } else if (status === 'Open') {
    return "Pending Seller's Approval";
  } else if (status === 'Confirmed') {
    return 'Complete';
  } else {
    return status;
  }
}

export function getSellerFriendlyStatus(offer: OfferData) {
  const status = offer.state;
  if (status === 'Committed') {
    if (offer.makerCanceled) {
      return "Pending Buyer's Cancelation";
    } else if (offer.takerCanceled) {
      return 'Buyer Canceled';
    }
    return status;
  } else if (status === 'Confirmed') {
    return 'Complete';
  } else {
    return status;
  }
}
