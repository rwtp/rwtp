import { useRouter } from 'next/router';
import { BigNumber } from 'ethers';
import { Suspense, useState } from 'react';
import Image from 'next/image';
import {
  OrderData,
  useOrder,
  useOrderMethods,
  useOrderSubmitOffer,
} from '../../../lib/useOrder';
import { useTokenMethods } from '../../../lib/tokens';
import { postToIPFS } from '../../../lib/ipfs';
import { fromBn } from 'evm-bn';
import { ArrowLeftIcon } from '@heroicons/react/solid';
import { ConnectWalletLayout } from '../../../components/Layout';
import * as nacl from 'tweetnacl';
import { RequiresKeystore } from '../../../lib/keystore';
import { useEncryptionKeypair } from '../../../lib/useEncryptionKey';
import { DEFAULT_OFFER_SCHEMA } from '../../../lib/constants';
import { OfferForm, SimpleOfferForm } from '../../../lib/offer';
import { toUIString } from '../../../lib/ui-logic';
import { getPrimaryImageLink } from '../../../lib/image';
import Form from '@rjsf/core';

function FormFooter(props: { price: string; symbol: string }) {
  return (
    <div className="text-sm mt-4 text-gray-500">
      If this item doesn't ship to you, the seller be fined{' '}
      <span className="font-bold">
        {props.price} {props.symbol}.
      </span>
    </div>
  );
}

function BuyPage({ order }: { order: OrderData }) {
  const tokenMethods = useTokenMethods(order.tokenAddressesSuggested[0]);
  const orderMethods = useOrderMethods(order.address);
  const router = useRouter();
  const buyersEncryptionKeypair = useEncryptionKeypair();
  const [offerData, setOfferData] = useState({});
  const [txHash, setTxHash] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const quantity = 1;
  const price = order.priceSuggested
    ? BigNumber.from(order.priceSuggested)
    : BigNumber.from(0);
  const stake = order.sellersStakeSuggested
    ? BigNumber.from(order.sellersStakeSuggested)
    : BigNumber.from(0);
  const cost = order.buyersCostSuggested
    ? BigNumber.from(order.buyersCostSuggested)
    : BigNumber.from(0);
  const timeout = order.buyersCostSuggested
    ? BigNumber.from(order.buyersCostSuggested)
    : BigNumber.from(60 * 60 * 24 * 7);

  async function onBuy() {
    if (!offerData) return;
    if (!buyersEncryptionKeypair) return;
    setIsLoading(true);
    console.log('Submitting offer: ', offerData);
    const secretData = Buffer.from(JSON.stringify(offerData), 'utf-8');
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
      publicKey: Buffer.from(buyersEncryptionKeypair.publicKey).toString('hex'),
      nonce: Buffer.from(nonce).toString('hex'),
      message: Buffer.from(encrypted).toString('hex'),
    };
    const cid = await postToIPFS(data);

    const approveTx = await tokenMethods.approve.writeAsync({
      args: [order.address, price.add(stake).mul(quantity)],
    });

    setTxHash(approveTx.hash);
    await approveTx.wait();
    setTxHash('');

    const tx = await orderMethods.submitOffer.writeAsync({
      args: [
        BigNumber.from(0),
        order.tokenAddressesSuggested[0],
        price,
        cost,
        stake,
        timeout,
        'ipfs://' + cid,
      ],
      overrides: {
        gasLimit: 1000000,
      },
    });

    setTxHash(tx.hash);
    await tx.wait();
    setTxHash('');
    setIsLoading(false);

    router.push(`/buy/${order.address}`);
  }

  // user facing buyers cost logic ---------------------------------
  var hasRefund = false;
  var buyersCostName = 'Penalize Fee';
  var buyersCostAmount = toUIString(
    (+order.buyersCostSuggested - +order.priceSuggested).toString(),
    order.tokensSuggested[0].decimals
  );

  if (+buyersCostAmount <= 0) {
    buyersCostName = 'Refund Amount';
    buyersCostAmount = (0 - +buyersCostAmount).toString();
    hasRefund = true;
  }

  function getTotalPrice(hasRefund: boolean) {
    if (hasRefund) {
      return toUIString(
        order.priceSuggested,
        order.tokensSuggested[0].decimals
      );
    } else {
      return toUIString(
        order.buyersCostSuggested.toString(),
        order.tokensSuggested[0].decimals
      );
    }
  }

  function renderPenalizeFee(
    hasRefund: boolean,
    buyersCostName: string,
    buyersCostAmount: string
  ) {
    if (!hasRefund) {
      return (
        <div className="flex flex-row gap-4">
          <div className="text-base w-full">{buyersCostName}</div>
          <div className="text-base whitespace-nowrap">
            + {buyersCostAmount} {order.tokensSuggested[0].symbol}
          </div>
        </div>
      );
    } else {
      return null;
    }
  }

  function renderPenalizeExplanation(
    hasRefund: boolean,
    buyersCostAmount: string
  ) {
    if (!hasRefund) {
      return (
        <p className="text-xs text-gray-400">
          The additional penalize fee is held in case the order fails and you
          decide to penalize the seller. If the order is successful,{' '}
          <b>
            you will get {buyersCostAmount} {order.tokensSuggested[0].symbol}{' '}
            back
          </b>
          .
        </p>
      );
    } else {
      return null;
    }
  }

  function renderRefund(
    hasRefund: boolean,
    buyersCostAmount: string,
    token: string
  ) {
    if (hasRefund) {
      return (
        <p className="text-xs text-gray-400">
          {' '}
          This purchase is eligible for a refund amount of{' '}
          <b>
            {buyersCostAmount} {token}
          </b>{' '}
          if the deal fails.
        </p>
      );
    } else {
      return null;
    }
  }
  // END user facing buyers cost logic ---------------------------------
  let formChecker: Form<any>;

  return (
    <ConnectWalletLayout requireConnected={true} txHash={txHash}>
      <div className="flex flex-col max-w-6xl mx-auto mt-12 px-4 md:flex-row gap-8">
        <div className="flex flex-col bg-white md:w-3/5 d">
          <div className={isLoading ? 'opacity-50 pointer-events-none' : ''}>
            {order.offerSchemaUri &&
            order.offerSchemaUri.replace('ipfs://', '') !=
              DEFAULT_OFFER_SCHEMA ? (
              <OfferForm
                schema={order.offerSchema}
                setOfferData={setOfferData}
                offerData={offerData}
                price={fromBn(price, order.tokensSuggested[0].decimals)}
                refHandler={(form) => {
                  formChecker = form;
                }}
                symbol={order.tokensSuggested[0].symbol}
              />
            ) : (
              <SimpleOfferForm
                setOfferData={setOfferData}
                offerData={offerData}
                price={fromBn(price, order.tokensSuggested[0].decimals)}
                onSubmit={onBuy}
                symbol={order.tokensSuggested[0].symbol}
              />
            )}
          </div>
        </div>
        {/* PRODUCT INFO */}
        <div className="flex-1 flex flex-col md:w-2/5">
          <div className="bg-gray-50 px-8">
            <div className="flex flex-row gap-4 mt-8">
              <div className="h-24 w-24">
                <img className="object-fill" src={getPrimaryImageLink(order)} />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                  <h1 className="text-base font-serif">{order.title}</h1>
                  <div className="flex flex-row gap-2">
                    <div className="text-sm text-gray-400 whitespace-nowrap">
                      Seller's Deposit:
                    </div>
                    <p className="text-sm whitespace-nowrap">
                      {toUIString(
                        order.priceSuggested,
                        order.tokensSuggested[0].decimals
                      )}{' '}
                      {order.tokensSuggested[0].symbol}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {/* END PRODUCT INFO */}
            <hr className="my-8"></hr>
            {/* RECEIPT */}
            <div className="flex flex-col gap-2">
              <div className="flex flex-row gap-4">
                <div className="text-base w-full">Item</div>
                <div className="text-base whitespace-nowrap">
                  {toUIString(
                    order.priceSuggested,
                    order.tokensSuggested[0].decimals
                  )}{' '}
                  {order.tokensSuggested[0].symbol}
                </div>
              </div>
              {renderPenalizeFee(hasRefund, buyersCostName, buyersCostAmount)}
              <div className="flex flex-row gap-4 font-bold">
                <div className="text-base w-full">Total Today</div>
                <div className="text-base whitespace-nowrap">
                  {getTotalPrice(hasRefund)} {order.tokensSuggested[0].symbol}
                </div>
              </div>
            </div>
            {/* END RECEIPT */}

            <button
              className="bg-black rounded text-white w-full text-base px-4 py-2 hover:opacity-50 disabled:opacity-10 mt-12"
              onClick={() => {
                console.log(formChecker);
                formChecker.validate({});

                // if () {
                //   onBuy().catch(console.error);
                // }
              }}
              disabled={isLoading}
            >
              Send Order
            </button>
            <div className="mt-4 mb-8">
              {renderPenalizeExplanation(hasRefund, buyersCostAmount)}
              {renderRefund(
                hasRefund,
                buyersCostAmount,
                order.tokensSuggested[0].symbol
              )}
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
        <PageWithPubkey pubkey={pubkey.toLocaleLowerCase()} />
      </RequiresKeystore>
    </Suspense>
  );
}
