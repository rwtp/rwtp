import { Suspense } from 'react';
import { ConnectWalletLayout, Footer } from '../../components/Layout';
import ManageSidebar from '../../components/ManageSidebar';
import { useRouter } from 'next/router';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { CogIcon } from '@heroicons/react/solid';
import { useAccount } from 'wagmi';
import { OfferData, useAllOffers, useOffersFrom } from '../../lib/useOrder';

function Stats() {
  const account = useAccount();
  const offers: any = useAllOffers(account.data?.address || '');
  const purchases: any = useOffersFrom(account.data?.address || '');

  if (offers.error) {
    return <pre>{JSON.stringify(offers.error, null, 2)}</pre>;
  }

  if (!offers.data) {
    return null;
  }

  if (purchases.error) {
    return <pre>{JSON.stringify(purchases.error, null, 2)}</pre>;
  }

  if (!purchases.data) {
    return null;
  }

  const hasOffer = offers.data.length > 0;
  const hasPurchase = purchases.data.length > 0;

  const openOffers = offers.data.filter(
    (o: OfferData) => o.state === 'Open'
  ).length;
  const requestCanceledOffers = offers.data.filter(
    (o: OfferData) => o.state != 'Canceled' && o.takerCanceled
  ).length;
  const completedOffers = offers.data.filter(
    (o: OfferData) => o.state === 'Confirmed'
  ).length;
  const canceledOffers = offers.data.filter(
    (o: OfferData) => o.state === 'Canceled'
  ).length;
  const refundedOffers = offers.data.filter(
    (o: OfferData) => o.state === 'Refunded'
  ).length;

  const openPurchases = purchases.data.filter(
    (o: OfferData) => o.state === 'Open'
  ).length;
  const requestCanceledPurchases = purchases.data.filter(
    (o: OfferData) => o.state != 'Canceled' && o.makerCanceled
  ).length;
  const canceledPurchases = purchases.data.filter(
    (o: OfferData) => o.state === 'Canceled'
  ).length;
  const refundedPurchases = purchases.data.filter(
    (o: OfferData) => o.state === 'Refunded'
  ).length;

  // return <div>wassup</div>;
  return (
    <div className="flex flex-col gap-4">
      <div
        className={`${hasOffer ? '' : 'hidden'} text-gray-400 flex-col gap-2`}
      >
        <p>
          You have <b>{offers.data.length}</b> total offers
        </p>
        <p className={`${openOffers > 0 ? '' : 'hidden'}`}>
          📖&emsp;<b>{openOffers}</b> open offers
        </p>
        <p className={`${requestCanceledOffers > 0 ? '' : 'hidden'}`}>
          🙅&emsp;<b>{requestCanceledOffers}</b> buyers have requested to cancel
          the offer
        </p>
        <p className={`${completedOffers > 0 ? '' : 'hidden'}`}>
          ✅&emsp;<b>{completedOffers}</b> completed offers
        </p>
        <p className={`${canceledOffers > 0 ? '' : 'hidden'}`}>
          ❌&emsp;<b>{canceledOffers}</b> canceled offers
        </p>
        <p className={`${refundedOffers > 0 ? '' : 'hidden'}`}>
          💸&emsp;<b>{refundedOffers}</b> refunded offers
        </p>
      </div>
      <div className={`${hasPurchase ? '' : 'hidden'} text-gray-400`}>
        <p>
          You have <b>{purchases.data.length}</b> total purchases
        </p>
        <p className={`${openPurchases > 0 ? '' : 'hidden'}`}>
          ⌛&emsp;<b>{openPurchases}</b> have not yet been accepted by the
          seller
        </p>
        <p className={`${requestCanceledPurchases > 0 ? '' : 'hidden'}`}>
          🙅&emsp;<b>{requestCanceledPurchases}</b> have been requested to be
          canceled
        </p>
        <p className={`${canceledPurchases > 0 ? '' : 'hidden'}`}>
          ❌&emsp;<b>{canceledPurchases}</b> were canceled
        </p>
        <p className={`${refundedPurchases > 0 ? '' : 'hidden'}`}>
          😱&emsp;You have reported fraud on <b>{refundedPurchases}</b>{' '}
          purchases
        </p>
      </div>
    </div>
  );
}

export default function ManagementSummaryPage() {
  let router = useRouter();
  let n = router.pathname.lastIndexOf('/');
  let page = router.pathname.substring(n + 1);
  //console.log(page);
  return (
    <div className="flex flex-col h-screen w-screen">
      <ConnectWalletLayout>
        <div className="flex flex-row w-full gap-4 h-full">
          <div>{ManageSidebar(page)}</div>
          <Suspense fallback={<div></div>}>
            <ConnectButton.Custom>
              {({ openAccountModal }) => {
                return (
                  <div className="flex mt-32 w-full justify-center">
                    {/* <AvatarComponent address={account?.address} size={null} /> */}
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-row gap-2 align-middle mx-auto">
                        <div>Hello Friend!</div>
                        <CogIcon
                          className="h-5 w-5"
                          onClick={() => openAccountModal()}
                        />
                      </div>
                      <Suspense>
                        <Stats />
                      </Suspense>
                    </div>
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </Suspense>
        </div>
      </ConnectWalletLayout>
      <Footer />
    </div>
  );
}
