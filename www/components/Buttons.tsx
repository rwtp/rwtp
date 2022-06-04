import {
  FingerPrintIcon,
  RefreshIcon,
  SwitchHorizontalIcon,
} from '@heroicons/react/solid';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useRouter } from 'next/router';
import React from 'react';
import { useKeystoreLogin } from '../lib/keystore';
import { KeystoreModal } from './KeystoreModal';

// Wallet connected button wrapper
export function WalletConnectedButton(props: { children: React.ReactNode }) {
  return (
    <>
      <ConnectButton.Custom>
        {({ account, mounted, chain, openConnectModal }) => {
          if (!mounted || !account) {
            return (
              <button
                className="bg-white border text-sm border-black rounded px-4 py-3 flex justify-center items-center w-full"
                onClick={openConnectModal}
              >
                Connect Wallet <FingerPrintIcon className="h-4 w-4 ml-2" />
              </button>
            );
          }

          const childrenWithWallet = React.Children.map(
            props.children,
            (child) =>
              React.cloneElement(child as React.ReactElement<any>, {
                account: account.address,
              })
          );
          return <>{childrenWithWallet}</>;
        }}
      </ConnectButton.Custom>
    </>
  );
}

// Keystore button wrapper
export function KeyStoreConnectedButton(props: { children: React.ReactNode }) {
  const login = useKeystoreLogin();
  const router = useRouter();

  if (login.isLoading || login.isLoggedIn == null) {
    return (
      <>
        <button className="bg-white border text-sm border-black rounded px-4 py-3 flex justify-center items-center w-full">
          Loading Keystore
          <RefreshIcon className="animate-spin h-4 w-4 ml-2" />
        </button>
      </>
    );
  }

  if (login.isLoggedIn) {
    return <>{props.children}</>;
  }

  return (
    <>
      <button className="bg-white border text-sm border-black rounded px-4 py-3 flex justify-center items-center w-full">
        Approve Keystore
      </button>
      <KeystoreModal router={router} login={login.login} />
    </>
  );
}

// TODO: Token required button wrapper
