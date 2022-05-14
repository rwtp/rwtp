import {
  ArrowRightIcon,
  CheckCircleIcon,
  CheckIcon,
  PlusIcon,
} from '@heroicons/react/solid';
import { BigNumber, ethers } from 'ethers';
import { fromBn } from 'evm-bn';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useAccount, useContract, useProvider, useSigner } from 'wagmi';
import { SellOrder } from 'rwtp';
import {
  ConnectWalletLayout,
  Footer,
  TabBar,
} from '../../../components/Layout';
import { useSubgraph } from '../../../lib/useSubgraph';
import { FadeIn } from '../../../components/FadeIn';

type IOffer = {
  buyer: string;
  index: string;
  state: string;
  stakePerUnit: string;
  pricePerUnit: string;
  quantity: string;
  timestamp: string;
  uri: string;
  sellOrder: {
    address: string;
    token: {
      symbol: string;
      decimals: number;
    };
  };
};

function Spinner(props: { className?: string }) {
  return (
    <svg
      className={'animate-spin h-4 w-4 text-white ' + props.className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
}

function Offer(props: { offer: IOffer }) {
  const o = props.offer;

  const signer = useSigner();
  const [isLoading, setIsLoading] = useState(false);

  async function onApprove(o: IOffer) {
    if (!signer || !signer.data) return;

    setIsLoading(true);
    const contract = new ethers.Contract(
      o.sellOrder.address,
      SellOrder.abi,
      signer.data
    );

    const commit = await contract.commit(o.buyer, o.index, {
      gasLimit: 1000000,
    });
    const tx = await commit.wait();
    setIsLoading(false);
  }

  return (
    <>
      <div className="flex flex-col p-2 border-b">
        <div className="text-sm font-serif">{new Date().toDateString()}</div>
      </div>

      <div className="flex flex-col p-2 border-l border-b">
        <div className="text-sm font-mono">{o.quantity}</div>
      </div>

      <div className="flex flex-col p-2 border-l border-b">
        <div className="text-sm font-mono">
          {fromBn(BigNumber.from(o.stakePerUnit), o.sellOrder.token.decimals)}
        </div>
      </div>

      <div className="flex flex-col p-2 border-l border-r border-b">
        <div className="text-sm font-mono">
          {fromBn(BigNumber.from(o.pricePerUnit), o.sellOrder.token.decimals)}
        </div>
      </div>
      {o.state === 'Committed' ? (
        <button
          className="text-sm border-b flex items-center justify-center px-2 hover:opacity-80 transition-all "
          onClick={() => onApprove(o)}
        >
          <div className="flex items-center justify-between px-2 bg-black text-white rounded py-1 w-full">
            Accept
            {isLoading ? <Spinner /> : <CheckIcon className="h-4 w-4" />}
          </div>
        </button>
      ) : (
        <div className="px-4 text-gray-500 flex items-center text-sm border-b justify-between">
          Committed <CheckCircleIcon className="h-4 w-4 ml-2" />
        </div>
      )}
    </>
  );
}

function Offers() {
  const account = useAccount();
  const signer = useSigner();

  const offers = useSubgraph<{
    offers: Array<IOffer>;
  }>([
    `
    query metadata($seller:String) {
        offers(where:{seller:$seller}) {
            buyer
            index
            state
            stakePerUnit
            pricePerUnit
            uri
            quantity
            timestamp
            sellOrder {
                address
                token {
                    symbol
                }
            }
        }
      }
  `,
    {
      seller: account.data?.address || '',
    },
  ]);

  if (offers.error) {
    return <pre>{JSON.stringify(offers.error, null, 2)}</pre>;
  }

  if (!offers.data) {
    return null;
  }

  if (offers.data.offers.length === 0) {
    return <div className="text-gray-500">There are no open offers.</div>;
  }

  const allOffers = offers.data.offers.map((o: IOffer) => {
    return <Offer offer={o} />;
  });

  return (
    <FadeIn className="bg-white border grid grid-cols-5">
      <div className="p-2 border-b text-sm font-bold">Date</div>
      <div className="p-2 border-b  text-sm font-bold">Quantity</div>
      <div className="p-2 border-b  text-sm font-bold">Deposit per unit</div>
      <div className="p-2 border-b  text-sm font-bold">Price per unit</div>
      <div className="p-2 border-b  text-sm font-bold"></div>

      {allOffers}
    </FadeIn>
  );
}

export default function Page() {
  return (
    <ConnectWalletLayout>
      <div className="h-full flex flex-col">
        <Suspense fallback={<div></div>}>
          <div className=" p-4 max-w-6xl mx-auto w-full mt-8">
            <div className="pb-8">
              <h1 className="font-serif text-2xl pb-1">Sell to the world</h1>
              <p className="pb-4">Learn more about Sell Orders.</p>
              <div className="flex">
                <Link href="/">
                  <a className="bg-black text-white px-4 py-2 rounded flex items-center gap-2 justify-between">
                    New Sell Order <PlusIcon className="h-4 w-4 ml-2" />
                  </a>
                </Link>
              </div>
            </div>
          </div>
          <div className="flex-1 bg-gray-50 border-t">
            <div className="max-w-6xl mx-auto p-4">
              <h1 className="font-serif text-xl pb-2">Incoming Offers</h1>
              <Offers />
            </div>
          </div>
        </Suspense>
        <Footer />
      </div>
    </ConnectWalletLayout>
  );
}
