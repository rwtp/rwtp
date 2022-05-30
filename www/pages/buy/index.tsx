import Link from 'next/link';
import { Suspense, useState } from 'react';
import { FadeIn } from '../../components/FadeIn';
import { SearchIcon } from '@heroicons/react/solid';
import { ConnectWalletLayout, Footer } from '../../components/Layout';
import Tag from '../../components/Tag';
import { useOrders } from '../../lib/useOrder';
import { Order } from 'rwtp';
import { utils } from 'ethers';
import { getPrimaryImageLink } from '../../lib/image';
interface Order {
  address: string;
  title: string;
  description: string;
  sellersStake: string;
  buyersCost: string;
  price: string;
  token: string;
  encryptionPublicKey: string;
  primaryImage: string;
}

function OrderView(props: { order: Order }) {
  // console.log(props.order);
  //if has image
  let imageComponent = (
    <img
      className="w-full h-40 object-cover rounded-t"
      src={getPrimaryImageLink(props.order)}
    />
  );

  return (
    <div className="border rounded bg-white hover:bg-gray-100">
      <a href={`/buy/${props.order.address}`} target="_blank">
        {imageComponent}
        <div className="p-2">
          <div className="font-serif truncate w-full mr-2">
            {props.order.title}
          </div>
          {/* TODO: Get token and network from token address */}
          <b>{utils.formatEther(props.order.price)}</b>
          <div className="flex text-sm flex-row">
            <div className="text-gray-400 mr-2">Buyer's Cost: </div>
            <div>{utils.formatEther(props.order.buyersCost)}</div>
          </div>
          <div className="flex text-sm flex-row">
            <div className="text-gray-400 mr-2">Seller's Stake: </div>
            <div>{utils.formatEther(props.order.sellersStake)}</div>
          </div>
        </div>
      </a>
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

  console.log(orders.data);
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
            sellersStake: order.sellersStakeSuggested,
            buyersCost: order.buyersCostSuggested,
            price: order.priceSuggested,
            token: order.tokensSuggested[0].address,
            encryptionPublicKey: '',
            primaryImage: order.primaryImage,
          }}
        />
      );
    });

  return (
    <FadeIn>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">{orderData}</div>
    </FadeIn>
  );
}

export default function Page() {
  const [searchText, setSearchText] = useState('');
  return (
    <ConnectWalletLayout requireConnected={false} txHash="">
      <div className="h-full flex flex-col">
        <div className="mt-6 flex-1 w-full">
          <div className="max-w-6xl mx-auto px-4">
            <Suspense fallback={<div></div>}>
              <div className="flex flex-row bg-white border rounded text-sm mb-4 w-full flex-1">
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
