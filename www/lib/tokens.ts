import { useContractWrite, useContractRead } from 'wagmi';
import { BigNumber } from 'ethers';
import { fromBn } from 'evm-bn';
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

  const decimals = useContractRead(
    {
      addressOrName: address,
      contractInterface: ERC20.abi,
    },
    'decimals'
  );

  const balance = (args: any) =>
    useContractRead(
      {
        addressOrName: address,
        contractInterface: ERC20.abi,
      },
      'balanceOf',
      {
        args: args,
      }
    );

  return {
    approve,
    decimals,
    balance,
  };
}

export function formatTokenAmount(amount: string, token: ERC20Data) {
  return fromBn(BigNumber.from(amount ? amount : 0), token.decimals);
}
