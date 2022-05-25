import Link from 'next/link';
import { Suspense, useState } from 'react';
import { FadeIn } from '../../components/FadeIn';
import { SearchIcon } from '@heroicons/react/solid';
import { ConnectWalletLayout, Footer } from '../../components/Layout';
import Tag from '../../components/Tag';
import { useOrders } from '../../lib/useOrder';

interface Order {
  address: string;
  title: string;
  description: string;
  sellersStake: number;
  buyersStake: number;
  price: number;
  token: string;
  encryptionPublicKey: string;
}

function OrderView(props: { order: Order }) {
  return (
    <div className="py-2">
      <div className="flex gap-2 items-center justify-between">
        <Link href={`/buy/${props.order.address}`}>
          <a className="underline font-serif">{props.order.title}</a>
        </Link>
        <div className="h-px bg-black w-full flex-1" />
        <div className="font-mono text-sm">Deposit $2</div>
        <div className="h-px bg-black w-2" />
        <div className="font-mono text-sm">Price $20</div>
      </div>
    </div>
  );
}

function Results(props: { searchText: string }) {
  const orders = useOrders({
    first: 50,
    skip: 0,
    searchText: props.searchText,
  });

  if (!orders.data) {
    return null;
  }

  const orderData = orders.data
    .filter((s: any) => !!s.title) // filter ones without titles
    .map((order: any) => {
      return (
        <OrderView
          key={order.address}
          order={{
            address: order.address,
            title: order.title,
            description: order.description,
            sellersStake: +order.sellersStake,
            buyersStake: +order.stakeSuggested,
            price: +order.priceSuggested,
            token: order.token.address,
            encryptionPublicKey: '',
          }}
        />
      );
    });

  return <FadeIn>{orderData}</FadeIn>;
}

export default function Page() {
  const [searchText, setSearchText] = useState('');
  return (
    <ConnectWalletLayout requireConnected={false}>
      <div className="h-full flex flex-col">
        <div className="p-4 max-w-6xl mx-auto w-full mt-8">
          <div className="pb-8">
            <h1 className="font-serif text-2xl pb-1">Explore items for sale</h1>
            <p className="pb-4">This list may be incomplete.</p>
          </div>
        </div>

        <div className="bg-gray-50 border-t pt-4 flex-1 w-full">
          <div className="max-w-6xl mx-auto px-4">
            <Suspense fallback={<div></div>}>
              <div className="flex flex-row bg-white border border-black rounded text-sm mb-4 w-full flex-1">
                <div className="pl-2 pr-2 py-2 flex items-center">
                  <SearchIcon className="h-4 w-4 my-auto text-gray-400 " />
                </div>
                <input
                  className="outline-0 flex-1 w-full px-2 py-2 rounded-r"
                  type="text"
                  id="search"
                  placeholder="ex: 'Vintage shirts'"
                  onChange={(inputEvent) => {
                    setSearchText(inputEvent.target.value);
                  }}
                />
              </div>
              <Results searchText={searchText} />
            </Suspense>
          </div>
        </div>
        <Footer />
      </div>
    </ConnectWalletLayout>
  );
}
