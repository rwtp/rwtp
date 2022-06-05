import { fromBn } from 'evm-bn';
import { BigNumber, ethers } from 'ethers';

export function toUIString(amount: string, decimals: number) {
  return fromBn(BigNumber.from(amount), decimals);
}

export function getUserFriendlyBuyerCost(
  price: string,
  buyersCost: string,
  decimals: number
): [string, string, boolean] {
  let buyersCostName: string = 'Penalize Fee';
  let hasRefund: boolean = false;
  let buyersCostAmount: string = toUIString(
    (+buyersCost - +price).toString(),
    decimals
  );

  if (+buyersCostAmount <= 0) {
    buyersCostName = 'Refund Amount';
    buyersCostAmount = (0 - +buyersCostAmount).toString();
    hasRefund = true;
  }

  return [buyersCostName, buyersCostAmount, hasRefund];
}
