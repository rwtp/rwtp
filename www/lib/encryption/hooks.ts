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
      ? nacl.box.keyPair.fromSecretKey(toUint8Array(store.privateKey))
      : undefined,
  };
}

function toUint8Array(obj: any) {
  if (Array.isArray(obj)) {
    return Uint8Array.from(obj);
  }

  // When storing a Uint8Array in local storage, it sometimes gets converted
  // into an "object" where the keys are the indices of the array.
  if (typeof obj === 'object') {
    return Uint8Array.from(Object.values(obj));
  }

  throw new Error("Can't convert object to Uint8Array.");
}
