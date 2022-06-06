import { fromBn } from 'evm-bn';
import { BigNumber } from 'ethers';
import { OrderData } from './useOrder';

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
