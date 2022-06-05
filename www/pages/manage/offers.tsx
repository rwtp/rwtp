import { Suspense } from 'react';
import { ConnectWalletLayout, Footer } from '../../components/Layout';
import ManageSidebar from '../../components/ManageSidebar';
import { OfferData, useAllOffers } from '../../lib/useOrder';
import { useAccount } from 'wagmi';
import { FadeIn } from '../../components/FadeIn';
import dayjs from 'dayjs';

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
    <tr>
      <td>
        {dayjs
          .unix(Number.parseInt(opened.timestamp))
          .format('MMM D YYYY, h:mm a')}
      </td>
      <td>{props.offer.order.title}</td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td>{props.offer.price}</td>
      <td>{props.offer.sellersStake}</td>
      <td></td>
      <td>{lastState.state}</td>
      <td></td>
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
      <table>
        <thead>
          <tr>
            <th>Order Date</th>
            <th>Item</th>
            <th>Order ID</th>
            <th>Expires</th>
            <th>Buyer Email</th>
            <th>Qty</th>
            <th>Total</th>
            <th>Your Deposit Held</th>
            <th>Shipping Status</th>
            <th>Order Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>{allOffers}</tbody>
      </table>
    </FadeIn>
  );
}

export default function ManageOffersPage() {
  return (
    <ConnectWalletLayout>
      <div className="h-full flex flex-col">
        <div className="mt-6 flex-1 w-full">
          <div className="max-w-6xl mx-auto px-4">
            <Suspense fallback={<div></div>}>
              <ManageSidebar>
                <h1>All Offers</h1>
                <button>Download CSV</button>
                <OffersTable />
              </ManageSidebar>
            </Suspense>
          </div>
        </div>
        <Footer />
      </div>
    </ConnectWalletLayout>
  );
}
