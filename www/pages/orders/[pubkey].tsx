import type { NextPage } from 'next';
import Head from 'next/head';
import { ethers } from 'ethers';
import { SellOrder } from 'rwtp';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import {
  CashIcon,
  ChevronRightIcon,
  InboxInIcon,
} from '@heroicons/react/solid';

interface Offer {
  price: string;
  stake: string;
  state: string;
}

function Inner() {
  const router = useRouter();
  const [offer, setOffer] = useState<Offer>();

  useEffect(() => {
    if (!router.query.pubkey) return;

    async function load() {
      const provider = new ethers.providers.Web3Provider(
        window.ethereum as any
      );
      await provider.send('eth_requestAccounts', []); // <- this promps user to connect metamask

      const signer = provider.getSigner();
      const address = await provider.getSigner().getAddress();

      const sellOrder = new ethers.Contract(
        router.query.pubkey as string,
        SellOrder.abi,
        signer
      );

      const token = await sellOrder.token();
      const abi = ['function decimals() public view returns (uint8)'];
      const erc20 = new ethers.Contract(token, abi, signer);
      const decimals = await erc20.decimals();

      const [price, stake, uri, item, state, acceptedAt] =
        await sellOrder.offers(address);

      setOffer({
        price: price.div(ethers.BigNumber.from(10).pow(decimals)).toString(),
        stake: stake.div(ethers.BigNumber.from(10).pow(decimals)).toString(),
        state: state,
      });
    }
    load().catch(console.error);
  }, [router.query.pubkey]);

  if (!offer) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col pb-24">Loading...</div>
    );
  }

  return (
    <div className="bg-blue-50 h-full">
      <div className="max-w-2xl mx-auto px-4 pt-24 w-full flex gap-2">
        <a href="/" className="underline">
          home
        </a>
      </div>
      <div className="max-w-2xl mx-auto my-auto flex flex-col pb-24 p-4">
        <div className="bg-white border border-black">
          <div
            className="bg-gray-50 px-2 py-1 border-b font-mono text-sm"
            border-b
          >
            <div className="opacity-50 text-xs">{router.query.pubkey}</div>
            <div className="flex items-center py-2">
              <div className="text-blue-600 font-bold">Offer Made</div>

              <ChevronRightIcon className="h-4 w-4" />

              <div className="opacity-50">Offer Accepted</div>
              <ChevronRightIcon className="h-4 w-4" />

              <div className="opacity-50">Completed</div>
            </div>
          </div>
          <div className="px-4 py-4">
            <h2 className="font-bold text-lg">
              Your order is pending approval.
            </h2>
            <p className="text-gray-700">
              We'll send you an email if your order is approved.
            </p>
          </div>

          <div className="px-4 py-2">
            <div className="flex items-center">
              <CashIcon className="h-4 w-4 mr-2" />
              <div>
                You offered to pay{' '}
                <span className="font-bold">{offer.price} USDC.</span>
              </div>
            </div>

            <div className="flex items-center">
              <InboxInIcon className="h-4 w-4 mr-2" />
              <div>
                You put down a deposit of{' '}
                <span className="font-bold">{offer.stake} USDC.</span>
              </div>
            </div>
          </div>

          <div className="px-4 py-4">
            {/* <button className="border px-4 py-2 rounded border-black hover:opacity-50">
              Cancel order
            </button> */}
          </div>
        </div>
      </div>
    </div>
  );
}

const Home: NextPage = () => {
  return (
    <div className="h-full">
      <Head>
        <title>RWTP - Real World Transport Protocol</title>
        <meta
          name="description"
          content="A way of shipping real world goods on ethereum"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Inner />
    </div>
  );
};

export default Home;
