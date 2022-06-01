import {
  ArrowRightIcon,
  CheckCircleIcon,
  ChevronRightIcon,
} from '@heroicons/react/solid';
import { BigNumber, ethers } from 'ethers';
import { fromBn } from 'evm-bn';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Suspense, useState } from 'react';
import { FadeIn } from '../../../components/FadeIn';
import { ConnectWalletLayout, Footer } from '../../../components/Layout';
import { useTokenMethods } from '../../../lib/tokens';
import { getPrimaryImageLink } from '../../../lib/image';
import {
  OrderData,
  OfferData,
  useOrder,
  useOrderMethods,
  useOrderOffers,
} from '../../../lib/useOrder';
import cn from 'classnames';
import dayjs from 'dayjs';
import { useSigner } from 'wagmi';
import { Order } from 'rwtp';
import { utils } from 'ethers';

function Offer(props: {
  offer: OfferData;
  order: OrderData;
  onConfirm: (index: string) => Promise<any>;
  onCancel: (index: string) => Promise<any>;
}) {
  const state = props.offer.state;
  const signer = useSigner();
  const [isLoading, setIsLoading] = useState(false);

  async function onConfirm() {
    if (!signer || !signer.data) return;

    setIsLoading(true);
    const contract = new ethers.Contract(
      props.order.address,
      Order.abi,
      signer.data
    );

    const commit = await contract.confirm(
      props.offer.taker,
      props.offer.index,
      {
        gasLimit: 1000000,
      }
    );
    await commit.wait();
    setIsLoading(false);
  }

  return (
    <FadeIn className="flex flex-col py-2">
      <div className="bg-white border">
        <div className="flex px-4 pt-4">
          <div className="flex flex-col">
            <div className="text-gray-500 text-xs">Ordered on</div>
            <div className="text-lg font-serif">
              {dayjs
                .unix(Number.parseInt(props.offer.timestamp))
                .format('MMM D YYYY, h:mm a')}
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
                BigNumber.from(props.offer.price),
                props.order.tokensSuggested[0].decimals
              )}{' '}
              <span className="text-sm">
                {props.order.tokensSuggested[0].symbol}
              </span>
            </div>
          </div>
          <div className="flex-1">
            {/* TODO: update UI to translate cost into refund/deposit amounts */}
            <div className="text-gray-500 text-xs">Your cost</div>
            <div className="text-lg font-mono">
              {fromBn(
                BigNumber.from(props.offer.buyersCost),
                props.order.tokensSuggested[0].decimals
              )}{' '}
              <span className="text-sm">
                {props.order.tokensSuggested[0].symbol}
              </span>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-gray-500 text-xs">Seller's Deposit</div>
            <div className="text-lg font-mono">
              {fromBn(
                BigNumber.from(props.offer.sellersStake),
                props.order.tokensSuggested[0].decimals
              )}{' '}
              <span className="text-sm">
                {props.order.tokensSuggested[0].symbol}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 items-center p-4 border-t px-4">
          <div className="text-xs flex py-2 border-gray-600 text-gray-600">
            Offer Placed <CheckCircleIcon className="h-4 w-4 ml-2" />
          </div>
          <ChevronRightIcon className="h-4 w-4 text-gray-400" />
          {state == 'Open' && (
            <>
              <div className="text-xs flex py-2 border-gray-600 text-gray-600 opacity-50">
                Offer Committed{' '}
                <div className="h-4 w-4 border ml-2 rounded-full border-gray-600"></div>
              </div>
            </>
          )}
          {state == 'Committed' && (
            <>
              <div className="text-xs flex py-2 border-gray-600 text-gray-600">
                Offer Committed <CheckCircleIcon className="h-4 w-4 ml-2" />
              </div>
              <ChevronRightIcon className="h-4 w-4 text-gray-400" />
              <button
                className="bg-black rounded text-white text-sm px-4 py-2 hover:opacity-50 disabled:opacity-10"
                onClick={() => {
                  onConfirm();
                }}
                disabled={isLoading}
              >
                Confirm Order
              </button>
            </>
          )}
          {state == 'Confirmed' && (
            <>
              <div className="text-xs flex py-2 border-gray-600 text-gray-600">
                Offer Committed <CheckCircleIcon className="h-4 w-4 ml-2" />
              </div>
              <div className="text-xs flex py-2 border-gray-600 text-gray-600">
                Offer Confirmed <CheckCircleIcon className="h-4 w-4 ml-2" />
              </div>
            </>
          )}
        </div>
      </div>
    </FadeIn>
  );
}

function toUIString(amount: string, decimals: number) {
  return fromBn(BigNumber.from(amount), decimals);
}

function OrderPage({ order }: { order: OrderData }) {
  const offers = useOrderOffers(order.address);
  const methods = useOrderMethods(order.address);

  async function onConfirm(index: string) {
    const confirmTx = await methods.confirm.writeAsync({
      args: [index],
      overrides: {
        gasLimit: 100000,
      },
    });

    await confirmTx.wait();
    console.log('confirmed');
  }

  async function onCancel(index: string) {
    const cancelTx = await methods.cancel.writeAsync({
      args: [index],
      overrides: {
        gasLimit: 100000,
      },
    });

    await cancelTx.wait();
    console.log('canceld');
  }

  return (
    <ConnectWalletLayout requireConnected={true} txHash="">
      <div className="flex flex-col w-full h-full">
        <div className="px-4 py-2 max-w-6xl mx-auto w-full">
          <div className="pb-4 text-sm flex items-center text-gray-600">
            <a className="underline" href="/buy">
              Browse Listings
            </a>
            <ChevronRightIcon className="h-4 w-4 mx-1 text-gray-400" />
            <div className="font-mono">{`${order.address.substring(
              0,
              6
            )}...${order.address.substring(
              order.address.length - 4,
              order.address.length
            )}`}</div>
          </div>
          <div className="flex flex-col md:flex-row mb-8">
            <div className="w-full md:w-4/6 mr-8">
              <img className="object-fill" src={getPrimaryImageLink(order)} />
            </div>
            <div className="w-full md:w-2/6 space-y-8">
              <div>
                <h1 className="font-serif text-3xl mb-2">{order.title}</h1>
                <div className="text-3xl">
                  {toUIString(
                    order.priceSuggested,
                    order.tokensSuggested[0].decimals
                  )}{' '}
                  {order.tokensSuggested[0].symbol}
                </div>
              </div>

              <div className="flex flex-row space-x-4">
                <div className="flex flex-col w-1/2">
                  <div className="text-xs font-mono text-gray-400">
                    Penalize Fee
                  </div>
                  <div>
                    {toUIString(
                      order.buyersCostSuggested,
                      order.tokensSuggested[0].decimals
                    )}{' '}
                    {order.tokensSuggested[0].symbol}
                  </div>
                </div>
                <div className="flex flex-col w-1/2">
                  <div className="text-xs font-mono text-gray-400">
                    Seller's Stake
                  </div>
                  <div>
                    {toUIString(
                      order.sellersStakeSuggested,
                      order.tokensSuggested[0].decimals
                    )}{' '}
                    {order.tokensSuggested[0].symbol}
                  </div>
                </div>
              </div>
              <p>{order.description}</p>

              <div className="flex mb-16">
                <Link href={`/buy/${order.address}/checkout`}>
                  <a
                    className={cn({
                      'w-full px-4 py-3 text-lg text-center rounded bg-black text-white hover:opacity-50':
                        true,
                    })}
                  >
                    Order
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t flex-1 bg-gray-50">
          <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-2">
            {offers.data?.offers.map((o: any) => (
              <Offer
                key={o.index + o.uri}
                offer={o}
                order={order}
                onConfirm={onConfirm}
                onCancel={onCancel}
              />
            ))}
            {offers.data && offers.data?.offers.length === 0 && (
              <div className="mt-2 text-sm text-gray-400">
                No currently open purchases were found.
              </div>
            )}
          </div>
        </div>

        <Footer />
      </div>
    </ConnectWalletLayout>
  );
}

function Loading() {
  return <div className="bg-gray-50 animate-pulse h-screen w-screen"></div>;
}

function PageWithPubkey(props: { pubkey: string }) {
  const order = useOrder(props.pubkey);

  if (order.error) {
    return (
      <div>
        <pre>{JSON.stringify(order.error)}</pre>
      </div>
    );
  }

  // loading
  if (!order.data) return <Loading />;

  return <OrderPage order={order.data} />;
}

export default function Page() {
  const router = useRouter();
  const pubkey = router.query.pubkey as string;

  if (!pubkey) {
    return <Suspense fallback={<Loading />}></Suspense>;
  }

  return (
    <Suspense fallback={<Loading />}>
      <PageWithPubkey pubkey={pubkey.toLocaleLowerCase()} />
    </Suspense>
  );
}
