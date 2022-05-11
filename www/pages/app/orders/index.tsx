import {
  FingerPrintIcon,
  LightningBoltIcon,
  SwitchHorizontalIcon,
} from '@heroicons/react/solid';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import cn from 'classnames';
import Image from 'next/image';
import Link from 'next/link';
import {
  SellOrderData,
  useSellOrder,
  useSellOrders,
} from '../../../lib/useSellOrder';

function Layout(props: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex px-4 pb-8 pt-4 justify-between items-center w-full">
        <Image width={24} height={24} src="/transitionLogo.png" />

        <div>
          <ConnectButton.Custom>
            {({
              account,
              mounted,
              chain,
              openConnectModal,
              openChainModal,
              openAccountModal,
            }) => {
              if (!mounted || !account || !chain) {
                return (
                  <button
                    className="bg-white border text-sm border-black rounded px-2 py-1 flex items-center"
                    onClick={openConnectModal}
                  >
                    Connect Wallet <FingerPrintIcon className="h-4 w-4 ml-2" />
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    className="bg-white border text-sm border-black rounded px-2 py-1 flex items-center"
                    onClick={openChainModal}
                  >
                    Wrong Network{' '}
                    <SwitchHorizontalIcon className="h-4 w-4 ml-2" />
                  </button>
                );
              }

              const keyDetails = (
                <>
                  <span className="text-gray-400">0x</span>
                  {account.address.substring(2, 6)}
                  <span className="text-gray-400">...</span>
                  {account.address.substring(
                    account.address.length - 4,
                    account.address.length
                  )}
                </>
              );

              return (
                <div className="flex items-center gap-2">
                  <button
                    className="bg-white border text-sm border-black rounded px-2 py-1 flex items-center font-mono hover:opacity-50"
                    onClick={() => openChainModal()}
                  >
                    {chain.name}
                    <SwitchHorizontalIcon className="h-4 w-4 ml-2" />
                  </button>
                  <button
                    className="bg-white border text-sm border-black rounded px-2 py-1 flex items-center font-mono hover:opacity-50"
                    onClick={() => openAccountModal()}
                  >
                    {account.ensName ? account.ensName : keyDetails}
                    <FingerPrintIcon className="h-4 w-4 ml-2" />
                  </button>
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </div>
      {props.children}
    </div>
  );
}

interface SellOrder {
  address: string;
  title: string;
  description: string;
  sellersStake: number;
  buyersStake: number;
  price: number;
  token: string;
  encryptionPublicKey: string;
}

function Tag(props: {
  children: React.ReactNode;
  type: 'danger' | 'success' | 'warning' | 'info';
}) {
  return (
    <div
      className={cn({
        'border text-sm px-2 py-px': true,
        'bg-green-50 border-green-200': props.type === 'success',
        'bg-blue-50 border-blue-200': props.type === 'info',
        'bg-yellow-50 border-yellow-200': props.type === 'warning',
        'bg-red-50 border-red-200': props.type === 'danger',
      })}
    >
      {props.children}
    </div>
  );
}

function OrderView(props: { order: SellOrder }) {
  return (
    <div className="py-2">
      <div className="flex gap-2 items-center justify-between">
        {props.order.sellersStake <= props.order.price * 0.5 && (
          <Tag type="danger">Risky</Tag>
        )}
        <a
          className="underline font-serif"
          href={`/app/orders/${props.order.address}/checkout`}
        >
          {props.order.title}
        </a>
        <div className="h-px bg-black w-full flex-1" />
        <Tag type="info">Deposit $2</Tag>
        <Tag type="info">Price $20</Tag>
      </div>
    </div>
  );
}

function Results() {
  const sellOrders = useSellOrders({
    first: 10,
    skip: 0,
  });

  if (!sellOrders.data) {
    return null;
  }

  const orders = sellOrders.data
    .filter((s: any) => !!s.title) // filter ones without titles
    .map((sellOrder: any) => {
      return (
        <OrderView
          key={sellOrder.address}
          order={{
            address: sellOrder.address,
            title: sellOrder.title,
            description: sellOrder.description,
            sellersStake: +sellOrder.sellersStake,
            buyersStake: +sellOrder.stakeSuggested,
            price: +sellOrder.priceSuggested,
            token: sellOrder.token.address,
            encryptionPublicKey: '',
          }}
        />
      );
    });

  return <>{orders}</>;
}

export default function Page() {
  return (
    <Layout>
      <div className="h-full p-4">
        <h1 className="font-serif text-2xl pb-2">Recent Sell Orders</h1>
        <p className="pb-8">This list may be incomplete.</p>
        <Results />
      </div>
      <div className="bg-black text-gray-300 text-sm px-4 py-2">
        {/* <Link href={'https://github.com/rwtp/rwtp'}>
          <a className="underline">Edit this website</a>
        </Link>

        <Link href={'https://discord.gg/ekBqgYG2GW'}>
          <a className="underline">Discord</a>
        </Link> */}
      </div>
    </Layout>
  );
}
