import {
  ChevronDoubleRightIcon,
  ChevronRightIcon,
  FingerPrintIcon,
  SwitchHorizontalIcon,
} from '@heroicons/react/solid';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Image from 'next/image';
import Link from 'next/link';
import { FadeIn } from './FadeIn';
import cn from 'classnames';
import { useRouter } from 'next/router';

export function InformationPageHeader() {
  return (
    <div className="flex justify-between px-4 z-50 relative">
      <div className="flex items-center ">
        <Image src="/transitionLogo.png" width={24} height={24} />
      </div>
      <div className="gap-2 flex items-center">
        <a className="text-sm flex py-1 px-1 rounded" href="/buy">
          Buy
        </a>
        <a className="text-sm flex py-1 px-1 rounded" href="/sell">
          Sell
        </a>
        <a
          className="text-sm border flex py-1 px-2 rounded bg-white"
          href="/docs"
        >
          Docs
        </a>

        <a
          href="https://github.com/rwtp/rwtp"
          className="flex items-center px-1"
        >
          <Image src={'/github.svg'} width={16} height={16} />
        </a>
        <a
          href="https://twitter.com/realworldtrade"
          className="flex items-center px-1"
        >
          <Image src={'/twitter.svg'} width={16} height={16} />
        </a>
      </div>
    </div>
  );
}

export function TabBar(props: { tab: 'buy' | 'sell' }) {
  return (
    <div className=" border-b w-full flex pt-2">
      <div className="flex gap-4 max-w-6xl mx-auto w-full px-4">
        <Link href="/buy">
          <a
            className={cn({
              'pb-1': true,
              'border-b border-black text-black': props.tab === 'buy',
              'text-gray-500 border-b border-white': props.tab !== 'buy',
            })}
          >
            Buy
          </a>
        </Link>
        <Link href="/sell">
          <a
            className={cn({
              'pb-1': true,
              'border-b border-black text-black': props.tab === 'sell',
              'text-gray-500 border-b border-white': props.tab !== 'sell',
            })}
          >
            Sell
          </a>
        </Link>
      </div>
    </div>
  );
}

export function ConnectWalletLayout(props: {
  requireConnected: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-col h-full">
      <div className="flex px-4 py-4  justify-between items-center w-full max-w-6xl mx-auto w-full">
        <div className="flex items-center">
          <Link href="/">
            <a className="flex items-center justify-center">
              <Image width={24} height={24} src="/transitionLogo.png" />
            </a>
          </Link>
        </div>

        <div className="flex items-center gap-2 ">
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
                      Connect Wallet{' '}
                      <FingerPrintIcon className="h-4 w-4 ml-2" />
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
                  <FadeIn className="flex items-center gap-2">
                    <button
                      className="bg-white border text-sm border-gray-200 rounded px-2 py-1 flex items-center font-mono hover:opacity-50"
                      onClick={() => openChainModal()}
                    >
                      {chain.name}
                      <SwitchHorizontalIcon className="h-4 w-4 ml-2" />
                    </button>
                    <button
                      className="bg-white border text-sm border-gray-200 rounded px-2 py-1 flex items-center font-mono hover:opacity-50"
                      onClick={() => openAccountModal()}
                    >
                      {account.ensName ? account.ensName : keyDetails}
                      <FingerPrintIcon className="h-4 w-4 ml-2" />
                    </button>
                  </FadeIn>
                );
              }}
            </ConnectButton.Custom>
          </div>

          <a
            href="/sell"
            className={cn({
              'flex px-4 rounded text-sm py-1': true,
              'bg-black text-white': router.pathname.startsWith('/sell'),
              border: !router.pathname.startsWith('/sell'),
            })}
          >
            Sell
          </a>
          <a
            href="/buy"
            className={cn({
              'flex px-4 rounded text-sm py-1': true,
              'bg-black text-white': router.pathname.startsWith('/buy'),
              border: !router.pathname.startsWith('/buy'),
            })}
          >
            Buy
          </a>
        </div>
      </div>
      <div className="h-full bg-white">
        <ConnectButton.Custom>
          {({ account, mounted, chain, openConnectModal, openChainModal }) => {
            if (
              !props.requireConnected ||
              (mounted && account && chain && !chain?.unsupported)
            ) {
              return <>{props.children}</>;
            } else if (chain && chain.unsupported) {
              return (
                <div className="flex flex-col border justify-center h-full">
                  <button
                    className="w-min bg-white border border-black rounded px-2 py-1 flex items-center whitespace-nowrap mx-auto"
                    onClick={openChainModal}
                  >
                    Wrong Network{' '}
                    <SwitchHorizontalIcon className="h-4 w-4 ml-2" />
                  </button>
                </div>
              );
            } else {
              return (
                <div className="flex flex-col border justify-center h-full">
                  <button
                    className="w-min bg-white border border-black rounded px-2 py-1 flex items-center whitespace-nowrap mx-auto"
                    onClick={openConnectModal}
                  >
                    Connect Wallet <FingerPrintIcon className="h-4 w-4 ml-2" />
                  </button>
                </div>
              );
            }
          }}
        </ConnectButton.Custom>
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <div className="flex px-4 py-2 bg-black text-sm text-gray-200 gap-2">
      <div className="flex gap-2 text-center w-full">
        RWTP is currently unaudited protocol; use at your own risk.
      </div>
    </div>
  );
}
