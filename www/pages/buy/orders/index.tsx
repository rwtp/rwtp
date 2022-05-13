import Link from 'next/link';
import { FadeIn } from '../../../components/FadeIn';
import { Suspense, useState } from 'react';
import { ConnectWalletLayout, Footer } from '../../../components/Layout';
import Tag from '../../../components/Tag';
import Tag from '../../../components/Tag';
import { useSellOrders } from '../../../lib/useSellOrder';

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

function Results(props: {
  searchText: string;
}) {
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
  const [searchText, setSearchText] = useState("");
  return (
    <ConnectWalletLayout>
      <div className="h-full flex flex-col">
        <div className="h-full p-4 max-w-6xl mx-auto w-full flex-1 mt-8">
          <div className="pb-8">
            <h1 className="font-serif text-2xl pb-1">For Sale</h1>
            <p className="pb-4">This list may be incomplete.</p>
          </div>
          <div>
            <span className="pr-2">Search:</span>
            <input style={{borderWidth: 1, borderBottomColor: 'black'}} type="text" name="name" onChange={(inputEvent) => {setSearchText(inputEvent.target.value)}} />
          </div>
          <Suspense fallback={<div></div>}>
            <Results searchText={searchText}/>
          </Suspense>
        </div>
        <Footer />
      </div>
    </ConnectWalletLayout>
  );
}
