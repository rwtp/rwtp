import type { NextPage } from 'next';
import Head from 'next/head';
import { BigNumber, ethers } from 'ethers';
import { SellOrder } from 'rwtp';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import {
  CashIcon,
  ChevronRightIcon,
  InboxInIcon,
} from '@heroicons/react/solid';

interface Offer {
  buyer: string;
  price: string;
  stake: string;
  uri: string;
}

function Inner() {
  const router = useRouter();
  const [offers, setOffers] = useState<Offer[]>();

  useEffect(() => {
    if (!router.query.pubkey) return;

    async function load() {
      // Prepare prepare provider
      const provider = new ethers.providers.Web3Provider(
        window.ethereum as any
      );
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();

      // Load sellOrder contract
      const address = await provider.getSigner().getAddress();
      const sellOrder = new ethers.Contract(
        router.query.pubkey as string,
        SellOrder.abi,
        signer
      );

      // Load token contract
      const token = await sellOrder.token();
      const abi = ['function decimals() public view returns (uint8)'];
      const erc20 = new ethers.Contract(token, abi, signer);
      const decimals = await erc20.decimals();
      console.log(decimals);

      // Get buyer
      let eventABI = ["event OfferSubmitted(address indexed buyer, uint256 indexed price, uint256 indexed stake, string uri);"];
      let iface = new ethers.utils.Interface(eventABI);
      const filter = sellOrder.filters.OfferSubmitted();
      let events = await sellOrder.queryFilter(filter);
      // let parsedEvents = events.map((event) => iface.parseLog(event));
      console.log(events);
      let offers: Offer[] = events.map<Offer>((event) => {
        return {
          buyer: event.args![0] || "",
          price: ((event.args![1] as BigNumber).toNumber() / Math.pow(10, decimals)).toString() || "",
          stake: ((event.args![2] as BigNumber).toNumber() / Math.pow(10, decimals)).toString() || "",
          uri: event.args![3] || ""
        }
      })
      console.log(offers);
      setOffers(offers);
    }
    load().catch(console.error);
  }, [router.query.pubkey]);

  if (!offers) {
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
      <div className="max-w-2xl mx-auto my-auto flex flex-col pb-24 p-4 gap-4">
        {offers.map((offer) => {
          return (<div className="bg-white border border-black">
            <div
              className="bg-gray-50 px-2 py-1 border-b font-mono text-sm"
            >
              <div className="opacity-50 text-xs">{offer.buyer}</div>
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
          </div>)}
        )}
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
