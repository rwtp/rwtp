import * as nacl from 'tweetnacl';
import { useKeystore, useKeystoreGet } from './keystore';

const ENCRYPTION_KEY = 'encryptionKey';

/**
 * Grab an encryption key from the keystore
 */
export function useEncryptionKey() {
  const key = useKeystoreGet(ENCRYPTION_KEY);

  let keypair: nacl.SignKeyPair | undefined;
  if (key.data) {
    const secretKey = Uint8Array.from(Buffer.from(key.data, 'hex'));
    keypair = nacl.sign.keyPair.fromSecretKey(secretKey);
  }

  function createKeypair() {}

  return {
    ...key,
    keypair,
  };
}
