# new-dao example

## Set up test wallet
Supported test networks.

```
homestead - Homestead (Mainnet)
ropsten - Ropsten (proof-of-work testnet)
rinkeby - Rinkeby (proof-of-authority testnet)
goerli - Görli (clique testnet)
kovan - Kovan (proof-of-authority testnet)
```
Currently we are limited by [`EtherscanProvider`](https://docs.ethers.io/v5/api/providers/api-providers/#EtherscanProvider), and hopefully will bring support for Polygon's mumbai test network later. This really only is needed for history.

You can create a fake wallet and private key with metamask and load the wallet with.
https://rinkebyfaucet.com/



## How to use


### Quick run

If you are using rinkeby you can use this RPC URL
https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161
```
yarn start https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161 --completeExample 0xc778417E063141139Fce010982780140Aa0cD5Ab rinkeby <PRIVATE_KEY>
```

### Step by step

Run all of these steps  
```
yarn start <RPC_URL> --deployCharter <CHARTER_PRIVATE_KEY>
yarn start <RPC_URL> --deployApp <CHARTER_ADDRESS> <NAME> <SYMBOL> <PURCHASE_TOKEN_ADDRESS> <PURCHASE_TOKEN_AMOUNT> <PURCHASE_TOKEN_URL> <APP_PRIVATE_KEY>
yarn start <RPC_URL> --addAppToCharter <CHARTER_ADDRESS> <APP_ADDRESS> <CHARTER_PRIVATE_KEY>
yarn start <RPC_URL> --purchase <APP_ADDRESS> <CHARTER_ADDRESS> <PURCHASE_PRIVATE_KEY>
yarn start <RPC_URL> --history <CHARTER_ADDRESS> <PURCHASE_PRIVATE_KEY> (rinkeby | kovan | ropsten | goerli)
```