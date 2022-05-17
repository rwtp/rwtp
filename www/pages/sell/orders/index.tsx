import {
  BanIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronRightIcon,
  PlusIcon,
} from '@heroicons/react/solid';
import { BigNumber, ethers } from 'ethers';
import { fromBn } from 'evm-bn';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useAccount, useSigner } from 'wagmi';
import { SellOrder } from 'rwtp';
import { ConnectWalletLayout, Footer } from '../../../components/Layout';
import { useSubgraph } from '../../../lib/useSubgraph';
import { FadeIn } from '../../../components/FadeIn';
import cn from 'classnames';
import dayjs from 'dayjs';
import nacl from 'tweetnacl';

type IOffer = {
  id: string;
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

  const [unencryptedMessage, setUnencryptedMessage] = useState('');

  useEffect(() => {
    async function load() {
      const res = await fetch(
        o.uri.replace('ipfs://', 'https://ipfs.infura.io/ipfs/')
      );

      const result = await res.json();
      if (!result.message || !result.encryptionPublicKey || !result.nonce) {
        return;
      }

      const msg = Buffer.from(result.message, 'hex');
      const nonce = Buffer.from(result.nonce, 'hex');
      const encryptionPublicKey = Buffer.from(
        result.encryptionPublicKey,
        'hex'
      );
      nacl.box.open(msg, nonce, encryptionPublicKey);
    }
    load().catch(console.error);
  }, [o]);

  let status = (
    <>
      <div className="text-xs flex py-2 border-gray-600 text-gray-600">
        Offer Placed <CheckCircleIcon className="h-4 w-4 ml-2" />
      </div>
      <ChevronRightIcon className="h-4 w-4 text-gray-400" />
      <button
        onClick={() => onApprove(o).catch(console.error)}
        className="bg-black text-white rounded text-sm px-4 py-1 flex items-center hover:opacity-50"
      >
        Accept Offer {isLoading && <Spinner className="h-4 w-4 ml-2" />}
      </button>
    </>
  );
  if (o.state === 'Committed') {
    status = (
      <>
        <div className="text-xs flex py-2 border-gray-600 text-gray-600">
          Submitted <CheckCircleIcon className="h-4 w-4 ml-2" />
        </div>
        <ChevronRightIcon className="h-4 w-4 text-gray-400" />

        <div
          className={cn({
            'text-xs flex  py-2 border-gray-600 text-gray-600': true,
            'opacity-50': o.state !== 'Committed',
          })}
        >
          Accepted <CheckCircleIcon className="h-4 w-4 ml-2" />
        </div>
        <ChevronRightIcon className="h-4 w-4 text-gray-400" />

        {/* <button className="border rounded text-sm px-4 py-1">
          Ask to cancel
        </button> */}

        <div
          className={cn({
            'text-xs flex  py-2 border-gray-600 text-gray-600 opacity-50': true,
          })}
        >
          Awaiting Confirmation
        </div>
      </>
    );
  }
  if (o.state === 'Canceled') {
    status = (
      <>
        <div className="text-xs flex py-2 border-gray-600 text-gray-600">
          Submitted <CheckCircleIcon className="h-4 w-4 ml-2" />
        </div>
        <ChevronRightIcon className="h-4 w-4 text-gray-400" />

        <div
          className={cn({
            'text-xs flex  py-2 border-gray-600 text-gray-600': true,
          })}
        >
          Accepted <CheckCircleIcon className="h-4 w-4 ml-2" />
        </div>
        <ChevronRightIcon className="h-4 w-4 text-gray-400" />

        <div
          className={cn({
            'text-xs flex  py-2 border-gray-600 text-gray-600': true,
          })}
        >
          Canceled <BanIcon className="h-4 w-4 ml-2" />
        </div>
      </>
    );
  }

  return (
    <FadeIn className="flex flex-col py-2">
      <div className="bg-white border">
        <div className="flex gap-2 items-center p-4 border-b px-4">
          {status}
        </div>

        <div className="flex px-4 pt-4">
          <div className="flex flex-col">
            <div className="text-gray-500 text-xs">Ordered on</div>
            <div className="text-lg font-serif">
              {dayjs(o.timestamp).toISOString()}
            </div>
          </div>
        </div>
        <div className="flex gap-4 justify-between py-4 px-4">
          <div className="flex-1">
            <div className="text-gray-500 text-xs">Quantity</div>
            <div className="text-lg font-mono">1</div>
          </div>
          <div className="flex-1">
            <div className="text-gray-500 text-xs">Price</div>
            <div className="text-lg font-mono">
              {fromBn(
                BigNumber.from(props.offer.pricePerUnit),
                o.sellOrder.token.decimals
              )}{' '}
              <span className="text-sm">{o.sellOrder.token.symbol}</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-gray-500 text-xs">Your deposit</div>
            <div className="text-lg font-mono">
              {fromBn(
                BigNumber.from(props.offer.stakePerUnit),
                o.sellOrder.token.decimals
              )}{' '}
              <span className="text-sm">{o.sellOrder.token.symbol}</span>
            </div>
          </div>
        </div>
      </div>
    </FadeIn>
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
            id
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
    return <Offer key={o.id} offer={o} />;
  });

  return <FadeIn className="">{allOffers}</FadeIn>;
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
                <Link href="/sell/orders/new">
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
