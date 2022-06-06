import {
  BanIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  PlusIcon,
  RefreshIcon,
} from '@heroicons/react/solid';
import { BigNumber } from 'ethers';
import { fromBn } from 'evm-bn';
import Link from 'next/link';
import { Dispatch, SetStateAction, Suspense, useEffect, useState } from 'react';
import { useAccount, useSigner } from 'wagmi';
import { ConnectWalletLayout, Footer } from '../../components/Layout';
import { FadeIn } from '../../components/FadeIn';
import cn from 'classnames';
import dayjs from 'dayjs';
import { OfferData, useAllOrderOffers, useOrderMethods } from '../../lib/useOrder';
import nacl from 'tweetnacl';
import { useEncryptionKeypair } from '../../lib/useEncryptionKey';
import { KeyStoreConnectedButton, WalletConnectedButton } from '../../components/Buttons';
import { formatTokenAmount, useTokenMethods } from '../../lib/tokens';

function Spinner(props: { className?: string }) {
  return (
    <svg
      className={'animate-spin h-4 w-4 text-white ' + props.className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
}

function Offer(props: { offer: OfferData, setTxHash: Dispatch<SetStateAction<string>> }) {
  const sellersEncryptionKeypair = useEncryptionKeypair();
  const signer = useSigner();
  const [loadingMessage, setLoadingMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [decryptedMessage, setDecryptedMessage] = useState('');
  const orderMethods = useOrderMethods(props.offer.order.address);
  const tokenMethods = useTokenMethods(props.offer.tokenAddress);
  const offer = props.offer;

  useEffect(() => {
    if (sellersEncryptionKeypair) {
      try {
        const decrypted = nacl.box.open(
          Buffer.from(offer.message, 'hex'),
          Buffer.from(offer.messageNonce, 'hex'),
          Buffer.from(offer.messagePublicKey, 'hex'),
          sellersEncryptionKeypair.secretKey
        );
        setDecryptedMessage(Buffer.from(decrypted!).toString());
      } catch (error) {
        console.log(error);
      }
    }
  });

  async function onCommit() {
    if (!signer || !signer.data || loadingMessage) return;

    setLoadingMessage(`Requesting ${formatTokenAmount(offer.sellersStake, offer.token)} ${offer.token.symbol}`);
    const approveTxHash = await approveTokens();
    if (!approveTxHash) return;

    setLoadingMessage(`Committing`);
    const submitTxHash = await commit();
    if (!submitTxHash) return;

    setLoadingMessage('');
  }

  async function approveTokens(): Promise<string | undefined> {
    try {
      const tx = await tokenMethods.approve.writeAsync({
        args: [props.offer.order.address, props.offer.sellersStake],
      });

      props.setTxHash(tx.hash);
      await tx.wait();
      props.setTxHash('');
      return tx.hash;
    } catch (error) {
      setErrorMessage("Error Approving");
      console.log(error);
      return undefined;
    }
  }

  async function commit(): Promise<string | undefined> {
    try {
      const tx = await orderMethods.commit.writeAsync({
        args: [offer.taker, offer.index]
      });

      props.setTxHash(tx.hash);
      await tx.wait();
      props.setTxHash('');
      return tx.hash;
    } catch (error) {
      setErrorMessage("Error Committing");
      console.log(error);
      return undefined;
    }
  }

  let status = (
    <>
      <div className="text-xs flex py-2 border-gray-600 text-gray-600">
        Offer Placed <CheckCircleIcon className="h-4 w-4 ml-2" />
      </div>
      <ChevronRightIcon className="h-4 w-4 text-gray-400" />

    </>
  );
  if (offer.state === 'Committed') {
    status = (
      <>
        <div className="text-xs flex py-2 border-gray-600 text-gray-600">
          Submitted <CheckCircleIcon className="h-4 w-4 ml-2" />
        </div>
        <ChevronRightIcon className="h-4 w-4 text-gray-400" />

        <div
          className={cn({
            'text-xs flex  py-2 border-gray-600 text-gray-600': true,
            'opacity-50': offer.state !== 'Committed',
          })}
        >
          Accepted <CheckCircleIcon className="h-4 w-4 ml-2" />
        </div>
        <ChevronRightIcon className="h-4 w-4 text-gray-400" />

        {/* <button className="border rounded text-sm px-4 py-1">
          Ask to cancel
        </button> */}

        <div
          className={cn({
            'text-xs flex  py-2 border-gray-600 text-gray-600 opacity-50': true,
          })}
        >
          Awaiting Confirmation
        </div>
      </>
    );
  }
  if (offer.state === 'Canceled') {
    status = (
      <>
        <div className="text-xs flex py-2 border-gray-600 text-gray-600">
          Submitted <CheckCircleIcon className="h-4 w-4 ml-2" />
        </div>
        <ChevronRightIcon className="h-4 w-4 text-gray-400" />

        <div
          className={cn({
            'text-xs flex  py-2 border-gray-600 text-gray-600': true,
          })}
        >
          Accepted <CheckCircleIcon className="h-4 w-4 ml-2" />
        </div>
        <ChevronRightIcon className="h-4 w-4 text-gray-400" />

        <div
          className={cn({
            'text-xs flex  py-2 border-gray-600 text-gray-600': true,
          })}
        >
          Canceled <BanIcon className="h-4 w-4 ml-2" />
        </div>
      </>
    );
  }

  return (
    <FadeIn className="flex flex-col py-2">
      <div className="bg-white border">
        <div className="flex gap-2 items-center p-4 border-b px-4">
          <div className="text-xs flex py-2 border-gray-600 text-gray-600">
            Offer Placed <CheckCircleIcon className="h-4 w-4 ml-2" />
          </div>
          <ChevronRightIcon className="h-4 w-4 text-gray-400" />
          {offer.state == 'Open' && <>
            {!loadingMessage && !errorMessage && <>
              <button
                className="bg-black text-sm text-white px-4 py-1 flex justify-between font-bold rounded"
                onClick={() => onCommit().catch(console.error)}
              >
                <div className='mr-1'>Commit</div>
                <div hidden={offer.sellersStake == "0"}>{`${formatTokenAmount(offer.sellersStake, offer.token)} ` + offer.token.symbol}</div>
              </button>
            </>}
            {loadingMessage && !errorMessage && <>
              <button
                className="cursor-wait text-sm border px-4 py-1 flex justify-center font-bold rounded"
              >
                <div className='mr-1'>{loadingMessage}</div>
                <RefreshIcon className="animate-spin h-4 w-4 ml-2 my-auto" />
              </button>
            </>}
            {errorMessage && <>
              <button
                className="cursor-not-allowed text-sm bg-red-500 text-white px-4 py-1 flex justify-center font-bold rounded"
              >
                <div>{errorMessage}</div>
              </button>
            </>}
          </>}
          {offer.state == 'Committed' && <>
            <div className="text-xs flex py-2 border-gray-600 text-gray-600">
              Offer Committed <CheckCircleIcon className="h-4 w-4 ml-2" />
            </div>
            <ChevronRightIcon className="h-4 w-4 text-gray-400" />
            <div className="text-xs flex py-2 border-gray-600 text-gray-600 opacity-50">
              Offer Confirmed <div className="h-4 w-4 border ml-2 rounded-full border-gray-600"></div>
            </div>
          </>}
          {offer.state == 'Confirmed' && <>
            <div className="text-xs flex py-2 border-gray-600 text-gray-600">
              Offer Committed <CheckCircleIcon className="h-4 w-4 ml-2" />
            </div>
            <ChevronRightIcon className="h-4 w-4 text-gray-400" />
            <div className="text-xs flex py-2 border-gray-600 text-gray-600">
              Offer Confirmed <CheckCircleIcon className="h-4 w-4 ml-2" />
            </div>
          </>}
        </div>

        <div className="flex px-4 pt-4">
          <div className="flex flex-col">
            <div className="text-gray-500 text-xs">Ordered on</div>
            <div className="text-lg font-serif">
              {dayjs.unix(Number.parseInt(offer.timestamp)).format("MMM D YYYY, h:mm a")}
            </div>
          </div>
        </div>
        <div className="flex gap-4 justify-between p-4">
          <div className="flex-1">
            <div className="text-gray-500 text-xs">Quantity</div>
            <div className="text-lg font-mono">1</div>
          </div>
          <div className="flex-1">
            <div className="text-gray-500 text-xs">Price</div>
            <div className="text-lg font-mono">
              {fromBn(
                BigNumber.from(props.offer.price),
                offer.order.tokensSuggested[0].decimals
              )}{' '}
              <span className="text-sm">{offer.order.tokensSuggested[0].symbol}</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-gray-500 text-xs">You Stake</div>
            <div className="text-lg font-mono">
              {fromBn(
                BigNumber.from(props.offer.sellersStake),
                offer.order.tokensSuggested[0].decimals
              )}{' '}
              <span className="text-sm">{offer.order.tokensSuggested[0].symbol}</span>
            </div>
          </div>
        </div>
        {decryptedMessage && <div className='p-4'>
          <div className="text-gray-500 text-xs text-wrap mb-4">Offer Data</div>
          <div className='font-mono text-base bg-gray-100 p-4'>
            {decryptedMessage}
          </div>
        </div>
        }
        {!decryptedMessage && <div className='p-4'>
          <div className="text-gray-500 text-xs text-wrap mb-4">Offer Data Unavailable</div>
        </div>
        }
      </div>
    </FadeIn>
  );
}

export default function Page() {
  const [txHash, setTxHash] = useState('');

  const account = useAccount();
  const orders = useAllOrderOffers(account.data?.address || '');

  if (orders.error) {
    return <pre>{JSON.stringify(orders.error, null, 2)}</pre>;
  }

  if (!orders.data) {
    return null;
  }

  if (orders.data.length === 0) {
    return <div className="text-gray-500">There are no open offers.</div>;
  }

  // Parse offers from orders
  let offers: Array<OfferData> = new Array<OfferData>();
  for (const order of orders.data) {
    offers = offers.concat(order.offers);
  }
  const allOffers = offers.map((offer: OfferData) => {
    return <Offer key={`${offer.index}${offer.taker}${offer.acceptedAt}`} offer={offer} setTxHash={setTxHash} />;
  });

  return (
    <ConnectWalletLayout txHash={txHash}>
      <div className="h-full flex flex-col">
        <Suspense fallback={<div></div>}>
          <div className=" p-4 max-w-6xl mx-auto w-full mt-8">
            <div className="pb-8">
              <h1 className="font-serif text-2xl pb-1">Sell to the world</h1>
              <p className="pb-4">Learn more about Sell Orders.</p>
              <div className="flex">
                <Link href="/sell/new">
                  <a className="bg-black text-white px-4 py-2 rounded flex items-center gap-2 justify-between">
                    New Sell Order <PlusIcon className="h-4 w-4 ml-2" />
                  </a>
                </Link>
              </div>
            </div>
          </div>
          <div className="flex-1 bg-gray-50 border-t">
            <div className="max-w-6xl mx-auto p-4">
              <WalletConnectedButton>
                <KeyStoreConnectedButton>
                  <h1 className="font-serif text-xl pb-2">Incoming Offers</h1>
                  <FadeIn className="">{allOffers}</FadeIn>
                </KeyStoreConnectedButton>
              </WalletConnectedButton>
            </div>
          </div>
        </Suspense>
        <Footer />
      </div>
    </ConnectWalletLayout>
  );
}