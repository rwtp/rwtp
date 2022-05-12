import {
  ArrowRightIcon,
  FingerPrintIcon,
  LightningBoltIcon,
  SwitchHorizontalIcon,
} from '@heroicons/react/solid';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import cn from 'classnames';
import Image from 'next/image';
import Link from 'next/link';

export function ConnectWalletLayout(props: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex px-4 pb-8 pt-4 justify-between items-center w-full">
        <Link href="/app/orders">
          <a className="/">
            <Image width={24} height={24} src="/transitionLogo.png" />
          </a>
        </Link>

        <div className="flex items-center gap-2">
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
      </div>
      <div className="h-full">{props.children}</div>
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
