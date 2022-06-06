import { useEffect, useState } from 'react';
import * as nacl from 'tweetnacl';
import { useKeystore } from './keystore';

const ENCRYPTION_KEY = 'encryptionKey:0';

/**
 * Grab an encryption key from the keystore
 */
export function useEncryptionKeypair() {
  const keystore = useKeystore();
  const [encryptionKeypair, setEncryptionKeypair] =
    useState<nacl.BoxKeyPair | null>(null);

  // TODO we should use a better hook here.
  // see - https://stackoverflow.com/questions/55840294/how-to-fix-missing-dependency-warning-when-using-useeffect-react-hook
  // linear #REAL-411
  useEffect(() => {
    async function load() {
      const result = await keystore.get(ENCRYPTION_KEY);
      if (!result) {
        let keypair = nacl.box.keyPair();
        let secretKey = Buffer.from(keypair.secretKey).toString('hex');
        await keystore.put(ENCRYPTION_KEY, secretKey);
        setEncryptionKeypair(keypair);
      }

      const secretKey = Uint8Array.from(Buffer.from(result, 'hex'));
      const keypair = nacl.box.keyPair.fromSecretKey(secretKey);
      setEncryptionKeypair(keypair);
    }
    load().catch(console.error);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (encryptionKeypair) {
    return {
      ...encryptionKeypair,
      publicKeyAsHex: Buffer.from(encryptionKeypair.publicKey).toString('hex'),
      secretKeyAsHex: Buffer.from(encryptionKeypair.secretKey).toString('hex'),
    };
  }

  return encryptionKeypair;
}
