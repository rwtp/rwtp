import { useAccount, useSigner } from 'wagmi';
import useSWR from 'swr';
import { useLocalStorage } from './useLocalStorage';
import { keystoreConstructor, keystoreLogin } from './keystoreLib';

export function useKeystoreLogin() {
  const signer = useSigner();
  const account = useAccount();
  const [sig, setSig] = useLocalStorage(
    'keystore-sig:' + account.data?.address,
    ''
  );

  const keystore = keystoreLogin({
    signer: signer.data!,
    address: account.data?.address,
    setSig,
  });

  // Checks in the background if we're logged in.
  const loginCheck = useSWR([account.data?.address, sig], keystore.loginCheck);

  return {
    login: keystore.login,
    isLoading: loginCheck.data === undefined,
    isLoggedIn: !!loginCheck.data,
    token: keystore.toToken(account.data?.address || '', sig),
  };
}
/**
 * A little hook to use the keystore
 */
export function useKeystore() {
  const loginDetails = useKeystoreLogin();
  return keystoreConstructor(loginDetails);
}
