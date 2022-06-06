import { BigNumber } from 'ethers';
import { fromBn } from 'evm-bn';
import { useContractWrite } from 'wagmi';
import { ERC20 } from './erc20';
import { ERC20Data } from './useOrder';

export function useTokenMethods(address: string) {
  const approve = useContractWrite(
    {
      addressOrName: address,
      contractInterface: ERC20.abi,
    },
    'approve'
  );

  return {
    approve,
  };
}

export function formatTokenAmount(amount: string, token: ERC20Data) {
  return fromBn(
      BigNumber.from(amount ? amount : 0),
      token.decimals
  );
}
