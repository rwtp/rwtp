import * as ethUtil from 'ethereumjs-util';
import * as sigUtil from '@metamask/eth-sig-util';

export function encryptMessage(publicKey: string, message: string) {
  return ethUtil.bufferToHex(
    Buffer.from(
      JSON.stringify(
        sigUtil.encrypt({
          publicKey: publicKey,
          data: message,
          version: 'x25519-xsalsa20-poly1305',
        })
      ),
      'utf8'
    )
  );
}
