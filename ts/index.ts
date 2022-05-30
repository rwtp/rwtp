import Order from '../out/Order.sol/Order.json';
import OrderBookWithoutAddress from '../out/OrderBook.sol/OrderBook.json';

const OrderBook = {
  ...OrderBookWithoutAddress,

  // The address of the deployed contract
  address: '0xbd2e1dbe56053ee310249ce5969208ad7aa72dd0',
};

export { Order, OrderBook };
