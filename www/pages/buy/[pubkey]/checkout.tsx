import { useRouter } from 'next/router';
import { BigNumber } from 'ethers';
import { Suspense, useState } from 'react';
import Image from 'next/image';
import {
  OrderData,
  useOrder,
  useOrderMethods,
} from '../../../lib/useOrder';
import { useTokenMethods } from '../../../lib/tokens';
import { postToIPFS } from '../../../lib/ipfs';
import { fromBn, toBn } from 'evm-bn';
import { ArrowLeftIcon, FingerPrintIcon } from '@heroicons/react/solid';
import { ConnectWalletLayout } from '../../../components/Layout';
import * as nacl from 'tweetnacl';
import { RequiresKeystore } from '../../../lib/keystore';
import { useEncryptionKeypair } from '../../../lib/useEncryptionKey';
import { DEFAULT_OFFER_SCHEMA } from '../../../lib/constants';
import { OfferForm, SimpleOfferForm } from '../../../lib/offer';

function BuyPage({ order }: { order: OrderData }) {
  const tokenMethods = useTokenMethods(order.token.address);
  const orderMethods = useOrderMethods(order.address);
  const router = useRouter();
  const buyersEncryptionKeypair = useEncryptionKeypair();
  const [offerData, setOfferData] = useState({});

  const quantity = 1;
  const price = order.priceSuggested
    ? BigNumber.from(order.priceSuggested)
    : BigNumber.from(0);
  const stake = order.stakeSuggested
    ? BigNumber.from(order.stakeSuggested)
    : BigNumber.from(0);

  async function onBuy() {
    if (!offerData) return;
    if (!buyersEncryptionKeypair) return;
    console.log('Submitting offer: ', offerData);
    const secretData = Buffer.from(
      JSON.stringify(offerData),
      'utf-8'
    );
    const nonce = nacl.randomBytes(24);
    const sellersPublicEncryptionKey = Uint8Array.from(
      Buffer.from(order.encryptionPublicKey, 'hex')
    );

    const encrypted = nacl.box(
      secretData,
      nonce,
      sellersPublicEncryptionKey,
      buyersEncryptionKeypair?.secretKey
    );

    const data = {
      publicKey: buyersEncryptionKeypair.publicKey,
      nonce: Buffer.from(nonce).toString('hex'),
      message: Buffer.from(encrypted).toString('hex'),
    };
    const cid = await postToIPFS(data);

    const approveTx = await tokenMethods.approve.writeAsync({
      args: [order.address, price.add(stake).mul(quantity)],
    });
    await approveTx.wait();

    const tx = await orderMethods.submitOffer.writeAsync({
      args: [0, quantity, price, stake, 'ipfs://' + cid],
      overrides: {
        gasLimit: 1000000,
      },
    });

    await tx.wait();
    router.push(`/buy/${order.address}`);
  }

  return (
    <ConnectWalletLayout requireConnected={true}>
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
                  {fromBn(price, order.token.decimals)}{' '}
                  {order.token.symbol}
                </p>

                <div className="flex mb-2 pt-12 ">
                  <div className="border rounded bg-white">
                    <Image width={256} height={256} src="/rwtp.png" />
                  </div>
                </div>
              </div>
            </div>
            <div className="py-24 px-8 flex-1 flex justify-center flex-col bg-white p-4 ">
              {
                order.offerSchemaUri && order.offerSchemaUri.replace("ipfs://", '') != DEFAULT_OFFER_SCHEMA ?
                  <OfferForm
                    schema={order.offerSchema}
                    setOfferData={setOfferData}
                    offerData={offerData}
                    price={fromBn(price, order.token.decimals)}
                    onSubmit={onBuy}
                    symbol={order.token.symbol} /> :
                  <SimpleOfferForm
                    setOfferData={setOfferData}
                    offerData={offerData}
                    price={fromBn(price, order.token.decimals)}
                    onSubmit={onBuy}
                    symbol={order.token.symbol} />
              }
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
  const order = useOrder(props.pubkey);

  if (!order.data) return <Loading />;

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
      <RequiresKeystore>
        <PageWithPubkey pubkey={pubkey} />
      </RequiresKeystore>
    </Suspense>
  );
}
