import Order from '../out/Order.sol/Order.json';
import OrderBookWithoutAddress from '../out/OrderBook.sol/OrderBook.json';

const OrderBook = {
  ...OrderBookWithoutAddress,

  // The address of the deployed contract
  address: '0x8587256EdF3D11EbF70540180140132c6D36bd29',
};

export { Order, OrderBook };
