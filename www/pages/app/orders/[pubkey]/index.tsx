import {
  ArrowRightIcon,
  CheckCircleIcon,
  ChevronRightIcon,
} from '@heroicons/react/solid';
import { BigNumber } from 'ethers';
import { fromBn } from 'evm-bn';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Suspense } from 'react';
import { FadeIn } from '../../../../components/FadeIn';
import { ConnectWalletLayout, Footer } from '../../../../components/Layout';
import { useTokenMethods } from '../../../../lib/tokens';
import {
  SellOrderData,
  useSellOrder,
  useSellOrderMethods,
  useSellOrderOffers,
  useSellOrderOffersFrom,
} from '../../../../lib/useSellOrder';
import cn from 'classnames';

function Offer(props: {
  offer: {
    quantity: string;
    pricePerUnit: string;
    stakePerUnit: string;
    index: string;
    offerState: 'Closed' | 'Open' | 'Committed';
  };
  sellOrder: SellOrderData;
}) {
  const methods = useSellOrderMethods(props.sellOrder.address);

  async function onConfirm() {
    const confirmTx = await methods.confirm.writeAsync({
      args: [props.offer.index],
      overrides: {
        gasLimit: 100000,
      },
    });

    await confirmTx.wait();
    console.log('confirmed');
  }

  return (
    <FadeIn className="flex flex-col py-4 mb-12">
      <div className="flex flex-col">
        <div className="text-gray-500 text-xs">Ordered on</div>
        <div className="text-lg font-serif">{new Date().toDateString()}</div>
      </div>
      <div className="flex gap-4 justify-between max-w-6xl items-center my-4">
        <div className="flex-1">
          <div className="text-gray-500 text-xs">Quantity</div>
          <div className="text-lg font-mono">1</div>
        </div>
        <div className="flex-1">
          <div className="text-gray-500 text-xs">Price</div>
          <div className="text-lg font-mono">
            {fromBn(
              BigNumber.from(props.offer.pricePerUnit),
              props.sellOrder.token.decimals
            )}{' '}
            <span className="text-sm">{props.sellOrder.token.symbol}</span>
          </div>
        </div>
        <div className="flex-1">
          <div className="text-gray-500 text-xs">Your deposit</div>
          <div className="text-lg font-mono">
            {fromBn(
              BigNumber.from(props.offer.stakePerUnit),
              props.sellOrder.token.decimals
            )}{' '}
            <span className="text-sm">{props.sellOrder.token.symbol}</span>
          </div>
        </div>
        <div className="flex-1">
          <div className="text-gray-500 text-xs">Seller's Deposit</div>
          <div className="text-lg font-mono">
            {fromBn(
              BigNumber.from(props.sellOrder.sellersStake),
              props.sellOrder.token.decimals
            )}{' '}
            <span className="text-sm">{props.sellOrder.token.symbol}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col mt-2">
        <span className="text-sm mb-4 text-gray-500">
          Did you get your order?
        </span>
        <div className="flex">
          <div className="relative flex ">
            <div
              className="absolute w-4 h-4 bg-blue-500 rounded-full animate-pulse "
              style={{
                top: '-0.5rem',
                right: '-0.5rem',
              }}
            />
            <button
              className="bg-black text-white px-4 py-2 rounded flex items-center justify-between"
              onClick={() => onConfirm().catch(console.error)}
            >
              Confirm Order <CheckCircleIcon className="h-4 w-4 ml-4" />
            </button>
          </div>
          <div className="relative flex ml-8">
            <button className="underline text-gray-600">Cancel Order</button>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}

function SellOrderPage({ sellOrder }: { sellOrder: SellOrderData }) {
  const tokenMethods = useTokenMethods(sellOrder.token.address);
  const sellOrderMethods = useSellOrderMethods(sellOrder.address);
  const offers = useSellOrderOffers(sellOrder.address);

  return (
    <ConnectWalletLayout>
      <div className="flex flex-col w-full h-full">
        <div className="px-4 py-2 max-w-6xl mx-auto w-full">
          <div className="pb-4 text-sm flex items-center text-gray-600">
            <a className="underline" href="/app/orders">
              Sell Orders
            </a>
            <ChevronRightIcon className="h-4 w-4 mx-1 text-gray-400" />
            <div className="font-mono">{`${sellOrder.address.substring(
              0,
              6
            )}...${sellOrder.address.substring(
              sellOrder.address.length - 4,
              sellOrder.address.length
            )}`}</div>
          </div>
          <h1 className="font-serif text-3xl pb-1 pt-12">{sellOrder.title}</h1>
          <p className="pb-4">{sellOrder.description}</p>

          <div className="flex mb-16">
            <Link href={`/app/orders/${sellOrder.address}/checkout`}>
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
          <div className="text-sm text-gray-400">Purchases in progress</div>
        </div>

        <div className="border-t flex-1 bg-gray-50">
          <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-2">
            {offers.data?.offers.map((o: any) => (
              <Offer key={o.index + o.uri} offer={o} sellOrder={sellOrder} />
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
