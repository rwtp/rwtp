import create from 'zustand';
import { persist } from 'zustand/middleware';

type EncryptionState = {
  privateKey?: Uint8Array;
  setPrivateKey: (_privateKey: Uint8Array) => void;
};

/**
 * A "useState" for encryption state that can be accessed anywhere.
 */
export const useEncryptionStore = create<EncryptionState>()(
  persist(
    (set: any) => ({
      setPrivateKey: (privateKey: Uint8Array) => set({ privateKey }),
    }),
    {
      name: 'encryption',
    }
  )
);
