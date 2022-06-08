import { Suspense } from 'react';
import { ConnectWalletLayout, Footer } from '../../components/Layout';
import ManageSidebar from '../../components/ManageSidebar';
import { OfferData, useAllOffers } from '../../lib/useOrder';
import { useAccount } from 'wagmi';
import { FadeIn } from '../../components/FadeIn';
import dayjs from 'dayjs';
import { useRouter } from 'next/router';
import { toUIString } from '../../lib/ui-logic';
import { BigNumber } from 'ethers';

function OffersTableRow(props: { offer: OfferData }) {
  if (props.offer.history.length == 0) {
    console.error('Offer had no history');
  }
  let opened = props.offer.history[0];
  if (opened.state !== 'Open') {
    console.error('First state transition for an offer was not `Open`');
  }

  let lastState = props.offer.history[props.offer.history.length - 1];
  return (
    <tr className="border-b">
      <td className="px-4 py-1 whitespace-nowrap">
        {dayjs
          .unix(Number.parseInt(opened.timestamp))
          .format('MMM D YYYY, h:mm a')}
      </td>
      <td className="px-4 py-1 whitespace-nowrap">{props.offer.order.title}</td>
      <td className="px-4 py-1 whitespace-nowrap">{props.offer.uri}</td>
      <td className="px-4 py-1 whitespace-nowrap">
        {props.offer.acceptedAt
          ? props.offer.acceptedAt + props.offer.timeout
          : ''}
      </td>
      {/* <td></td>
      <td></td> */}
      <td className="px-4 py-1 whitespace-nowrap">
        {toUIString(
          BigNumber.from(props.offer.price),
          props.offer.order.tokensSuggested[0].decimals
        )}{' '}
        {props.offer.order.tokensSuggested[0].symbol}
      </td>
      <td className="px-4 py-1 whitespace-nowrap">
        {toUIString(
          BigNumber.from(props.offer.sellersStake),
          props.offer.order.tokensSuggested[0].decimals
        )}{' '}
        {props.offer.order.tokensSuggested[0].symbol}
      </td>
      {/* <td></td> */}
      <td className="px-4 py-1 whitespace-nowrap">{lastState.state}</td>
      <td className="px-4 py-1 whitespace-nowrap">We need buttons!</td>
    </tr>
  );
}

function OffersTable() {
  const account = useAccount();
  const offers: any = useAllOffers(account.data?.address || '');

  if (offers.error) {
    return <pre>{JSON.stringify(offers.error, null, 2)}</pre>;
  }

  if (!offers.data) {
    return null;
  }

  if (offers.data.length === 0) {
    return <div className="text-gray-500">There are no open offers.</div>;
  }

  const allOffers = offers.data.map((o: OfferData) => {
    return (
      <OffersTableRow
        key={`${o.order.address}${o.index}${o.taker}${o.acceptedAt}`}
        offer={o}
      />
    );
  });

  return (
    <FadeIn>
      <table className="table-auto text-left">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 whitespace-nowrap">Order Date</th>
            <th className="px-4 py-2 whitespace-nowrap">Item</th>
            <th className="px-4 py-2 whitespace-nowrap">Order ID</th>
            <th className="px-4 py-2 whitespace-nowrap">Expires</th>
            {/* <th>Buyer Email</th> */}
            {/* <th>Qty</th> */}
            <th className="px-4 py-2 whitespace-nowrap">Total</th>
            <th className="px-4 py-2 whitespace-nowrap">Your Deposit Held</th>
            {/* <th>Shipping Status</th> */}
            <th className="px-4 py-2 whitespace-nowrap">Order Status</th>
            <th className="px-4 py-2 whitespace-nowrap">Action</th>
          </tr>
        </thead>
        <tbody>{allOffers}</tbody>
      </table>
    </FadeIn>
  );
}

export default function ManageOffersPage() {
  let router = useRouter();
  let n = router.pathname.lastIndexOf('/');
  let page = router.pathname.substring(n + 1);
  return (
    <ConnectWalletLayout>
      <div className="h-full flex flex-col">
        <div className="flex-1 w-full">
          <div className="flex flex-row gap-4 h-full">
            {ManageSidebar(page)}
            <Suspense fallback={<div></div>}>
              <OffersTable />
            </Suspense>
          </div>
        </div>
        <Footer />
      </div>
    </ConnectWalletLayout>
  );
}
