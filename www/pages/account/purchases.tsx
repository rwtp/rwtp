import {
  useOffersFrom,
  OfferData,
  OrderData,
  useOrder,
  useOrderMethods,
  useOrderOffersFrom,
} from '../../lib/useOrder';
import { Suspense, useState } from 'react';
import { ConnectWalletLayout, Footer } from '../../components/Layout';
import ManageSidebar from '../../components/ManageSidebar';
import { useAccount, useSigner } from 'wagmi';
import { FadeIn } from '../../components/FadeIn';
import dayjs from 'dayjs';
import { useRouter } from 'next/router';
import { toUIString } from '../../lib/ui-logic';
import { BigNumber } from 'ethers';
import { getPrimaryImageLink } from '../../lib/image';
import { CheckCircleIcon, ChevronRightIcon } from '@heroicons/react/solid';
import { useChainId } from '../../lib/useChainId';
import { useOrderConfirm } from '../../lib/useOrderContract';

function ActionButtons(props: {
  offer: OfferData;
  order: OrderData;
  onCancel: (_: string) => Promise<any>;
  onWithdraw: (_: string) => Promise<any>;
}) {
  const state = props.offer.state;
  const [isLoading, setIsLoading] = useState(false);
  const signer = useSigner();
  const account = useAccount();
  const { writeAsync: confirm } = useOrderConfirm(
    props.order.address,
    account.data?.address ?? '',
    BigNumber.from(props.offer.index)
  );

  async function onConfirm() {
    if (!signer || !signer.data) return;

    setIsLoading(true);
    const tx = await confirm();
    await tx.wait();
    setIsLoading(false);
  }

  async function onWithdraw() {
    if (!signer || !signer.data) return;

    setIsLoading(true);
    await props.onWithdraw(props.offer.index);
    setIsLoading(false);
  }

  if (state == 'Open') {
    return (
      <>
        <button
          className="flex px-4 rounded text-sm py-2 bg-red-500 text-white hover:opacity-50 disabled:opacity-10"
          onClick={() => onWithdraw()}
          disabled={isLoading}
        >
          Withdraw Offer
        </button>
      </>
    );
  } else if (state == 'Committed') {
    return (
      <>
        <button
          className="bg-black rounded text-white text-sm px-4 py-2 hover:opacity-50 disabled:opacity-10"
          onClick={() => onConfirm()}
          disabled={isLoading}
        >
          Confirm Order
        </button>
      </>
    );
  } else {
    return <div></div>;
  }
}

function PurchaseTile(props: {
  purchase: OfferData;
  setTxHash: (_: any) => void;
}) {
  const account = useAccount();
  //const chainId = useChainId();
  //const offers = useOrderOffersFrom(order.address, account.data?.address ?? '');
  const methods = useOrderMethods(props.purchase.order.address);

  async function onCancel(index: string) {
    const cancelTx = await methods.cancel.writeAsync({
      args: [index],
      overrides: {
        gasLimit: 100000,
      },
    });

    await cancelTx.wait();
    console.log('canceled');
  }

  async function onWithdraw(index: string) {
    const withdrawTx = await methods.withdrawOffer.writeAsync({
      args: [index],
      overrides: {
        gasLimit: 100000,
      },
    });

    props.setTxHash(withdrawTx.hash);
    await withdrawTx.wait();
    props.setTxHash('');
    console.log('withdrawn');
  }

  let currentState =
    props.purchase.history[props.purchase.history.length - 1].state;
  // console.log(methods);
  return (
    <div
      className={`flex flex-row h-32 border gap-2 bg-${
        currentState === 'Withdrawn' ? 'gray-100' : 'white'
      }`}
    >
      <img
        className="h-full w-32 object-cover rounded-t mr-2"
        src={getPrimaryImageLink(props.purchase.order)}
        alt="item"
      />
      <div className="flex flex-col">
        <div className="font-serif text-lg mt-2">
          {props.purchase.order.title}
        </div>
        <div className="flex flex-row justify-between my-auto gap-4">
          <div className="flex flex-col md:w-40">
            <div className="text-xs font-mono text-gray-400">Ordered</div>
            <div className="text-sm md:whitespace-nowrap">
              {dayjs
                .unix(Number.parseInt(props.purchase.history[0].timestamp))
                .format('MMM D YYYY, h:mm a')}
            </div>
          </div>
          <div className="flex flex-col">
            <div className="text-xs font-mono text-gray-400 md:w-40">
              Status
            </div>
            <div className="flex flex-row gap-1">
              <div className="text-sm">{currentState}</div>
              {/* <div className="text-sm text-gray-400 md:whitespace-nowrap">
                  Expires{' '}
                  {purchases.data[2].acceptedAt
                    ? purchases.data[2].acceptedAt + purchases.data[2].timeout
                    : ''}
                </div> */}
            </div>
          </div>
          <div className="flex flex-col">
            <div className="text-xs font-mono text-gray-400 w-60">Price</div>
            <div className="text-sm md:whitespace-nowrap">
              {toUIString(
                BigNumber.from(props.purchase.price),
                props.purchase.order.tokensSuggested[0].decimals
              )}{' '}
              {props.purchase.order.tokensSuggested[0].symbol}
            </div>
          </div>
          <div className="mr-4 w-40">
            <ActionButtons
              key={props.purchase.index + props.purchase.uri}
              offer={props.purchase}
              order={props.purchase.order}
              onCancel={onCancel}
              onWithdraw={onWithdraw}
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
    .slice(0)
    .reverse()
    .map((purchase: OfferData) => {
      return <PurchaseTile purchase={purchase} setTxHash={props.setTxHash} />;
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
