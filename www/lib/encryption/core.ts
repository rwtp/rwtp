import { Signer } from 'ethers';
import { signatureToPrivateKey } from 'rwtp';
import nacl from 'tweetnacl';
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

export interface EncryptionParameters {
  receiverPublicEncryptionKey: string;
  senderPrivatekey: Uint8Array;
  message: string;
}

interface EncryptedMessage {
  nonce: Uint8Array;
  // Message that is encrypted
  encrypted: Uint8Array;
}

export function encrypt(args: EncryptionParameters): EncryptedMessage {
  const secretDataUTF8 = Buffer.from(args.message, 'utf-8');
  const nonce = nacl.randomBytes(24);
  const sellersPublicEncryptionKey = Uint8Array.from(
    Buffer.from(args.receiverPublicEncryptionKey, 'hex')
  );
  const encrypted = nacl.box(
    secretDataUTF8,
    nonce,
    sellersPublicEncryptionKey,
    args.senderPrivatekey
  );
  return {
    nonce,
    encrypted,
  };
}
