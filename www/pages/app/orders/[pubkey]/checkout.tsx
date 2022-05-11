import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useRouter } from 'next/router';
import { BigNumber } from 'ethers';
import { Suspense, useState } from 'react';
import Image from 'next/image';
import {
  SellOrderData,
  useSellOrder,
  useSellOrderMethods,
} from '../../../../lib/useSellOrder';
import { useTokenMethods } from '../../../../lib/tokens';
import { postToIPFS } from '../../../../lib/ipfs';
import { fromBn, toBn } from 'evm-bn';
import { useAccount, useClient } from 'wagmi';
import { ArrowLeftIcon } from '@heroicons/react/solid';

function ConnectWalletButton(props: {
  children: React.ReactNode;
  onClick: () => void;
  className: string;
}) {
  return (
    <ConnectButton.Custom>
      {({ account, mounted, chain, openConnectModal, openChainModal }) => {
        function onClick() {
          if (!mounted || !account || !chain) {
            return openConnectModal();
          }

          if (chain?.unsupported) {
            return openChainModal();
          }

          props.onClick();
        }

        return (
          <button className={props.className} onClick={onClick}>
            {account && mounted && chain ? props.children : 'Connect Wallet'}
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
}

function BuyPage({ sellOrder }: { sellOrder: SellOrderData }) {
  const tokenMethods = useTokenMethods(sellOrder.token.address);
  const sellOrderMethods = useSellOrderMethods(sellOrder.address);

  const [email, setEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');

  const quantity = 1;
  const price = sellOrder.priceSuggested
    ? BigNumber.from(sellOrder.priceSuggested)
    : BigNumber.from(0);
  const stake = sellOrder.stakeSuggested
    ? BigNumber.from(sellOrder.stakeSuggested)
    : BigNumber.from(0);

  async function onBuy() {
    if (!email || !shippingAddress) return;

    const cid = await postToIPFS({
      // A random number makes it so the same shipping information
      // doesn't encrypt to the same string, which could then be
      // used as PII to stalk or harm a buyer.
      nonce: Math.random(),
      email,
      shippingAddress,
    });

    const approveTx = await tokenMethods.approve.writeAsync({
      args: [sellOrder.address, price.add(stake).mul(quantity)],
    });
    await approveTx.wait();

    const tx = await sellOrderMethods.submitOffer.writeAsync({
      args: [0, quantity, price, stake, 'ipfs://' + cid],
      overrides: {
        gasLimit: 200000,
      },
    });

    const receipt = await tx.wait();
    console.log(receipt);
  }

  return (
    <div className="h-full w-full flex flex-col">
      <div className="h-full flex w-full">
        <div className="flex w-full border-l border-r mx-auto">
          <div className="flex-1 justify-center flex flex-col bg-gray-50 items-center">
            <div>
              <div className="flex">
                <a
                  href="/app/orders"
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
            <label className="flex flex-col mt-2">
              <div className="text-xs font-bold py-1">Shipping Address</div>
              <input
                type={'text'}
                className={'px-2 py-2 border rounded'}
                name="address"
                placeholder="100 Saddle Point; San Fransokyo, CA 94112"
                onChange={(e) => setShippingAddress(e.target.value)}
              />
            </label>

            <label className="flex flex-col  mt-2">
              <div className="text-xs font-bold py-1">Email</div>
              <input
                type={'text'}
                className={'px-2 py-2 border rounded'}
                name="address"
                placeholder="you@ethereum.org"
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <div className="mt-4">
              <ConnectWalletButton
                className="bg-black text-white px-4 py-2 rounded w-full justify-between flex"
                onClick={() => onBuy().catch(console.error)}
              >
                <div>Buy</div>
                <div>{fromBn(price, sellOrder.token.decimals)}</div>
              </ConnectWalletButton>
              <div className="text-sm mt-4 text-gray-500">
                If this item doesn't ship to you, the seller be fined{' '}
                <span className="font-bold">
                  {fromBn(
                    toBn(sellOrder.sellersStake, sellOrder.token.decimals),
                    sellOrder.token.decimals
                  )}{' '}
                  {sellOrder.token.symbol}.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
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
      <PageWithPubkey pubkey={pubkey} />
    </Suspense>
  );
}
