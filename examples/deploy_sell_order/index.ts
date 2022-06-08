import { ethers } from 'ethers';
import { OrderBook, Order } from 'rwtp';
let GAS = 13300000;
let WRAPPED_ETH_ADDRESS = '0xc778417E063141139Fce010982780140Aa0cD5Ab';
let ORDER_BOOK_ADDRESS = "0xbd2e1dbe56053ee310249ce5969208ad7aa72dd0";

function factory(contract: any, wallet: ethers.Wallet): ethers.ContractFactory {
  return new ethers.ContractFactory(contract.abi, contract.bytecode, wallet);
}

async function createOrderBook(wallet: ethers.Wallet): Promise<any> {
  console.log('Deploying OrderBook...');
  let orderBook = await factory(OrderBook, wallet).deploy();
  console.log('OrderBook deployed at:', orderBook.address);
  return orderBook;
}

const ERC20_ABI = [{ "constant": true, "inputs": [], "name": "name", "outputs": [{ "name": "", "type": "string" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "guy", "type": "address" }, { "name": "wad", "type": "uint256" }], "name": "approve", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "totalSupply", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "src", "type": "address" }, { "name": "dst", "type": "address" }, { "name": "wad", "type": "uint256" }], "name": "transferFrom", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [{ "name": "wad", "type": "uint256" }], "name": "withdraw", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "decimals", "outputs": [{ "name": "", "type": "uint8" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [{ "name": "", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "symbol", "outputs": [{ "name": "", "type": "string" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "dst", "type": "address" }, { "name": "wad", "type": "uint256" }], "name": "transfer", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [], "name": "deposit", "outputs": [], "payable": true, "stateMutability": "payable", "type": "function" }, { "constant": true, "inputs": [{ "name": "", "type": "address" }, { "name": "", "type": "address" }], "name": "allowance", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "payable": true, "stateMutability": "payable", "type": "fallback" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "src", "type": "address" }, { "indexed": true, "name": "guy", "type": "address" }, { "indexed": false, "name": "wad", "type": "uint256" }], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "src", "type": "address" }, { "indexed": true, "name": "dst", "type": "address" }, { "indexed": false, "name": "wad", "type": "uint256" }], "name": "Transfer", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "dst", "type": "address" }, { "indexed": false, "name": "wad", "type": "uint256" }], "name": "Deposit", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "src", "type": "address" }, { "indexed": false, "name": "wad", "type": "uint256" }], "name": "Withdrawal", "type": "event" }];
function purchasingToken(purchaseTokenAddress: string, wallet: ethers.Wallet): ethers.Contract {
  const purchasingToken = new ethers.Contract(purchaseTokenAddress, ERC20_ABI, wallet);
  return purchasingToken.attach(purchaseTokenAddress);
}

const MAKER_PRIVATE_KEY="0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d";
const PROVIDER="https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161";
const CREATE_ORDER = false;
const SET_ACTIVE = true;
const BUY_SEQUENCE = false;
const COMMIT_ORDER = false;
const CONFIRM_OFFER = false;
// MAIN FUNCTION
(async function () {
  // Create a wallet
  const provider = new ethers.providers.JsonRpcProvider(PROVIDER);
  const maker_wallet = new ethers.Wallet(MAKER_PRIVATE_KEY, provider);
  console.log('Wallet address:', maker_wallet.address);

  let orderBook = new ethers.Contract(ORDER_BOOK_ADDRESS, OrderBook.abi, maker_wallet);
  console.log("orderBook.address: ", orderBook.address);
  console.log("orderBook: ", orderBook);

  return;
  let sellOrder = await orderBook.createOrder(
    maker_wallet.address,
    WRAPPED_ETH_ADDRESS,
    10,
    "ipfs://QmZHqdtFg9rLh7fcxPGMKfVn3WxeTKNrv5WzAPZAv86Jb3",
    1000,
    { gasLimit: GAS }
  )



  const args = [];
  console.log("Running");
  let rpc_url = args[0];
  
  let command = args[1];
  console.log("Command: ", command);
  if (command === "--createSellOrder" && args.length === 4) {
    let privateKey = args[2];
    let buyer_privateKey = args[3];
    

    
    console.log("creating wallet");
    const sellerWallet = new ethers.Wallet(privateKey, provider);
    console.log("wallet: ", sellerWallet.address);
    let preBalance = await sellerWallet.getBalance();
    console.log('Balance:', ethers.utils.formatEther(preBalance), 'ETH\n');


    // Comment this if you want to create a new order book 
    

    // Uncomment this if you want to create a new order book
    // let orderBook = await createOrderBook(sellerWallet);
    console.log("orderBook: ", orderBook);
    
    console.log("orderBook.address: ", orderBook.address);
    // return;
    let sellOrderAddress = "";
    if (CREATE_ORDER) {

      let sellOrder = await orderBook.createSellOrder(
        sellerWallet.address,
        WRAPPED_ETH_ADDRESS,
        10,
        "ipfs://QmZHqdtFg9rLh7fcxPGMKfVn3WxeTKNrv5WzAPZAv86Jb3",
        1000,
        { gasLimit: GAS }
      )
      console.log("sellOrder: ", sellOrder.hash);
      let waited = await sellOrder.wait();
      // console.log("waited: ", waited);
      // console.log("waited.events: ", waited.events);
      console.log("waited.events[0].args: ", waited.events[0].args['sellOrder']);
      sellOrderAddress = waited.events[0].args['sellOrder'];
      return;
    } else {
      sellOrderAddress = "0xD84C9Aac4B3d2A9D12965B38b5B0b4A61d18972b"
    }
    
    const buyerWallet = new ethers.Wallet(buyer_privateKey, provider);
    console.log("buyerWallet: ", buyerWallet.address);
    let buyerBalance = await buyerWallet.getBalance();
    console.log('Buyer Balance:', ethers.utils.formatEther(buyerBalance), 'ETH\n');

    let sellOrderContractBuyer = new ethers.Contract(sellOrderAddress, Order.abi, buyerWallet);

    if (SET_ACTIVE) {
      let sellOrderContractSeller = new ethers.Contract(sellOrderAddress, Order.abi, sellerWallet);
      console.log(sellOrderContractSeller);
      // return;
      let setActive = await sellOrderContractSeller.setActive(false, { gasLimit: GAS });
      console.log("setActive: ", setActive.hash);
      let waited = await setActive.wait();
      console.log("waited: ", waited);
      return;
    }
    if (BUY_SEQUENCE) {
    
      // console.log("sellOrderContract: ", sellOrderContract);

      console.log("sellOrderContract.address: ", sellOrderContractBuyer.address);
      console.log("sellOrderContract.orderURI: ", await sellOrderContractBuyer.orderURI());

      let buyerPurchaseToken = purchasingToken(await sellOrderContractBuyer.token(), buyerWallet);
      console.log("token:", buyerPurchaseToken.address);
      console.log("token.name: ", await buyerPurchaseToken.name());
      // console.log(`Approving ${appPrice} to purchase ${appName}`);
      // console.log("purchaseToken: ", purchaseToken);
      let deposit_txn = await buyerPurchaseToken.deposit({value: 1000});
      console.log("deposit_txn: ", deposit_txn.hash);
      let deposit_txn_receipt = await deposit_txn.wait();
      console.log("deposit_txn_receipt: ", deposit_txn_receipt.hash);
      let approval_txn = await buyerPurchaseToken.approve(sellOrderContractBuyer.address, 100);
      console.log("approval_txn: ", approval_txn.hash);
      let approval_confirmation = await approval_txn.wait();
      console.log("approval_confirmation: ", approval_confirmation.hash);
      let allowance = await buyerPurchaseToken.allowance(buyerWallet.address, sellOrderContractBuyer.address);
      console.log("allowance: ", allowance.toString());


      let offer = await sellOrderContractBuyer['submitOffer(uint32,uint32,uint128,uint128,string)'](
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
      return;
    }


    let sellOrderContractSeller = new ethers.Contract(sellOrderAddress, Order.abi, sellerWallet);
    let offer = await sellOrderContractSeller.offers(buyerWallet.address, 0);
    console.log("offer state: ", offer.state);
    if (COMMIT_ORDER) {
      if (offer.state != 1) {
        console.log("Can only commit an offer that is in state 1");
        return;
      }

      let sellerPurchaseToken = purchasingToken(await sellOrderContractSeller.token(), sellerWallet);
      console.log("token:", sellerPurchaseToken.address);
      console.log("token.name: ", await sellerPurchaseToken.name());
      // console.log(`Approving ${appPrice} to purchase ${appName}`);
      // console.log("purchaseToken: ", purchaseToken);
      let deposit_txn = await sellerPurchaseToken.deposit({value: 1000});
      console.log("deposit_txn: ", deposit_txn.hash);
      let deposit_txn_receipt = await deposit_txn.wait();
      console.log("deposit_txn_receipt: ", deposit_txn_receipt.hash);
      let approval_txn = await sellerPurchaseToken.approve(sellOrderContractSeller.address, 1000);
      console.log("approval_txn: ", approval_txn.hash);
      let approval_confirmation = await approval_txn.wait();
      console.log("approval_confirmation: ", approval_confirmation.hash);
      let allowance = await sellerPurchaseToken.allowance(buyerWallet.address, sellOrderContractSeller.address);
      console.log("allowance: ", allowance.toString());
      
      
      let commit_txn = await sellOrderContractSeller.commit(buyerWallet.address, 0, { gasLimit: GAS });
      console.log("commit_txn: ", commit_txn.hash);
      let commit_txn_receipt = await commit_txn.wait();
      console.log("commit_txn_receipt: ", commit_txn_receipt.transactionHash);
      return;
    }

    if (CONFIRM_OFFER) {
      if (offer.state != 2) {
        console.log("Can only confirm an offer that is in state 2");
        return;
      }
      let confirm_txn = await sellOrderContractBuyer.confirm(0, { gasLimit: GAS });
      console.log("confirm_txn: ", confirm_txn.hash);
      let confirm_txn_receipt = await confirm_txn.wait();
      console.log("confirm_txn_receipt: ", confirm_txn_receipt.transactionHash);
      return;
    }
    

    




  } else {
    console.log("Invalid command", args[2]);
  }

})().catch(console.error);
