import { NextPageContext } from 'next';
import { useRouter } from 'next/router';
import { ethers, BigNumber, providers } from 'ethers';
import { useEffect, useState } from 'react';
import { SellOrder } from 'rwtp';
import Image from 'next/image';

function useReadOnlySellOrder(pubkey: string) {
  const [sellOrder, setSellOrder] = useState<{
    contract: ethers.Contract;
    metadata: any;
  }>();

  useEffect(() => {
    if (!pubkey) return;

    async function load() {
      const provider = new ethers.providers.Web3Provider(
        window.ethereum as any
      );

      // Load the contract
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        pubkey as string,
        SellOrder.abi,
        signer
      );

      const cid = (await contract.orderURI()).replace('ipfs://', '');
      console.log('cid', cid);

      const uri = `https://ipfs.infura.io/ipfs/` + cid;
      const resp = await fetch(uri);
      const metadata = await resp.json();

      setSellOrder({
        contract,
        metadata,
      });
    }
    load().catch(console.error);
  }, [pubkey]);

  return sellOrder;
}

export default function Pubkey() {
  const router = useRouter();
  const pubkey = router.query.pubkey as string;
  const sellOrder = useReadOnlySellOrder(pubkey);
  const [email, setEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');

  return (
    <div className="h-full flex w-full">
      <div className="flex w-full border-l border-r mx-auto">
        <div className="flex-1 py-24 px-8 items-center bg-gray-50">
          <div className="flex mb-2">
            <div className="border flex border-black">
              <Image width={128} height={128} src="/rwtp.png" />
            </div>
          </div>
          <h1 className="font-bold text-xl">{sellOrder?.metadata.title}</h1>
          <p className="pb-2">{sellOrder?.metadata.description}</p>
        </div>
        <div className="py-24 px-8 flex-1 bg-white p-4 border-l ">
          <label className="flex flex-col mt-2">
            <div className="text-xs font-bold py-1">Shipping Address</div>
            <input
              type={'text'}
              className={'px-2 py-2 border rounded'}
              name="address"
              placeholder="100 Saddle Point; San Fransokyo, CA 94112"
              onChange={(e) => setShippingAddress(e.target.value)}
            />
          </label>

          <label className="flex flex-col mt-2">
            <div className="text-xs font-bold py-1">Email</div>
            <input
              type={'text'}
              className={'px-2 py-2 border rounded'}
              name="address"
              placeholder="you@ethereum.org"
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <div className="mt-4">
            <button className="bg-black text-white px-4 py-2 rounded w-full">
              Buy with crypto
            </button>
            <div className="text-sm mt-4 text-gray-500">
              If this item doesn't ship to you, the seller be fined{' '}
              <span className="font-bold">10 USDC.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
