import { ethers } from 'ethers';
import { OrderBook } from 'rwtp';

const provider = new ethers.providers.JsonRpcProvider('YourEndpoint');

async function main() {
  const book = new ethers.Contract(OrderBook.address, OrderBook.abi, provider);

  book.createOrder();
}

main().catch(console.error);
