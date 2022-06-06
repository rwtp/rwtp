import {
  FingerPrintIcon,
  RefreshIcon,
  SwitchHorizontalIcon,
} from '@heroicons/react/solid';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { BigNumber } from 'ethers';
import { useRouter } from 'next/router';
import React from 'react';
import { useAccount, useNetwork } from 'wagmi';
import { useKeystoreLogin } from '../lib/keystore';
import { useTokenMethods } from '../lib/tokens';
import { useChainId } from '../lib/useChainId';
import { ERC20Data } from '../lib/useOrder';
import { KeystoreModal } from './KeystoreModal';

// Wallet connected button wrapper
export function WalletConnectedButton(props: { children: React.ReactNode }) {
  const chainId = useChainId();
  const { switchNetwork } = useNetwork();

  return (
    <>
      <ConnectButton.Custom>
        {({ account, mounted, chain, openConnectModal }) => {
          if (!mounted || !account || !chain || !switchNetwork) {
            return (
              <button
                className="bg-white border text-sm border-black rounded px-4 py-3 flex justify-center items-center w-full"
                onClick={openConnectModal}
              >
                Connect Wallet <FingerPrintIcon className="h-4 w-4 ml-2" />
              </button>
            );
          }

          if (chain.id != chainId) {
            return (
              <button
                className="bg-white border text-sm border-black rounded px-4 py-3 flex justify-center items-center w-full"
                onClick={() => switchNetwork(chainId)}
              >
                Switch Network <SwitchHorizontalIcon className="h-4 w-4 ml-2" />
              </button>
            );
          }

          return <>{props.children}</>;
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

export function HasTokenBalanceButton(props: {
  children: React.ReactNode;
  tokenAmount: BigNumber;
  token: ERC20Data;
}) {
  const account = useAccount();
  const tokenContract = useTokenMethods(props.token.address);
  const { data, isLoading, isError, isSuccess } = tokenContract.useBalance(
    account.data?.address ?? ''
  );

  if (isLoading) {
    return (
      <>
        <button className="bg-white border text-sm border-black rounded px-4 py-3 flex justify-center items-center w-full">
          Checking {props.token.symbol} balance
          <RefreshIcon className="animate-spin h-4 w-4 ml-2" />
        </button>
      </>
    );
  }

  if (isError || !isSuccess) {
    return (
      <>
        <button className="cursor-not-allowed bg-red-500 text-white px-4 py-2 w-full flex justify-center font-bold rounded">
          <div>Error Retrieving Token Balance</div>
        </button>
      </>
    );
  }

  if (BigNumber.from(data).lt(props.tokenAmount)) {
    return (
      <>
        <button className="cursor-not-allowed bg-red-500 text-white px-4 py-2 w-full flex justify-center font-bold rounded">
          <div>Insufficient {props.token.symbol} Balance</div>
        </button>
      </>
    );
  }

  return <>{props.children}</>;
}