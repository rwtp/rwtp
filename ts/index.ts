import SellOrder from '../out/SellOrder.sol/SellOrder.json';
import OrderBookWithoutAddress from '../out/OrderBook.sol/OrderBook.json';

const OrderBook = {
  ...OrderBookWithoutAddress,

  // The address of the deployed contract
  address: '0x667d3ded6c891453e4b1bf6032cd0c22e0c31bac',
};

export { SellOrder, OrderBook };
