import { useAccount, useSigner } from 'wagmi';
import { ReactNode, useEffect, useState } from 'react';
import useSWR from 'swr';
import { useLocalStorage } from './useLocalStorage';
import { ConnectWalletLayout } from '../components/Layout';
import { ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/solid';
import { useRouter } from 'next/router';
import { FadeIn } from '../components/FadeIn';

function useKeystoreLogin() {
  const signer = useSigner();
  const account = useAccount();
  const [sig, setSig] = useLocalStorage(
    'keystore-sig:' + account.data?.address,
    ''
  );

  function toToken(address: string, sig: string) {
    if (!address || !sig) return null;
    return Buffer.from(`${address}:${sig}`).toString('base64');
  }

  // Checks in the background if we're logged in.
  const loginCheck = useSWR(
    ['https://kv.rwtp.workers.dev/whoami', account.data?.address, sig],
    async (url: string, address: string, sig: string) => {
      if (!address || !sig) return false;
      const token = toToken(address, sig);
      if (!token) return false;

      const res = await fetch(url, {
        headers: {
          Authorization: `Basic ${token}`,
        },
      });

      return res.status === 200;
    }
  );

  async function login() {
    if (!signer.data) {
      throw new Error(
        "Can't attempt to login to the keystore if the user hasn't connected their wallet."
      );
    }

    const result = await fetch(
      'https://kv.rwtp.workers.dev/challenge/' +
        (await signer.data?.getAddress()),
      {
        method: 'POST',
      }
    );
    const challenge = await result.text();
    const s = await signer.data.signMessage(challenge);
    setSig(s);
  }

  return {
    login,
    isLoading: loginCheck.data === undefined,
    isLoggedIn: !!loginCheck.data,
    token: toToken(account.data?.address || '', sig),
  };
}

/**
 * A little hook to use the keystore
 */
export function useKeystore() {
  const loginDetails = useKeystoreLogin();

  async function put(key: string, value: string) {
    if (!loginDetails.isLoggedIn) {
      throw new Error("Can't put while not logged in.");
    }

    const res = await fetch('https://kv.rwtp.workers.dev/put/' + key, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${loginDetails.token}`,
      },
      body: value,
    });

    if (res.status !== 200) {
      throw new Error(await res.text());
    }
  }

  async function get(key: string): Promise<string> {
    if (!loginDetails.isLoggedIn) {
      throw new Error("Can't get while not logged in.");
    }

    const res = await fetch('https://kv.rwtp.workers.dev/get/' + key, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${loginDetails.token}`,
      },
    });

    if (res.status !== 200) {
      throw new Error(await res.text());
    }

    return await res.text();
  }

  return {
    login: loginDetails.login,
    isLoggedIn: loginDetails.isLoggedIn,
    isLoading: loginDetails.isLoading,
    put,
    get,
  };
}

export function useKeystoreGet(key: string) {
  const login = useKeystoreLogin();

  // Checks in the background if we're logged in.
  return useSWR(
    ['https://kv.rwtp.workers.dev/get' + key, login.token],
    async (url: string, token: string, key: string) => {
      if (!token) return null;

      const res = await fetch(url, {
        headers: {
          Authorization: `Basic ${token}`,
        },
      });

      if (res.status !== 200) {
        throw new Error(await res.text());
      }

      return await res.text();
    }
  );
}

// Wrap anything needing the keystore in this hook, and it'll show
// a little screen asking someone to approve the login
export function RequiresKeystore(props: { children: ReactNode }) {
  const login = useKeystore();
  const router = useRouter();

  // Loading
  if (login.isLoading) {
    return (
      <ConnectWalletLayout>
        <div></div>
      </ConnectWalletLayout>
    );
  }

  if (login.isLoggedIn) {
    return <>{props.children}</>;
  }

  return (
    <ConnectWalletLayout>
      <FadeIn className="bg-gray-50 h-full p-4 border-t flex items-center justify-center">
        <div className="bg-white border max-w-xl mx-auto ">
          <div className="p-8">
            <h1 className="text-2xl mb-2 font-serif">
              Allow this site to handle sensitive data?
            </h1>
            <p className="pb-2 ">
              This page wants to handle personally identifiable information
              required for shipping packages, like names, emails, mailing
              addresses, and so on.
            </p>
            <div className="flex-col flex gap-2 mt-4">
              <div className="flex items-center">
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Your information is encrypted in transit and at rest.
              </div>
              <div className="flex items-center">
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                The creators of this website do not see your information.
              </div>
              <div className="flex items-center">
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                <span>
                  This website is{' '}
                  <a
                    className="underline"
                    href="https://github.com/rwtp/rwtp"
                    target="_blank"
                  >
                    {' '}
                    open source
                  </a>{' '}
                  and researchers can audit the code.
                </span>
              </div>
            </div>
          </div>

          <div className="flex px-4 pb-4 pt-4  justify-between">
            <button
              onClick={() => {
                router.back();
              }}
              className=" px-4 py-2 rounded flex items-center"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" /> Go back
            </button>
            <button
              onClick={() => {
                login.login().catch(console.error);
              }}
              className="bg-black hover:opacity-50 transition-all text-white px-4 py-2 rounded flex items-center"
            >
              Approve <CheckCircleIcon className="h-4 w-4 ml-2" />
            </button>
          </div>
        </div>
      </FadeIn>
    </ConnectWalletLayout>
  );
}
