import { useRouter } from 'next/router';
import { BigNumber } from 'ethers';
import { Suspense, useState } from 'react';
import Image from 'next/image';
import {
  OrderData,
  useOrder,
} from '../../../lib/useOrder';
import { fromBn } from 'evm-bn';
import { ArrowLeftIcon } from '@heroicons/react/solid';
import { ConnectWalletLayout } from '../../../components/Layout';
import { CheckoutForm, formatPrice } from '../../../components/CheckoutForm';

function BuyPage({ order }: { order: OrderData }) {
  const [txHash, setTxHash] = useState('');

  const price = formatPrice(order);

  let imageComponent = <Image width={256} height={256} src="/rwtp.png" />;
  if (order.primaryImage && order.primaryImage.length > 0) {
    if (order.primaryImage.startsWith("https://") || order.primaryImage.startsWith("http://")) {
      imageComponent = <img className='w-52' src={order.primaryImage} />
    } else if (order.primaryImage.startsWith("ipfs://")) {
      const imageUri = order.primaryImage.replace("ipfs://", "https://ipfs.infura.io/ipfs/");
      imageComponent = <img className='w-52' src={imageUri} />
    }
  }

  return (
    <ConnectWalletLayout txHash={txHash}>
      <div className="h-full w-full flex flex-col border-t">
        <div className="h-full flex w-full">
          <div className="flex w-full border-l border-r mx-auto">
            <div className="flex-1 justify-center flex flex-col bg-gray-50 items-center">
              <div>
                <div className="flex">
                  <a
                    href="/buy"
                    className="flex gap-2 justify-between items-center py-1 hover:opacity-50 transition-all text-sm text-gray-700"
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                    <div>Back</div>
                  </a>
                </div>

                <h1 className="pt-2 text-sm pt-12 text-gray-700">
                  {order.title}
                </h1>
                <p className="pb-2 text-xl mt-2">
                  {price}{' '}
                  {order.tokensSuggested[0].symbol}
                </p>

                <div className="flex mb-2 pt-12 ">
                  <div className="border rounded bg-white">
                    {imageComponent}
                  </div>
                </div>
              </div>
            </div>
            <div className="py-24 px-8 flex-1 flex justify-center flex-col bg-white p-4 ">
              <CheckoutForm order={order} setTxHash={setTxHash}/>
            </div>
          </div>
        </div>
      </div>
    </ConnectWalletLayout>
  );
}


function Loading() {
  return <div className="bg-gray-50 animate-pulse h-screen w-screen"></div>;
}

function PageWithPubkey(props: { pubkey: string }) {
  const order = useOrder(props.pubkey); // TODO: If this finds an order on the wrong chain that causes an error it breaks the UI

  if (!order.data) {
    return <ConnectWalletLayout txHash=''>
      <Loading />
    </ConnectWalletLayout>;
  }

  return <BuyPage order={order.data} />;
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
