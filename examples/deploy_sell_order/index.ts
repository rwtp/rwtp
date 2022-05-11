import { ethers } from 'ethers';
import { OrderBook, SellOrder } from 'rwtp';
let GAS = 2300000;
let WRAPPED_ETH_ADDRESS = '0xc778417E063141139Fce010982780140Aa0cD5Ab';
// let ORDER_BOOK_ADDRESS = "0x667D3DED6C891453E4b1BF6032CD0c22E0c31baC";
let ORDER_BOOK_ADDRESS = "0x236487c12483526d5dA3Bf23dbd0961f41F32095";
// Parse arguments
const args = process.argv.slice(2);

function invalidArgs(): void {
  console.error('Usage: yarn start <RPC_URL>');
  console.error('[--createSellOrder <SELLER_PRIVATE_KEY>]');
  console.error("args: ", args);
  console.error("args len: ", args.length);
  process.exit(1);
}

if (args.length <= 2) {
  invalidArgs();
}

function factory(contract: any, wallet: ethers.Wallet): ethers.ContractFactory {
  return new ethers.ContractFactory(contract.abi, contract.bytecode, wallet);
}

async function createOrderBook(wallet: ethers.Wallet): Promise<any> {
  console.log('Deploying OrderBook...');
  let orderBook = await factory(OrderBook, wallet).deploy();
  console.log('OrderBook deployed at:', orderBook.address);
  return orderBook;
}


// Compatible with
// - https://rinkeby.etherscan.io/token/0xc778417e063141139fce010982780140aa0cd5ab
// - https://mumbai.polygonscan.com/token/0x9c3c9283d3e44854697cd22d3faa240cfb032889?a=0x20c9560d42566d6ead1da3dc84137e84838fa696#writeContract
const ERC20_ABI = [{ "constant": true, "inputs": [], "name": "name", "outputs": [{ "name": "", "type": "string" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "guy", "type": "address" }, { "name": "wad", "type": "uint256" }], "name": "approve", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "totalSupply", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "src", "type": "address" }, { "name": "dst", "type": "address" }, { "name": "wad", "type": "uint256" }], "name": "transferFrom", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [{ "name": "wad", "type": "uint256" }], "name": "withdraw", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "decimals", "outputs": [{ "name": "", "type": "uint8" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [{ "name": "", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "symbol", "outputs": [{ "name": "", "type": "string" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "dst", "type": "address" }, { "name": "wad", "type": "uint256" }], "name": "transfer", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [], "name": "deposit", "outputs": [], "payable": true, "stateMutability": "payable", "type": "function" }, { "constant": true, "inputs": [{ "name": "", "type": "address" }, { "name": "", "type": "address" }], "name": "allowance", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "payable": true, "stateMutability": "payable", "type": "fallback" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "src", "type": "address" }, { "indexed": true, "name": "guy", "type": "address" }, { "indexed": false, "name": "wad", "type": "uint256" }], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "src", "type": "address" }, { "indexed": true, "name": "dst", "type": "address" }, { "indexed": false, "name": "wad", "type": "uint256" }], "name": "Transfer", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "dst", "type": "address" }, { "indexed": false, "name": "wad", "type": "uint256" }], "name": "Deposit", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "src", "type": "address" }, { "indexed": false, "name": "wad", "type": "uint256" }], "name": "Withdrawal", "type": "event" }];
function purchasingToken(purchaseTokenAddress: string, wallet: ethers.Wallet): ethers.Contract {
  const purchasingToken = new ethers.Contract(purchaseTokenAddress, ERC20_ABI, wallet);
  return purchasingToken.attach(purchaseTokenAddress);
}

// MAIN FUNCTION
(async function () {
  console.log("Running");
  let rpc_url = args[0];
  const provider = new ethers.providers.JsonRpcProvider(rpc_url);
  let command = args[1];
  console.log("Command: ", command);
  if (command === "--createSellOrder" && args.length === 4) {
    let privateKey = args[2];
    let buyer_privateKey = args[3];
    

    
    console.log("creating wallet");
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log("wallet: ", wallet.address);
    let preBalance = await wallet.getBalance();
    console.log('Balance:', ethers.utils.formatEther(preBalance), 'ETH\n');


    // Comment this if you want to create a new order book 
    let orderBook = new ethers.Contract(ORDER_BOOK_ADDRESS, OrderBook.abi, wallet);

    // Uncomment this if you want to create a new order book
    // let orderBook = await createOrderBook(wallet);
    // console.log("orderBook: ", orderBook);
    
    console.log("orderBook.address: ", orderBook.address);
    // return;
    let sellOrder = await orderBook.createSellOrder(
      wallet.address,
      WRAPPED_ETH_ADDRESS,
      10,
      "ipfs://QmZHqdtFg9rLh7fcxPGMKfVn3WxeTKNrv5WzAPZAv86Jb3",
      1000,
      { gasLimit: GAS }
    )
    // console.log("sellOrder: ", sellOrder);
    let waited = await sellOrder.wait();
    // console.log("waited: ", waited);
    // console.log("waited.events: ", waited.events);
    console.log("waited.events[0].args: ", waited.events[0].args['sellOrder']);
    let sellOrderAddress = waited.events[0].args['sellOrder'];
    


    //BUY SEQUENCE 
    const buyerWallet = new ethers.Wallet(buyer_privateKey, provider);
    console.log("buyerWallet: ", buyerWallet.address);
    let buyerBalance = await buyerWallet.getBalance();
    console.log('Buyer Balance:', ethers.utils.formatEther(buyerBalance), 'ETH\n');

    let sellOrderContract = new ethers.Contract(sellOrderAddress, SellOrder.abi, buyerWallet);
    // console.log("sellOrderContract: ", sellOrderContract);

    console.log("sellOrderContract.address: ", sellOrderContract.address);
    console.log("sellOrderContract.orderURI: ", await sellOrderContract.orderURI());

    let purchaseToken = purchasingToken(await sellOrderContract.token(), buyerWallet);
    console.log("token:", purchaseToken.address);
    console.log("token.name: ", await purchaseToken.name());
    // console.log(`Approving ${appPrice} to purchase ${appName}`);
    // console.log("purchaseToken: ", purchaseToken);
    let deposit_txn = await purchaseToken.deposit({value: 1000});
    console.log("deposit_txn: ", deposit_txn.hash);
    let deposit_txn_receipt = await deposit_txn.wait();
    console.log("deposit_txn_receipt: ", deposit_txn_receipt.hash);
    let approval_txn = await purchaseToken.approve(sellOrderContract.address, 100);
    console.log("approval_txn: ", approval_txn.hash);
    let approval_confirmation = await approval_txn.wait();
    console.log("approval_confirmation: ", approval_confirmation.hash);
    let allowance = await purchaseToken.allowance(buyerWallet.address, sellOrderContract.address);
    console.log("allowance: ", allowance.toString());


    let offer = await sellOrderContract['submitOffer(uint32,uint32,uint128,uint128,string)'](
        0,
        1,
        3,
        2,
        'ipfs://blahblahblah',
        { gasLimit: GAS }
    )
    console.log("offer: ", offer.hash);
    let offer_receipt = await offer.wait();
    console.log("offer_receipt: ", offer_receipt.hash);




  } else {
    console.log("Invalid command", args[2]);
    invalidArgs();
  }

})().catch(console.error);
