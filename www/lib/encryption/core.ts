import { Signer } from 'ethers';
import { signatureToPrivateKey } from 'rwtp';
import { BoxKeyPair } from 'tweetnacl';

// Creates an encryption key
export async function createEncryptionKey(signer: Signer, scope: string) {
  const sig = await signer.signMessage(scope);
  return signatureToPrivateKey(sig);
}

export function keyAsHex(keypair: BoxKeyPair) {
  return {
    publicKeyAsHex: Buffer.from(keypair.publicKey).toString('hex'),
    secretKeyAsHex: Buffer.from(keypair.secretKey).toString('hex'),
  };
}
