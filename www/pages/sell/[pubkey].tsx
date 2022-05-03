import { NextPageContext } from 'next';
import { useRouter } from 'next/router';
import { ethers, BigNumber, providers } from 'ethers';
import { useEffect, useState } from 'react';
import { SellOrder } from 'rwtp';

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

  return (
    <div className="max-w-4xl mx-auto ">
      <div className="px-4 py-12">
        <h1>{sellOrder?.metadata.title}</h1>
        <p>{sellOrder?.metadata.description}</p>
      </div>
    </div>
  );
}
