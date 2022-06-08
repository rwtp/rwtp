import { Signer } from 'ethers';
import * as nacl from 'tweetnacl';

const ENCRYPTION_KEY = 'encryptionKey:0';

interface LoginDetails {
  login: () => Promise<string>;
  isLoading: boolean;
  isLoggedIn: boolean;
  token: string | null;
}

interface WalletMockImpl {
  signer: Signer;
  address: string | undefined;
  setSig: (_sig: string) => void;
}

export function keystoreLogin(walletMock: WalletMockImpl) {
  function toToken(address: string, sig: string): string | null {
    if (!address || !sig) return null;
    return Buffer.from(`${address}:${sig}`).toString('base64');
  }

  async function loginCheck(address: string, sig: string): Promise<boolean> {
    if (!address || !sig) return false;
    const token = toToken(address, sig);
    if (!token) return false;

    const res = await fetch('https://kv.rwtp.workers.dev/whoami', {
      headers: {
        Authorization: `Basic ${token}`,
      },
    });

    return res.status === 200;
  }

  async function login(): Promise<string> {
    const result = await fetch(
      'https://kv.rwtp.workers.dev/challenge/' +
        (await walletMock.signer.getAddress()),
      {
        method: 'POST',
      }
    );
    const challenge = await result.text();
    const sig = await walletMock.signer.signMessage(challenge);
    walletMock.setSig(sig);
    return sig;
  }

  return {
    login,
    toToken,
    loginCheck,
  };
}

export function keystoreConstructor(loginDetails: LoginDetails) {
  async function put(key: string, value: string) {
    if (!loginDetails.isLoggedIn) {
      throw new Error("Can't put while not logged in.");
    }

    const res = await fetch('https://kv.rwtp.workers.dev/put/' + key, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${loginDetails.token}`,
      },
      body: value,
    });

    if (res.status !== 200) {
      throw new Error(await res.text());
    }
  }

  async function get(key: string): Promise<string> {
    if (!loginDetails.isLoggedIn) {
      throw new Error("Can't get while not logged in.");
    }

    const res = await fetch('https://kv.rwtp.workers.dev/get/' + key, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${loginDetails.token}`,
      },
    });

    if (res.status !== 200) {
      throw new Error(await res.text());
    }

    return await res.text();
  }

  return {
    login: async function () {
      await loginDetails.login;
    },
    isLoggedIn: loginDetails.isLoggedIn,
    isLoading: loginDetails.isLoading,
    put,
    get,
  };
}

export async function getEncryptionKeyPair(keystore: any) {
  const result = await keystore.get(ENCRYPTION_KEY);
  if (!result) {
    let keypair = nacl.box.keyPair();
    let secretKey = Buffer.from(keypair.secretKey).toString('hex');
    await keystore.put(ENCRYPTION_KEY, secretKey);
    return keypair;
  }

  const secretKey = Uint8Array.from(Buffer.from(result, 'hex'));
  const keypair = nacl.box.keyPair.fromSecretKey(secretKey);
  return keypair;
}

export function encryptionKeypairExpanded(encryptionKeypair: nacl.BoxKeyPair) {
  return {
    ...encryptionKeypair,
    publicKeyAsHex: Buffer.from(encryptionKeypair.publicKey).toString('hex'),
    secretKeyAsHex: Buffer.from(encryptionKeypair.secretKey).toString('hex'),
  };
}

interface EncryptionMessage {
  receiverPublicEncryptionKey: string;
  secretData: string;
  senderPrivatekey: Uint8Array;
}

interface EncryptedMessage {
  nonce: Uint8Array,
  // Message that is encrypted
  encrypted: Uint8Array
}

export function encryptMessage(msg: EncryptionMessage): EncryptedMessage {
  const secretDataUTF8 = Buffer.from(msg.secretData, 'utf-8');
  const nonce = nacl.randomBytes(24);
  const sellersPublicEncryptionKey = Uint8Array.from(
    Buffer.from(msg.receiverPublicEncryptionKey, 'hex')
  );
  const encrypted = nacl.box(
    secretDataUTF8,
    nonce,
    sellersPublicEncryptionKey,
    msg.senderPrivatekey
  );
  return {
    nonce,
    encrypted
  };
}

export function formatMessageForUpload(msg: EncryptedMessage, publicKey: Uint8Array) {
  return {
    publicKey: Buffer.from(publicKey).toString(
      'hex'
    ),
    nonce: Buffer.from(msg.nonce).toString('hex'),
    message: Buffer.from(msg.encrypted).toString('hex'),
  };
}