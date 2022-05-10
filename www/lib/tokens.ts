import { useContract, useContractRead, useContractWrite } from 'wagmi';
import { ERC20 } from './erc20';
import { ethers } from 'ethers';

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
