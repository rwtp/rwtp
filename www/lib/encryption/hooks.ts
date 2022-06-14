import { useSigner } from 'wagmi';
import { useCallback } from 'react';
import { createEncryptionKey } from './core';
import { useEncryptionStore } from './store';
import nacl from 'tweetnacl';

const message = `Sign this message if you trust this application to access private information, such as names, addresses, and emails. It costs nothing to sign this message.`;

export function useEncryption() {
  const signer = useSigner();
  const store = useEncryptionStore();
  const hasKey = !!store.privateKey;

  // Creates an encryption key, and stores it.
  const generate = useCallback(async () => {
    if (!signer.data) {
      console.error('Signer does not exist');
      return;
    }
    const key = await createEncryptionKey(signer.data, message);

    store.setPrivateKey(key);
  }, [signer.data, store]);

  return {
    generate,
    hasKey,
    keypair: store.privateKey
      ? nacl.box.keyPair.fromSecretKey(store.privateKey)
      : undefined,
  };
}
