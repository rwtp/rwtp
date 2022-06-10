import { Suspense, useState } from 'react';
import { ConnectWalletLayout, Footer } from '../../components/Layout';
import ManageSidebar from '../../components/ManageSidebar';
import {
  OfferData,
  OrderData,
  useAllOffers,
  useOrderMethods,
} from '../../lib/useOrder';
import { useAccount } from 'wagmi';
import { DuplicateIcon } from '@heroicons/react/outline';
import { FadeIn } from '../../components/FadeIn';
import dayjs from 'dayjs';
import { useRouter } from 'next/router';
import { toUIString } from '../../lib/ui-logic';
import { BigNumber } from 'ethers';
import { getExpirationNum } from '../../lib/ui-logic';

function ActionButtons(props: { offer: OfferData; order: OrderData }) {
  const state = props.offer.state;
  const [isCancelLoading, setIsCancelLoading] = useState(false);
  const [isCommitLoading, setIsCommitLoading] = useState(false);
  // const signer = useSigner();
<<<<<<< HEAD
  const account = useAccount();
=======
  //const account = useAccount();
>>>>>>> origin/main

  const methods = useOrderMethods(props.order.address);

  // *********THERE IS A BUG IN THE GRAPH FOR UPDATING TAKER CANCELED :(*************
  //let offer = methods.useOffer([account.data?.address, props.offer.index]);
  async function callCancel() {
    const tx = await methods.cancel.writeAsync({
<<<<<<< HEAD
      args: [account.data?.address, props.offer.index],
=======
      args: [props.offer.taker, props.offer.index],
>>>>>>> origin/main
      overrides: {
        gasLimit: 1000000,
      },
    });

    setIsCancelLoading(true);

    await tx.wait();
    setIsCancelLoading(false);
    console.log('Canceled');
    return tx.hash;
  }

  async function callCommit() {
    const tx = await methods.commit.writeAsync({
      args: [props.offer.taker, props.offer.index],
      overrides: {
        gasLimit: 1000000,
      },
    });

    setIsCommitLoading(true);

    await tx.wait();
    setIsCommitLoading(false);
    console.log('Committed');
    return tx.hash;
  }

  if (state == 'Open') {
    return (
      <>
        <div className="flex flex-col">
          <button
            className="px-1 rounded bg-black text-xs py-1 text-white hover:opacity-50 disabled:opacity-10"
            onClick={() => callCommit()}
            disabled={isCommitLoading}
          >
            Commit Order
          </button>
        </div>
      </>
    );
  } else if (state == 'Committed') {
    return (
      <>
        <div className="flex flex-col">
          <button
            className="bg-white rounded border border-black text-xs px-1 py-1 hover:opacity-50 disabled:opacity-10"
            onClick={() => callCancel()}
            disabled={isCancelLoading}
          >
            Request Cancellation
          </button>
        </div>
      </>
    );
  } else {
    return <></>;
  }
}

function copyToClipboard(toCopy: string) {
  navigator.clipboard.writeText(toCopy).then(() => {
    console.log('Copied order id to clipboard');
  });
}

function OffersTableRow(props: { offer: OfferData }) {
  if (props.offer.history.length == 0) {
    console.error('Offer had no history');
  }
  let opened = props.offer.history[0];
  if (opened.state !== 'Open') {
    console.error('First state transition for an offer was not `Open`');
  }

  let lastState = props.offer.history[props.offer.history.length - 1];

  const uri = props.offer.uri;
  if (!uri.startsWith('ipfs://')) {
    console.error('URI does not start with `ipfs://`');
  }
  const orderId = uri.replace('ipfs://', '');
  const uriPrefix = orderId.slice(0, 8) + '…';

  console.log(props.offer.taker);
  return (
    <tr
      className={`border-b text-${
        props.offer.state === 'Withdrawn' ||
        props.offer.state === 'Refunded' ||
        props.offer.state === 'Confirmed'
          ? 'gray-400'
          : 'black'
      }`}
    >
      <td className="px-4 py-1 whitespace-nowrap">
        {dayjs
          .unix(Number.parseInt(opened.timestamp))
          .format('MMM D YYYY, h:mm a')}
      </td>
      <td className="px-4 py-1 whitespace-nowrap">{props.offer.order.title}</td>
      <td className="px-4 py-1 whitespace-nowrap">
        <button
          className="flex flex-row hover:opacity-50 cursor-copy"
          onClick={(_e) => copyToClipboard(orderId)}
        >
          <pre>{uriPrefix}</pre>
          <DuplicateIcon className="h-4 w-4 ml-2" />
        </button>
      </td>
      <td className="px-4 py-1 whitespace-nowrap">
        {getExpirationNum(props.offer) != 0
          ? dayjs
              .unix(getExpirationNum(props.offer))
              .format('MMM D YYYY, h:mm a')
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
      <td className="px-4 py-1 whitespace-nowrap">
        <ActionButtons
          key={props.offer.index + props.offer.uri + props.offer.acceptedAt}
          offer={props.offer}
          order={props.offer.order}
        />
      </td>
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

  const allOffers = offers.data
    .sort((purchase_0: any, purchase_1: any) => {
      return (
        Number.parseInt(purchase_1.history[0].timestamp) -
        Number.parseInt(purchase_0.history[0].timestamp)
      );
    })
    .map((o: OfferData) => {
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
              <div className="px-2 space-y-4">
                <h1 className="font-serif text-3xl pb-1">All Offers</h1>
                <OffersTable />
              </div>
            </Suspense>
          </div>
        </div>
        <Footer />
      </div>
    </ConnectWalletLayout>
  );
}
