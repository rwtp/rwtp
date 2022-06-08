import { useEffect, useState } from 'react';
import * as nacl from 'tweetnacl';
import { useKeystore } from './keystore';
import { getEncryptionKeyPair, encryptionKeypairExpanded } from './keystoreLib';

/**
 * Grab an encryption key from the keystore
 */
export function useEncryptionKeypair() {
  const keystore = useKeystore();
  const [encryptionKeypair, setEncryptionKeypair] =
    useState<nacl.BoxKeyPair | null>(null);

  // linear #REAL-411 - we should use a better hook here.
  // see - https://stackoverflow.com/questions/55840294/how-to-fix-missing-dependency-warning-when-using-useeffect-react-hook
  useEffect(() => {
    async function load() {
      setEncryptionKeypair(await getEncryptionKeyPair(keystore));
    }
    load().catch(console.error);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (encryptionKeypair) {
    return encryptionKeypairExpanded(encryptionKeypair);
  } else {
    return null;
  }
}
