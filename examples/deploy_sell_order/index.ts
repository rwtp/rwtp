import { BigNumber, ethers } from 'ethers';
import { OrderBook, Order } from 'rwtp';
import { uploadJson } from '../../www/pages/api/uploadJson'
import { DEFAULT_OFFER_SCHEMA } from '../../www/lib/constants';
import {
  formatMessageForUpload,
  encryptMessage,
  keystoreLogin,
  keystoreConstructor,
  getEncryptionKeyPair,
  encryptionKeypairExpanded
} from '../../www/lib/keystoreLib';
import UPLOAD_DATA from './uploadData.json';

let GAS = 13300000;
let WRAPPED_ETH_ADDRESS = '0xc778417E063141139Fce010982780140Aa0cD5Ab';
let ORDER_BOOK_ADDRESS = "0xbd2e1dbe56053ee310249ce5969208ad7aa72dd0";
const MAKER_PRIVATE_KEY = process.env.MAKER_PRIVATE_KEY;
const TAKER_PRIVATE_KEY = process.env.TAKER_PRIVATE_KEY;
const PROVIDER = "https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161";

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

async function getKeypair(wallet: any) {
  let loginStuff = keystoreLogin({
    signer: wallet,
    address: wallet.address,
    setSig: (_) => { },
  });
  let sig = await loginStuff.login();


  let loginDetails = {
    login: loginStuff.login,
    isLoading: false,
    isLoggedIn: true,
    token: loginStuff.toToken(wallet.address, sig),
  };
  let keypair = keystoreConstructor(loginDetails)
  return encryptionKeypairExpanded(await getEncryptionKeyPair(keypair));
}


interface OrderData {
  title: string, 
  description: string,
  primaryImage: string,
  priceSuggested: number,
  sellersStakeSuggested: number,
  buyersCostSuggested: number,
  suggestedTimeout: number,
  token: string,
  timeout: number,
}

async function createOrder(maker_wallet: any, orderData: OrderData) {
  let orderBook = new ethers.Contract(ORDER_BOOK_ADDRESS, OrderBook.abi, maker_wallet);
  console.log("orderBook.address: ", orderBook.address);
  let keypair = await getKeypair(maker_wallet);
  console.log(keypair);
  // console.log("orderBook: ", orderBook);
  let cid = await uploadJson({
    data: {
      offerSchema: DEFAULT_OFFER_SCHEMA,
      title: orderData.title,
      description: orderData.description,
      primaryImage: orderData.primaryImage,
      encryptionPublicKey: keypair.publicKeyAsHex,
      tokenAddressesSuggested: [orderData.token],
      priceSuggested: BigNumber.from(orderData.priceSuggested).toHexString(),
      sellersStakeSuggested: BigNumber.from(orderData.sellersStakeSuggested).toHexString(),
      buyersCostSuggested: BigNumber.from(orderData.buyersCostSuggested).toHexString(),
      suggestedTimeout: BigNumber.from(orderData.timeout).toHexString(),
    }
  });

  return await orderBook.createOrder(
    maker_wallet.address,
    cid,
    false,
    { gasLimit: GAS }
  );
}
interface OfferData {
  schemadata: any,
  token: string,
  price: number,
  buyersCost: number,
  sellersCost: number,
  timeout: number,
  offerState: string,
}

async function create_offer(orderAddress: string, index: number, taker_wallet: any, maker_wallet: any, offer_data: OfferData) {
  // create an offer
  let takerOrderContract = new ethers.Contract(orderAddress, Order.abi, taker_wallet);

  let takerPurchaseToken = purchasingToken(WRAPPED_ETH_ADDRESS, taker_wallet);
  console.log("token:", takerPurchaseToken.address);
  console.log("token.name: ", await takerPurchaseToken.name());
  let deposit_txn = await takerPurchaseToken.deposit({ value: offer_data.price + offer_data.buyersCost });
  console.log("deposit_txn: ", deposit_txn.hash);
  let deposit_txn_receipt = await deposit_txn.wait();
  console.log("deposit_txn_receipt: ", deposit_txn_receipt.transaction_hash);
  let approval_txn = await takerPurchaseToken.approve(orderAddress, offer_data.price + offer_data.buyersCost);
  console.log("approval_txn: ", approval_txn.hash);
  let approval_confirmation = await approval_txn.wait();
  console.log("approval_confirmation.transactionHash: ", approval_confirmation.transactionHash);
  let allowance = await takerPurchaseToken.allowance(taker_wallet.address, orderAddress);
  console.log("allowance: ", allowance.toString());
  const maker_keypair = await getKeypair(maker_wallet);
  const taker_keypair = await getKeypair(taker_wallet);

  const encrypted_message = encryptMessage({
    receiverPublicEncryptionKey: maker_keypair.publicKeyAsHex,
    secretData: JSON.stringify(offer_data.schemadata),
    senderPrivatekey: taker_keypair.secretKey,
  });
  const data = formatMessageForUpload(encrypted_message, taker_keypair.publicKey)
  let takerOffer = await takerOrderContract['submitOffer(uint128,address,uint128,uint128,uint128,uint128,string)'](
    index,
    offer_data.token,
    offer_data.price,
    offer_data.buyersCost,
    offer_data.sellersCost,
    offer_data.timeout,
    await uploadJson({ data: data })
  );
  console.log("takerOrder:", takerOffer.hash);
  let takerOrderWaited = await takerOffer.wait();
  console.log("takerOrder.waited:", takerOrderWaited.transactionHash);

}
async function commitOffer(index: number, orderAddress: string, maker_wallet: any, taker_wallet: any, offer_data: OfferData)  {
  const makerOrderContract = new ethers.Contract(orderAddress, Order.abi, maker_wallet);
  console.log("index: ", index);
  let offer = await makerOrderContract.offers(taker_wallet.address, index);
  console.log("offer state: ", offer.state);
  if (offer.state != 1) {
    console.log("Can only commit an offer that is in state 1");
    return;
  }
  let makerPurchaseToken = purchasingToken(WRAPPED_ETH_ADDRESS, maker_wallet);
  let deposit_txn = await makerPurchaseToken.deposit({ value: offer_data.sellersCost });
  console.log("deposit_txn: ", deposit_txn.hash);
  let deposit_txn_receipt = await deposit_txn.wait();
  console.log("deposit_txn_receipt: ", deposit_txn_receipt.transaction_hash);
  let approval_txn = await makerPurchaseToken.approve(makerOrderContract.address, offer_data.sellersCost);
  console.log("approval_txn: ", approval_txn.hash);
  let approval_confirmation = await approval_txn.wait();
  console.log("approval_confirmation: ", approval_confirmation.transaction_hash);
  let allowance = await makerPurchaseToken.allowance(maker_wallet.address, makerOrderContract.address);
  console.log("allowance: ", allowance.toString());
  let commit_txn = await makerOrderContract.commit(taker_wallet.address, index, { gasLimit: GAS });
  console.log("commit_txn: ", commit_txn.hash);
  let commit_txn_receipt = await commit_txn.wait();
  console.log("commit_txn_receipt: ", commit_txn_receipt.transactionHash);
}

async function confirmOffer(index: number, orderAddress:string, taker_wallet: any)   {
  const takerOrderContract = new ethers.Contract(orderAddress, Order.abi, taker_wallet);
  console.log("index: ", index);
  let offer = await takerOrderContract.offers(taker_wallet.address, index);
  console.log("offer state: ", offer.state);
  if (offer.state != 2) {
    console.log("Can only confirm an offer that is in state 2");
    return;
  }
  let confirm_txn = await takerOrderContract.confirm(taker_wallet.address, index, { gasLimit: GAS });
  console.log("confirm_txn: ", confirm_txn.hash);
  let confirm_txn_receipt = await confirm_txn.wait();
  console.log("confirm_txn_receipt: ", confirm_txn_receipt.transactionHash);
}



(async function () {
  

  const provider = new ethers.providers.JsonRpcProvider(PROVIDER);
  const maker_wallet = new ethers.Wallet(MAKER_PRIVATE_KEY!, provider);
  const taker_wallet = new ethers.Wallet(TAKER_PRIVATE_KEY!, provider);
  console.log('maker address:', maker_wallet.address);
  console.log('taker address:', taker_wallet.address);

  for (let ord of UPLOAD_DATA.orders ) {
    console.log("********* CREATING ORDER *********************")
    console.log(ord)
    const order = await createOrder(maker_wallet, ord);
    let waited = await order.wait();
    let orderAddress = waited.events[0].args['order'];
    console.log('orderAddress:', orderAddress);
    if (ord.offers) {
      for (let offer of ord.offers) {
        console.log("********* CREATING OFFER *********************")
        console.log(offer)
        const index = Math.floor(Math.random() * 1_000_000_000);
        if (offer.offerState === "OPEN") {
          await create_offer(orderAddress, index, taker_wallet, maker_wallet, offer);
        } else if (offer.offerState === "COMMITTED") {
          await create_offer(orderAddress, index, taker_wallet, maker_wallet, offer);
          await commitOffer(index, orderAddress, maker_wallet, taker_wallet, offer);
        } else if (offer.offerState === "CONFIRMED") {
          await create_offer(orderAddress, index, taker_wallet, maker_wallet, offer);
          await commitOffer(index, orderAddress, maker_wallet, taker_wallet, offer);
          await confirmOffer(index, orderAddress, taker_wallet);
        }else if (offer.offerState === "CANCELED") {
          await create_offer(orderAddress, index, taker_wallet, maker_wallet, offer);
          await commitOffer(index, orderAddress, maker_wallet, taker_wallet, offer);
          const takerOrderContract = new ethers.Contract(orderAddress, Order.abi, taker_wallet);
          const makerOrderContract = new ethers.Contract(orderAddress, Order.abi, maker_wallet);
          const makerCancel = makerOrderContract.cancel(taker_wallet.address, index, { gasLimit: GAS });
          const takerCancel = takerOrderContract.cancel(taker_wallet.address, index, { gasLimit: GAS });
          console.log("taker cancel.hash: ", await takerCancel.hash);
          console.log("maker cancel.hash: ", await makerCancel.hash);


        }
      }
    }
    console.log(order);
  }
  return

})().catch(console.error);
