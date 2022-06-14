import { Signer } from 'ethers';
import { signatureToPrivateKey } from 'rwtp';

// Creates an encryption key
export async function createEncryptionKey(signer: Signer, scope: string) {
  const sig = await signer.signMessage(scope);
  return signatureToPrivateKey(sig);
}
