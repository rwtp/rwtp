import {
  ArrowRightIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/solid';
import { BigNumber } from 'ethers';
import { fromBn } from 'evm-bn';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Suspense } from 'react';
import { FadeIn } from '../../../components/FadeIn';
import { ConnectWalletLayout, Footer } from '../../../components/Layout';
import { useTokenMethods } from '../../../lib/tokens';
import {
  OrderData,
  useOrder,
  useOrderMethods,
  useOrderOffers,
} from '../../../lib/useOrder';
import cn from 'classnames';
import dayjs from 'dayjs';

function Offer(props: {
  offer: {
    quantity: string;
    price: string;
    stake: string;
    index: string;
    state: 'Closed' | 'Open' | 'Committed';
    timestamp: string;
  };
  order: OrderData;
  onConfirm: (index: string) => Promise<any>;
  onCancel: (index: string) => Promise<any>;
}) {
  const state = props.offer.state;

  return (
    <FadeIn className="flex flex-col py-2">
      <div className="bg-white border">
        <div className="flex px-4 pt-4">
          <div className="flex flex-col">
            <div className="text-gray-500 text-xs">Ordered on</div>
            <div className="text-lg font-serif">
              {dayjs.unix(Number.parseInt(props.offer.timestamp)).format("MMM D YYYY, h:mm a")}
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
                props.order.token.decimals
              )}{' '}
              <span className="text-sm">{props.order.token.symbol}</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-gray-500 text-xs">Your deposit</div>
            <div className="text-lg font-mono">
              {fromBn(
                BigNumber.from(props.offer.stake),
                props.order.token.decimals
              )}{' '}
              <span className="text-sm">{props.order.token.symbol}</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-gray-500 text-xs">Seller's Deposit</div>
            <div className="text-lg font-mono">
              {/* {fromBn(
                BigNumber.from(props.order.sellersStake),
                props.order.token.decimals
              )}{' '} */}
              <span className="text-sm">{props.order.token.symbol}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 items-center p-4 border-t px-4">
          <div className="text-xs flex py-2 border-gray-600 text-gray-600">
            Offer Placed <CheckCircleIcon className="h-4 w-4 ml-2" />
          </div>
          <ChevronRightIcon className="h-4 w-4 text-gray-400" />
          <div
            className={cn({
              'text-xs flex  py-2 border-gray-600 text-gray-600': true,
              'opacity-50': state !== 'Committed',
            })}
          >
            Offer Accepted{' '}
            {state === 'Committed' ? (
              <CheckCircleIcon className="h-4 w-4 ml-2" />
            ) : (
              <div className="h-4 w-4 border ml-2 rounded-full border-gray-600"></div>
            )}
          </div>
          <ChevronRightIcon className="h-4 w-4 text-gray-400" />
          {state !== 'Committed' && (
            <div
              className={
                'opacity-50 border-gray-600 text-gray-600 flex items-center text-xs'
              }
            >
              Order Delivered{' '}
              <div className="h-4 w-4 border ml-2 rounded-full border-gray-600"></div>
            </div>
          )}

          {state === 'Committed' && (
            <button className="bg-black rounded text-white text-sm px-4 py-2 hover:opacity-50">
              Confirm Order
            </button>
          )}
        </div>
      </div>
    </FadeIn>
  );
}

function OrderPage({ order }: { order: OrderData }) {
  const tokenMethods = useTokenMethods(order.token.address);
  const orderMethods = useOrderMethods(order.address);
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
    <ConnectWalletLayout requireConnected={true}>
      <div className="flex flex-col w-full h-full">
        <div className="px-4 py-2 max-w-6xl mx-auto w-full">
          <div className="pb-4 text-sm flex items-center text-gray-600">
            <a className="underline" href="/buy">
              Sell Orders
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
          <h1 className="font-serif text-3xl pb-1 pt-12">{order.title}</h1>
          <p className="pb-4">{order.description}</p>

          <div className="flex mb-16">
            <Link href={`/buy/${order.address}/checkout`}>
              <a
                className={cn({
                  'bg-black transition-all hover:opacity-70 text-white px-4 py-2 rounded flex items-center':
                    true,
                })}
              >
                Order Now <ArrowRightIcon className="h-4 w-4 ml-2" />
              </a>
            </Link>
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
      <PageWithPubkey pubkey={pubkey} />
    </Suspense>
  );
}
