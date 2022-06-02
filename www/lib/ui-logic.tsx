import { fromBn } from 'evm-bn';
import { BigNumber, ethers } from 'ethers';

export function toUIString(amount: string, decimals: number) {
  return fromBn(BigNumber.from(amount), decimals);
}
