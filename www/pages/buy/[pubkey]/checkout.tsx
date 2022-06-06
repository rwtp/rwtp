import { useRouter } from 'next/router';
import { BigNumber } from 'ethers';
import { Suspense, useState, createRef } from 'react';
import { OrderData, useOrder } from '../../../lib/useOrder';
import { ChevronRightIcon } from '@heroicons/react/solid';
import { ConnectWalletLayout } from '../../../components/Layout';
import { toUIString, getUserFriendlyBuyerCost } from '../../../lib/ui-logic';
import { getPrimaryImageLink } from '../../../lib/image';
import {
  WalletConnectedButton,
  KeyStoreConnectedButton,
} from '../../../components/Buttons';
import { CheckoutForm } from '../../../components/CheckoutForm';
import { SubmitOfferButton } from '../../../components/SubmitOfferButton';

function FormFooter(props: { price: string; symbol: string }) {
  return (
    <div className="text-sm mt-4 text-gray-500">
      If this item doesn't ship to you, the seller will be fined{' '}
      <span className="font-bold">
        {props.price} {props.symbol}.
      </span>
    </div>
  );
}

function BuyPage({ order }: { order: OrderData }) {
  const [txHash, setTxHash] = useState('');

  // user facing buyers cost logic ---------------------------------
  let [buyersCostName, buyersCostAmount, hasRefund] = getUserFriendlyBuyerCost(
    order.priceSuggested,
    order.buyersCostSuggested,
    order.tokensSuggested[0].decimals
  );

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

  function renderBuyersStake(
    hasRefund: boolean,
    buyersCostName: string,
    buyersCostAmount: string
  ) {
    if (!hasRefund) {
      return (
        <div className="flex flex-row gap-4">
          <div className="text-base w-full">{buyersCostName}</div>
          <div className="text-base whitespace-nowrap">
            {buyersCostAmount} {order.tokensSuggested[0].symbol}
          </div>
        </div>
      );
    } else {
      return null;
    }
  }

  function renderBuyersStakeExplanation(
    hasRefund: boolean,
    buyersCostAmount: string
  ) {
    if (!hasRefund) {
      return (
        <p className="text-xs">
          You submit an amount that is held in case the order fails and you
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
        <p className="text-xs">
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

  let validChecker: () => Boolean;
  const [offerData, setOfferData] = useState({});

  return (
    <ConnectWalletLayout txHash={txHash}>
      <div className="flex flex-col max-w-6xl mx-auto py-2 px-4">
        <div className="pb-2 text-sm flex items-center text-gray-400">
          <a className="underline" href="/buy">
            Browse Listings
          </a>
          <ChevronRightIcon className="h-4 w-4 mx-1 text-gray-400" />
          <a className="underline" href={`/buy/${order.address}`}>
            <div className="font-mono">{`${order.address.substring(
              0,
              6
            )}...${order.address.substring(
              order.address.length - 4,
              order.address.length
            )}`}</div>
          </a>
          <ChevronRightIcon className="h-4 w-4 mx-1 text-gray-400" />
          <div>Checkout</div>
        </div>
        {/* END HEADER */}
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex flex-col bg-white md:w-3/5 d">
            <div>
              <CheckoutForm
                order={order}
                setOfferData={setOfferData}
                offerData={offerData}
                setValidChecker={(checker) => {
                  validChecker = checker;
                }}
              />
            </div>
          </div>
          {/* PRODUCT INFO */}
          <div className="flex-1 flex flex-col md:w-2/5">
            <div className="bg-gray-50 px-8">
              <div className="flex flex-row gap-4 mt-8">
                <img
                  className="h-24 w-24 object-cover"
                  src={getPrimaryImageLink(order)}
                  alt="Image not found"
                />

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
                {renderBuyersStake(hasRefund, buyersCostName, buyersCostAmount)}
                <div className="flex flex-row gap-4 font-bold">
                  <div className="text-base w-full">Total Today</div>
                  <div className="text-base whitespace-nowrap">
                    {getTotalPrice(hasRefund)} {order.tokensSuggested[0].symbol}
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <WalletConnectedButton>
                  <KeyStoreConnectedButton>
                    <SubmitOfferButton
                      offerData={offerData}
                      order={order}
                      setTxHash={setTxHash}
                      validChecker={() =>
                        validChecker !== undefined && validChecker()
                      }
                    />
                  </KeyStoreConnectedButton>
                </WalletConnectedButton>
              </div>
              {/* END RECEIPT */}
              <div className="mt-4 mb-8">
                {renderBuyersStakeExplanation(hasRefund, buyersCostAmount)}
                {renderRefund(
                  hasRefund,
                  buyersCostAmount,
                  order.tokensSuggested[0].symbol
                )}
              </div>
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
    return (
      <ConnectWalletLayout txHash="">
        <Loading />
      </ConnectWalletLayout>
    );
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
