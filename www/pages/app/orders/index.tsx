import {
  ArrowRightIcon,
  FingerPrintIcon,
  LightningBoltIcon,
  SwitchHorizontalIcon,
} from '@heroicons/react/solid';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import cn from 'classnames';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { ConnectWalletLayout, Footer } from '../../../components/Layout';
import {
  SellOrderData,
  useSellOrder,
  useSellOrders,
} from '../../../lib/useSellOrder';

interface SellOrder {
  address: string;
  title: string;
  description: string;
  sellersStake: number;
  buyersStake: number;
  price: number;
  token: string;
  encryptionPublicKey: string;
}

function Tag(props: {
  children: React.ReactNode;
  type: 'danger' | 'success' | 'warning' | 'info';
}) {
  return (
    <div
      className={cn({
        'border text-sm px-2 py-px rounded': true,
        'bg-green-50 border-green-200': props.type === 'success',
        'bg-sky-50 border-sky-200': props.type === 'info',
        'bg-yellow-50 border-yellow-200': props.type === 'warning',
        'bg-red-50 border-red-200': props.type === 'danger',
      })}
    >
      {props.children}
    </div>
  );
}

function OrderView(props: { order: SellOrder }) {
  return (
    <div className="py-2">
      <div className="flex gap-2 items-center justify-between">
        <a
          className="underline font-serif"
          href={`/app/orders/${props.order.address}`}
        >
          {props.order.title}
        </a>
        <div className="h-px bg-black w-full flex-1" />
        <Tag type="info">Deposit $2</Tag>
        <Tag type="info">Price $20</Tag>
      </div>
    </div>
  );
}

function Results() {
  const sellOrders = useSellOrders({
    first: 10,
    skip: 0,
  });

  if (!sellOrders.data) {
    return null;
  }

  const orders = sellOrders.data
    .filter((s: any) => !!s.title) // filter ones without titles
    .map((sellOrder: any) => {
      return (
        <OrderView
          key={sellOrder.address}
          order={{
            address: sellOrder.address,
            title: sellOrder.title,
            description: sellOrder.description,
            sellersStake: +sellOrder.sellersStake,
            buyersStake: +sellOrder.stakeSuggested,
            price: +sellOrder.priceSuggested,
            token: sellOrder.token.address,
            encryptionPublicKey: '',
          }}
        />
      );
    });

  return <>{orders}</>;
}

export default function Page() {
  return (
    <ConnectWalletLayout>
      <div className="h-full flex flex-col">
        <Suspense fallback={<div></div>}>
          <div className="h-full p-4 max-w-6xl mx-auto w-full flex-1">
            <div className="pb-8">
              <h1 className="font-serif text-2xl pb-1">Sell Orders</h1>
              <p className="pb-4">This list may be incomplete.</p>
              <div className="flex">
                <Link href="/app/seller/orders/new">
                  <a className=" border rounded border-black text-sm px-4 py-2 flex items-center hover:opacity-50">
                    New Sell Order
                    <ArrowRightIcon className="h-4 w-4 ml-2" />
                  </a>
                </Link>
              </div>
            </div>
            <Results />
          </div>
        </Suspense>

        <Footer />
      </div>
    </ConnectWalletLayout>
  );
}
