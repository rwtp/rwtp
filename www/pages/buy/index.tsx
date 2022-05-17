import Link from 'next/link';
import { Suspense, useState } from 'react';
import { FadeIn } from '../../components/FadeIn';
import {
  SearchIcon
} from '@heroicons/react/solid';
import {
  ConnectWalletLayout,
  Footer,
} from '../../components/Layout';
import Tag from '../../components/Tag';
import { useSellOrders } from '../../lib/useSellOrder';

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

function OrderView(props: { order: SellOrder }) {
  return (
    <div className="py-2">
      <div className="flex gap-2 items-center justify-between">
        <Link href={`/buy/orders/${props.order.address}`}>
          <a className="underline font-serif">{props.order.title}</a>
        </Link>
        <div className="h-px bg-black w-full flex-1" />
        <Tag type="info">Deposit $2</Tag>
        <Tag type="info">Price $20</Tag>
      </div>
    </div>
  );
}

function Results(props: { searchText: string }) {
  const sellOrders = useSellOrders({
    first: 10,
    skip: 0,
    searchText: props.searchText,
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

  return <FadeIn>{orders}</FadeIn>;
}

export default function Page() {
  const [searchText, setSearchText] = useState('');
  return (
    <ConnectWalletLayout>
      <div className="h-full flex flex-col">
        <div className="h-full p-4 max-w-6xl mx-auto w-full flex-1 mt-8">
          <div className="pb-8">
            <h1 className="font-serif text-2xl pb-1">For Sale</h1>
            <p className="pb-4">This list may be incomplete.</p>
          </div>
          <Suspense fallback={<div></div>}>
            <div className='flex flex-row px-2 py-2 border rounded w-min text-sm justify-center'>
              <SearchIcon className="h-4 w-4 mr-2 my-auto text-gray-500" />
              <input 
                className='outline-0' 
                type="text"
                id='search'
                placeholder='Search'
                onChange={(inputEvent) => { setSearchText(inputEvent.target.value) }} 
              />
            </div>
            <Results searchText={searchText} />
          </Suspense>
        </div>
        <Footer />
      </div>
    </ConnectWalletLayout>
  );
}
