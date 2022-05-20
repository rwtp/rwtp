import { useRouter } from 'next/router';
import { BigNumber } from 'ethers';
import { Suspense, useState } from 'react';
import Image from 'next/image';
import {
  SellOrderData,
  useSellOrder,
  useSellOrderMethods,
} from '../../../lib/useSellOrder';
import { useTokenMethods } from '../../../lib/tokens';
import { postToIPFS } from '../../../lib/ipfs';
import { fromBn, toBn } from 'evm-bn';
import { ArrowLeftIcon, FingerPrintIcon } from '@heroicons/react/solid';
import { ConnectWalletLayout } from '../../../components/Layout';
import * as nacl from 'tweetnacl';
import { RequiresKeystore } from '../../../lib/keystore';
import { useEncryptionKeypair } from '../../../lib/useEncryptionKey';
import { DEFAULT_OFFER_SCHEMA } from '../../../lib/constants';
import { OfferForm, SimpleOfferForm}  from '../../../lib/offer';

function BuyPage({ sellOrder }: { sellOrder: SellOrderData }) {
  const tokenMethods = useTokenMethods(sellOrder.token.address);
  const sellOrderMethods = useSellOrderMethods(sellOrder.address);
  const router = useRouter();
  const buyersEncryptionKeypair = useEncryptionKeypair();
  const [offerData, setOfferData] = useState({});

  const quantity = 1;
  const price = sellOrder.priceSuggested
    ? BigNumber.from(sellOrder.priceSuggested)
    : BigNumber.from(0);
  const stake = sellOrder.stakeSuggested
    ? BigNumber.from(sellOrder.stakeSuggested)
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
      Buffer.from(sellOrder.encryptionPublicKey, 'hex')
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
      args: [sellOrder.address, price.add(stake).mul(quantity)],
    });
    await approveTx.wait();

    const tx = await sellOrderMethods.submitOffer.writeAsync({
      args: [0, quantity, price, stake, 'ipfs://' + cid],
      overrides: {
        gasLimit: 1000000,
      },
    });

    await tx.wait();
    router.push(`/buy/${sellOrder.address}`);
  }

  return (
    <ConnectWalletLayout>
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
                  {sellOrder.title}
                </h1>
                <p className="pb-2 text-xl mt-2">
                  {fromBn(price, sellOrder.token.decimals)}{' '}
                  {sellOrder.token.symbol}
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
                  sellOrder.offerSchemaUri && sellOrder.offerSchemaUri.replace("ipfs://", '') != DEFAULT_OFFER_SCHEMA ?
                    <OfferForm
                      schema={sellOrder.offerSchema}
                      setOfferData={setOfferData}
                      offerData={offerData}
                      price={fromBn(price, sellOrder.token.decimals)}
                      onSubmit={onBuy}
                      symbol={sellOrder.token.symbol}/> :
                    <SimpleOfferForm
                      setOfferData={setOfferData}
                      offerData={offerData}
                      price={fromBn(price, sellOrder.token.decimals)}
                      onSubmit={onBuy}
                      symbol={sellOrder.token.symbol} />
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
  const sellOrder = useSellOrder(props.pubkey);

  if (!sellOrder.data) return <Loading />;

  return <BuyPage sellOrder={sellOrder.data} />;
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
