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
import { Order } from 'rwtp';
import { ConnectWalletLayout, Footer } from '../../components/Layout';
import { useSubgraph } from '../../lib/useSubgraph';
import { FadeIn } from '../../components/FadeIn';
import cn from 'classnames';
import dayjs from 'dayjs';
import { OfferData, useAllOrderOffers } from '../../lib/useOrder';
import nacl from 'tweetnacl';
import { useEncryptionKeypair } from '../../lib/useEncryptionKey';
import { RequiresKeystore, useKeystore } from '../../lib/keystore';

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

function Offer(props: { offer: OfferData }) {
  const sellersEncryptionKeypair = useEncryptionKeypair();
  const signer = useSigner();
  const [isLoading, setIsLoading] = useState(false);
  const [decryptedMessage, setDecryptedMessage] = useState('');
  const o = props.offer;

  useEffect(() => {
    if (sellersEncryptionKeypair) {
      try {
        const decrypted = nacl.box.open(
          Buffer.from(o.message, 'hex'),
          Buffer.from(o.messageNonce, 'hex'),
          Buffer.from(o.messagePublicKey, 'hex'),
          sellersEncryptionKeypair.secretKey
        );
        setDecryptedMessage(Buffer.from(decrypted!).toString());
      } catch (error) {
        console.log(error);
      }
    }
  });

  async function onApprove(o: OfferData) {
    if (!signer || !signer.data) return;

    setIsLoading(true);
    const contract = new ethers.Contract(
      o.order.address,
      Order.abi,
      signer.data
    );

    const commit = await contract.commit(o.taker, o.index, {
      gasLimit: 1000000,
    });
    const tx = await commit.wait();
    setIsLoading(false);
  }

  let status = (
    <>
      <div className="text-xs flex py-2 border-gray-600 text-gray-600">
        Offer Placed <CheckCircleIcon className="h-4 w-4 ml-2" />
      </div>
      <ChevronRightIcon className="h-4 w-4 text-gray-400" />
      
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
          <div className="text-xs flex py-2 border-gray-600 text-gray-600">
            Offer Placed <CheckCircleIcon className="h-4 w-4 ml-2" />
          </div>
          <ChevronRightIcon className="h-4 w-4 text-gray-400" />
          {o.state == 'Open' && <>
          <button
            onClick={() => onApprove(o).catch(console.error)}
            className="bg-black text-white rounded text-sm px-4 py-1 flex items-center hover:opacity-50"
          >
            Accept Offer {isLoading && <Spinner className="h-4 w-4 ml-2" />}
          </button>
          </>}
          {o.state == 'Committed' && <>
          <div className="text-xs flex py-2 border-gray-600 text-gray-600">
              Offer Committed <CheckCircleIcon className="h-4 w-4 ml-2" />
            </div>
            <ChevronRightIcon className="h-4 w-4 text-gray-400" />
            <div className="text-xs flex py-2 border-gray-600 text-gray-600 opacity-50">
              Offer Confirmed <div className="h-4 w-4 border ml-2 rounded-full border-gray-600"></div>
            </div>
          </>}
          {o.state == 'Confirmed' && <>
            <div className="text-xs flex py-2 border-gray-600 text-gray-600">
              Offer Committed <CheckCircleIcon className="h-4 w-4 ml-2" />
            </div>
            <ChevronRightIcon className="h-4 w-4 text-gray-400" />
            <div className="text-xs flex py-2 border-gray-600 text-gray-600">
              Offer Confirmed <CheckCircleIcon className="h-4 w-4 ml-2" />
            </div>
          </>}
        </div>

        <div className="flex px-4 pt-4">
          <div className="flex flex-col">
            <div className="text-gray-500 text-xs">Ordered on</div>
            <div className="text-lg font-serif">
              {dayjs.unix(Number.parseInt(o.timestamp)).format("MMM D YYYY, h:mm a")}
            </div>
          </div>
        </div>
        <div className="flex gap-4 justify-between p-4">
          <div className="flex-1">
            <div className="text-gray-500 text-xs">Quantity</div>
            <div className="text-lg font-mono">1</div>
          </div>
          <div className="flex-1">
            <div className="text-gray-500 text-xs">Price</div>
            <div className="text-lg font-mono">
              {fromBn(
                BigNumber.from(props.offer.price),
                o.order.tokensSuggested[0].decimals
              )}{' '}
              <span className="text-sm">{o.order.tokensSuggested[0].symbol}</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-gray-500 text-xs">Your deposit</div>
            <div className="text-lg font-mono">
              {fromBn(
                BigNumber.from(props.offer.sellersStake),
                o.order.tokensSuggested[0].decimals
              )}{' '}
              <span className="text-sm">{o.order.tokensSuggested[0].symbol}</span>
            </div>
          </div>
        </div>
        {decryptedMessage && <div className='p-4'>
          <div className="text-gray-500 text-xs text-wrap mb-4">Offer Data</div>
          <div className='font-mono text-base bg-gray-100 p-4'>
            {decryptedMessage}
          </div>
        </div>
        }
        {!decryptedMessage && <div className='p-4'>
          <div className="text-gray-500 text-xs text-wrap mb-4">Offer Data Unavailable</div>
        </div>
        }
      </div>
    </FadeIn>
  );
}

function Offers() {
  const account = useAccount();
  const orders = useAllOrderOffers(account.data?.address || '');

  if (orders.error) {
    return <pre>{JSON.stringify(orders.error, null, 2)}</pre>;
  }

  if (!orders.data) {
    return null;
  }

  if (orders.data.length === 0) {
    return <div className="text-gray-500">There are no open offers.</div>;
  }

  // Parse offers from orders
  let offers: Array<OfferData> = new Array<OfferData>();
  for (const order of orders.data) {
    offers = offers.concat(order.offers);
  }
  const allOffers = offers.map((o: OfferData) => {
    return <Offer key={`${o.index}${o.taker}${o.acceptedAt}`} offer={o} />;
  });

  return <FadeIn className="">{allOffers}</FadeIn>;
}

export default function Page() {
  return (
    <RequiresKeystore>
      <ConnectWalletLayout requireConnected={false}>
        <div className="h-full flex flex-col">
          <Suspense fallback={<div></div>}>
            <div className=" p-4 max-w-6xl mx-auto w-full mt-8">
              <div className="pb-8">
                <h1 className="font-serif text-2xl pb-1">Sell to the world</h1>
                <p className="pb-4">Learn more about Sell Orders.</p>
                <div className="flex">
                  <Link href="/sell/new">
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
    </RequiresKeystore>
  );
}
