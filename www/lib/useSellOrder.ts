import {
  useContract,
  useContractRead,
  useContractWrite,
  useProvider,
} from 'wagmi';
import { useSubgraph } from './useSubgraph';
import create from 'zustand';
import { SellOrder } from 'rwtp';
import { BigNumber } from 'ethers';

export function useSellOrder(address: string) {
  const metadata = useSubgraph([
    `{
      query metadata($id:ID ){
        sellOrder(id:$id) {
          address
          title
          description
          sellersStake
          encryptionPublicKey
        }
      }
    `,
    { id: address },
  ]);

  const contract = {
    addressOrName: address,
    contractInterface: SellOrder.abi,
  };

  const token = useContractRead(contract, 'token', {
    cacheOnBlock: true,
  });
  const seller = useContractRead(contract, 'seller', {
    cacheOnBlock: true,
  });
  const timeout = useContractRead(contract, 'timeout', {
    cacheOnBlock: true,
  });
  const orderStake = useContractRead(contract, 'orderStake', {
    cacheOnBlock: true,
  });
  const orderBook = useContractRead(contract, 'orderBook', {
    cacheOnBlock: true,
  });
  const orderURI = useContractRead(contract, 'orderBook', {
    cacheOnBlock: true,
  });

  return {
    metadata,
    token,
    seller,
    timeout,
    orderStake,
    orderBook,
    orderURI,
  };
}

export function useSellOrderSubmitOffer(address: string) {
  const { data, isError, isLoading, write } = useContractWrite(
    {
      addressOrName: address,
      contractInterface: SellOrder.abi,
    },
    'submitOffer'
  );

  function submitOffer(args: {
    index: number;
    quantity: number;
    pricePerUnit: BigNumber;
    stakePerUnit: BigNumber;
    uri: string;
  }) {
    write({
      args: [
        args.index,
        args.quantity,
        args.pricePerUnit,
        args.stakePerUnit,
        args.uri,
      ],
    });
  }

  return {
    run: submitOffer,
    data,
    isError,
    isLoading,
  };
}
