import Order from '../out/Order.sol/Order.json';
import OrderBookWithoutAddress from '../out/OrderBook.sol/OrderBook.json';
import { ethers } from 'ethers';

/**
 * Converts a signature into a deterministically generated 256-bit private key.
 * Defined as: 'sha256(signature)'.
 *
 * @param sig, A signature, such as 0xc7558dfc1c3324e2260bfc4198...
 * @returns Uint8Array
 */
function signatureToPrivateKey(sig: string) {
  let data = Buffer.from(sig, 'hex');
  if (sig.startsWith('0x')) {
    data = Buffer.from(sig.split('0x')[1], 'hex');
  }

  return Uint8Array.from(
    Buffer.from(ethers.utils.sha256(data).split('0x')[1], 'hex')
  );
}

const OrderBook = {
  ...OrderBookWithoutAddress,

  // The address of the deployed contract
  address: '0xbd2e1dbe56053ee310249ce5969208ad7aa72dd0',
};

export { Order, OrderBook, signatureToPrivateKey };
