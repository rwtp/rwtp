import { useContractWrite, useContractRead } from 'wagmi';
import { ERC20 } from './erc20';

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
