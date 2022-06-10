import {
  useOffersFrom,
  OfferData,
  OrderData,
  useOrderMethods,
} from '../../lib/useOrder';
import { Suspense, useState } from 'react';
import { ConnectWalletLayout, Footer } from '../../components/Layout';
import ManageSidebar from '../../components/ManageSidebar';
import { useAccount } from 'wagmi';
import dayjs from 'dayjs';
import { useRouter } from 'next/router';
import {
  toUIString,
  getExpirationNum,
  getBuyerFriendlyStatus,
} from '../../lib/ui-logic';
import { BigNumber } from 'ethers';
import { getPrimaryImageLink } from '../../lib/image';
//import { useOrderConfirm } from '../../lib/useOrderContract';

function ExpirationStatement(props: { offer: OfferData }) {
  const expirationNum = getExpirationNum(props.offer);
  if (expirationNum != 0 && props.offer.state === 'Committed') {
    const expirationDate = dayjs
      .unix(expirationNum)
      .format('MMM D YYYY, h:mm a');
    if (Date.now() / 1000 > expirationNum) {
      return (
        <div className="text-xs text-gray-400">
          Autoconfirmed on {expirationDate}
        </div>
      );
    } else {
      return (
        <div className="text-xs text-emerald-600">
          Autoconfirms on {expirationDate}
        </div>
      );
    }
  } else {
    return <></>;
  }
}

function ActionButtons(props: { offer: OfferData; order: OrderData }) {
  const state = props.offer.state;
  //const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [isWithdrawLoading, setIsWithdrawLoading] = useState(false);
  const [isCancelLoading, setIsCancelLoading] = useState(false);
  const [isRefundLoading, setIsRefundLoading] = useState(false);
  //const signer = useSigner();
  const account = useAccount();

  const methods = useOrderMethods(props.order.address);

  // async function callConfirm() {
  //   const tx = await methods.confirm.writeAsync({
  //     args: [account.data?.address, props.offer.index],
  //     overrides: {
  //       gasLimit: 1000000,
  //     },
  //   });

  //   setIsConfirmLoading(true);
  //   await tx.wait();
  //   setIsConfirmLoading(false);
  //   console.log('Confirmed');
  //   return tx.hash;
  // }

  async function callWithdraw() {
    const tx = await methods.withdrawOffer.writeAsync({
      args: [props.offer.index],
      overrides: {
        gasLimit: 1000000,
      },
    });

    setIsWithdrawLoading(true);
    await tx.wait();
    setIsWithdrawLoading(false);
    console.log('Withdrawn');
    return tx.hash;
  }

  async function callRefund() {
    const tx = await methods.refund.writeAsync({
      args: [account.data?.address, props.offer.index],
      overrides: {
        gasLimit: 1000000,
      },
    });

    setIsRefundLoading(true);
    await tx.wait();
    setIsRefundLoading(false);
    console.log('Seller Penalized');
    return tx.hash;
  }

  // *********THERE IS A BUG IN THE GRAPH FOR UPDATING TAKER CANCELED :(*************
  //let offer = methods.useOffer([account.data?.address, props.offer.index]);
  async function callCancel() {
    // const last_offer = props.offer.history[props.offer.history.length - 1];
    // console.log('props.last_offer', last_offer.takerCanceled);
    // console.log('props.address', props.offer.taker);
    // console.log('props.offer:', props.offer.timestamp);
    // console.log('taker_canceled:', props.offer.takerCanceled);
    // console.log('data:', offer.data);
    // return;
    const tx = await methods.cancel.writeAsync({
      args: [account.data?.address, props.offer.index],
      overrides: {
        gasLimit: 1000000,
      },
    });

    setIsCancelLoading(true);

    await tx.wait();
    // console.log('before ', props.offer.takerCanceled);
    setIsCancelLoading(false);
    // let data = await methods.offer;
    // console.log('data:', data);
    // console.log('after ', props.offer.takerCanceled);
    console.log('Canceled');
    return tx.hash;
  }

  if (state == 'Open') {
    return (
      <>
        <div className="flex flex-col">
          <button
            className="px-4 rounded border border-black text-sm py-2 bg-white hover:opacity-50 disabled:opacity-10"
            onClick={() => callWithdraw()}
            disabled={isWithdrawLoading}
          >
            Withdraw Offer
          </button>
        </div>
      </>
    );
  } else if (state == 'Committed') {
    return (
      <>
        <div className="flex flex-col gap-2">
          {/* <button
            className="bg-black rounded text-white text-sm px-2 py-2 hover:opacity-50 disabled:opacity-10"
            onClick={() => callConfirm()}
            disabled={isConfirmLoading}
          >
            Confirm Order
          </button> */}
          <button
            className="bg-white rounded border border-black text-sm px-2 py-2 hover:opacity-50 disabled:opacity-10"
            onClick={() => callCancel()}
            disabled={isCancelLoading}
          >
            Request Cancellation
          </button>
        </div>
        <div>
          <button
            className="underline text-sm w-full mt-2 text-gray-400 text-center hover:opacity-50 disabled:opacity-10"
            onClick={() => callRefund()}
            disabled={isRefundLoading}
          >
            Penalize Seller
          </button>
        </div>
      </>
    );
  } else {
    return <></>;
  }
}

function PurchaseTile(props: {
  purchase: OfferData;
  setTxHash: (_: any) => void;
}) {
  let currentState =
    props.purchase.history[props.purchase.history.length - 1].state;

  const start_time = Number.parseInt(props.purchase.history[0].timestamp);
  console.log(props.purchase);

  return (
    <div
      className={`flex flex-row md:h-32 border gap-4 bg-${
        currentState === 'Withdrawn' ||
        currentState === 'Refunded' ||
        currentState === 'Confirmed'
          ? 'gray-100'
          : 'white'
      }`}
    >
      <img
        className="h-full w-32 object-cover"
        src={getPrimaryImageLink(props.purchase.order)}
        alt="item"
      />
      <div className="flex flex-col w-full">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="font-serif text-lg mt-2 ">
            {props.purchase.order.title}
          </div>
          <div className="md:mx-4 mt-2 text-sm text-gray-400 whitespace-nowrap">
            Ordered on {dayjs.unix(start_time).format('MMM D YYYY, h:mm a')}
          </div>
        </div>
        <div className="flex flex-col md:grid md:grid-cols-3 mt-2 gap-4">
          {/* <div className="flex flex-col">
            <div className="text-xs font-mono text-gray-400">Ordered</div>
            <div className="text-sm">
              {dayjs.unix(start_time).format('MMM D YYYY, h:mm a')}
            </div>
          </div> */}
          <div className="flex flex-col">
            <div className="text-xs font-mono text-gray-400">Status</div>

            <div className="text-sm">
              {getBuyerFriendlyStatus(currentState)}
            </div>
            <ExpirationStatement offer={props.purchase} />
            {/* <div className="text-sm text-gray-400 md:whitespace-nowrap">
                  Expires{' '}
                  {purchases.data[2].acceptedAt
                    ? purchases.data[2].acceptedAt + purchases.data[2].timeout
                    : ''}
                </div> */}
          </div>
          <div className="flex flex-col">
            <div className="text-xs font-mono text-gray-400">
              Price ({props.purchase.order.tokensSuggested[0].symbol})
            </div>
            <div className="text-sm">
              {toUIString(
                BigNumber.from(props.purchase.price),
                props.purchase.order.tokensSuggested[0].decimals
              )}
              {/* {' '}
              {props.purchase.order.tokensSuggested[0].symbol} */}
            </div>
          </div>
          <div className="mb-4 mr-2 md:mb-0 md:mr-4">
            <ActionButtons
              key={props.purchase.index + props.purchase.uri}
              offer={props.purchase}
              order={props.purchase.order}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Purchases(props: { setTxHash: (_: any) => void }) {
  const account = useAccount();
  const purchases = useOffersFrom(account.data?.address || '');

  //console.log(account.data?.address);
  if (purchases.error) {
    return <pre>{JSON.stringify(purchases.error, null, 2)}</pre>;
  }

  if (!purchases.data) {
    return null;
  }

  if (purchases.data.length === 0) {
    return <div className="text-gray-500">There are no open purchases.</div>;
  }

  //console.log(purchases);

  const purchasesView = purchases.data
    .sort((purchase_0, purchase_1) => {
      return (
        Number.parseInt(purchase_1.history[0].timestamp) -
        Number.parseInt(purchase_0.history[0].timestamp)
      );
    })
    .map((purchase: OfferData) => {
      return (
        <PurchaseTile
          key={purchase.index + purchase.uri}
          purchase={purchase}
          setTxHash={props.setTxHash}
        />
      );
    });

  return <div className="w-full flex flex-col gap-4 mr-4">{purchasesView}</div>;
}

export default function ManagePurchasesPage() {
  let router = useRouter();
  let n = router.pathname.lastIndexOf('/');
  let page = router.pathname.substring(n + 1);
  const [txHash, setTxHash] = useState('');

  return (
    <ConnectWalletLayout txHash={txHash}>
      <div className="h-full flex flex-col">
        <div className="flex-1 max-w-6xl">
          <div className="flex flex-row gap-4 h-full">
            {ManageSidebar(page)}
            <Suspense fallback={<div></div>}>
              <Purchases setTxHash={setTxHash} />
            </Suspense>
          </div>
        </div>
        <Footer />
      </div>
    </ConnectWalletLayout>
  );
}
