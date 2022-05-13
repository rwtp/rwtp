import { ArrowRightIcon, ChevronRightIcon } from '@heroicons/react/solid';
import { BigNumber } from 'ethers';
import { fromBn } from 'evm-bn';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Suspense } from 'react';
import { useAccount } from 'wagmi';
import { ConnectWalletLayout, Footer } from '../../../../components/Layout';
import { useTokenMethods } from '../../../../lib/tokens';
import {
  SellOrderData,
  useSellOrder,
  useSellOrderMethods,
  useSellOrderOffers,
  useSellOrderOffersFrom,
} from '../../../../lib/useSellOrder';

function Offer(props: {
  offer: {
    quantity: string;
    pricePerUnit: string;
    stakePerUnit: string;
    index: string;
  };
  sellOrder: SellOrderData;
}) {
  return (
    <div className="flex gap-4 justify-between max-w-6xl items-center mb-4">
      <div className="flex-1">
        <div className="text-gray-500 text-xs">QUANTITY</div>
        <div className="text-lg font-mono">1</div>
      </div>
      <div className="h-px flex-1 bg-black" />
      <div className="flex-1">
        <div className="text-gray-500 text-xs">PRICE</div>
        <div className="text-lg font-mono">
          {fromBn(
            BigNumber.from(props.offer.pricePerUnit),
            props.sellOrder.token.decimals
          )}{' '}
          <span className="text-sm">{props.sellOrder.token.symbol}</span>
        </div>
      </div>
      <div className="h-px flex-1 bg-black" />
      <div className="flex-1">
        <div className="text-gray-500 text-xs">YOUR DEPOSIT</div>
        <div className="text-lg font-mono">
          {fromBn(
            BigNumber.from(props.offer.stakePerUnit),
            props.sellOrder.token.decimals
          )}{' '}
          <span className="text-sm">{props.sellOrder.token.symbol}</span>
        </div>
      </div>
      <div className="h-px flex-1 bg-black" />
      <div className="flex-1">
        <div className="text-gray-500 text-xs">SELLER'S DEPOSIT</div>
        <div className="text-lg font-mono">
          {fromBn(
            BigNumber.from(props.sellOrder.sellersStake),
            props.sellOrder.token.decimals
          )}{' '}
          <span className="text-sm">{props.sellOrder.token.symbol}</span>
        </div>
      </div>
    </div>
  );
}

function SellOrderPage({ sellOrder }: { sellOrder: SellOrderData }) {
  const tokenMethods = useTokenMethods(sellOrder.token.address);
  const sellOrderMethods = useSellOrderMethods(sellOrder.address);
  const offers = useSellOrderOffers(sellOrder.address);

  return (
    <ConnectWalletLayout>
      <div className="flex flex-col w-full h-full">
        <div className="px-4 py-2 max-w-6xl mx-auto w-full flex-1">
          <div className="pb-4 text-sm flex items-center text-gray-600">
            <a className="underline" href="/app/orders">
              Sell Orders
            </a>
            <ChevronRightIcon className="h-4 w-4 mx-1 text-gray-400" />
            <div className="font-mono">{sellOrder.address}</div>
          </div>
          <h1 className="font-serif text-2xl pb-1 pt-8">{sellOrder.title}</h1>
          <p className="pb-8">{sellOrder.description}</p>

          {offers.data?.offers && offers.data?.offers.length >= 2 && (
            <h2 className="font-serif text-lg pb-2">Your Purchases</h2>
          )}
          {offers.data?.offers && offers.data?.offers.length == 1 && (
            <h2 className="font-serif text-lg pb-2">Your Purchase</h2>
          )}
          {offers.data?.offers && offers.data?.offers.length == 0 && (
            <div className="flex">
              <Link href={`/app/orders/${sellOrder.address}/checkout`}>
                <a className="bg-black transition-all hover:opacity-70 text-white px-4 py-2 rounded flex items-center">
                  Order Now <ArrowRightIcon className="h-4 w-4 ml-2" />
                </a>
              </Link>
            </div>
          )}
          {offers.data?.offers.map((o: any) => (
            <Offer key={o.index + o.uri} offer={o} sellOrder={sellOrder} />
          ))}
          {offers.data?.offers && offers.data?.offers.length > 0 && (
            <div className="flex">
              <Link href={`/app/orders/${sellOrder.address}/checkout`}>
                <a className="bg-black transition-all hover:opacity-70 text-white px-4 py-2 rounded flex items-center">
                  Buy Again <ArrowRightIcon className="h-4 w-4 ml-2" />
                </a>
              </Link>
            </div>
          )}
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
  const sellOrder = useSellOrder(props.pubkey);

  if (!sellOrder.data) return <Loading />;

  return <SellOrderPage sellOrder={sellOrder.data} />;
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
