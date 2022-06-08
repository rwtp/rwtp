import { BigNumber } from 'ethers';
import { Order } from 'rwtp';
import { useContractWrite } from 'wagmi';

export function useOrderConfirm(
  orderAddress: string,
  takerAddress: string,
  index: BigNumber
) {
  return useContractWrite(
    {
      addressOrName: orderAddress,
      contractInterface: Order.abi,
    },
    'confirm',
    {
      args: [takerAddress, BigNumber.from(index)],
    }
  );
}
