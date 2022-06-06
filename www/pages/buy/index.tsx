import { Suspense, useState } from 'react';
import { FadeIn } from '../../components/FadeIn';
import { SearchIcon } from '@heroicons/react/solid';
import { ConnectWalletLayout, Footer } from '../../components/Layout';
import { OrderData, useOrders } from '../../lib/useOrder';
import { getPrimaryImageLink } from '../../lib/image';
import { useChainId } from '../../lib/useChainId';
import { toUIString, getUserFriendlyBuyerCost } from '../../lib/ui-logic';
import { BigNumber } from 'ethers';

function OrderView(props: { order: OrderData }) {
  const chainId = useChainId();

  //if has image
  let imageComponent = (
    <img
      className="w-full h-40 object-cover rounded-t"
      src={getPrimaryImageLink(props.order)}
      alt="item"
    />
  );

  // user facing buyers cost logic
  let [buyersCostName, buyersCostAmount, _] = getUserFriendlyBuyerCost(
    props.order
  );

  return (
    <div className="border overflow-hidden rounded bg-white hover:bg-gray-100">
      <a href={`/buy/${props.order.address}?chain=${chainId}`}>
        {imageComponent}
        <div className="p-2">
          <div className="font-serif truncate w-full mr-2">
            {props.order.title}
          </div>
          {/* REAL-413: Get token and network from token address */}
          <b>
            {toUIString(
              BigNumber.from(props.order.priceSuggested),
              props.order.tokensSuggested[0].decimals
            )}{' '}
            {props.order.tokensSuggested[0].symbol}
          </b>
          <div className="flex flex-col gap-1 md:gap-0">
            <div className="flex text-xs md:text-sm flex-row">
              <div className="text-gray-400 mr-2">{buyersCostName}: </div>
              <div className="whitespace-nowrap">
                {buyersCostAmount} {props.order.tokensSuggested[0].symbol}
              </div>
            </div>
            <div className="flex text-xs md:text-sm flex-row">
              <div className="text-gray-400 mr-2">Seller's Deposit: </div>
              <div className="whitespace-nowrap">
                {toUIString(
                  BigNumber.from(props.order.sellersStakeSuggested),
                  props.order.tokensSuggested[0].decimals
                )}{' '}
                {props.order.tokensSuggested[0].symbol}
              </div>
            </div>
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

  const orderData = orders.data
    .filter((s: any) => !!s.title) // filter ones without titles
    .map((order: any) => {
      return <OrderView key={order.address} order={order} />;
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
    <ConnectWalletLayout>
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
