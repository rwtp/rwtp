import { BigNumber, ethers } from 'ethers';
import { SellOrder } from 'rwtp';
import { useEffect, useState } from 'react';
import { KOVAN_CHAIN_ID, OPTIMISM_CHAIN_ID } from '../../lib/constants';
import { useRouter } from 'next/router';
import { toBn } from 'evm-bn';

export default function Sell() {
  const [address, setAddress] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const router = useRouter();
  const [sellersStake, setSellersStake] = useState(0);
  const [buyersStake, setBuyersStake] = useState(0);
  const [price, setPrice] = useState(0);
  const [stake, setStake] = useState(0);
  const [token, setToken] = useState(
    '0xd0a1e359811322d97991e03f863a0c30c2cf029c'
  );

  async function deploySale() {
    const provider = new ethers.providers.Web3Provider(window.ethereum as any);
    await provider.send('eth_requestAccounts', []); // <- this promps user to connect metamask
    const network = await provider.getNetwork();

    // If we're in development, switch to Kovan
    if (process.env.NODE_ENV !== 'production' && network.name != 'kovan') {
      await provider.send('wallet_switchEthereumChain', [
        { chainId: KOVAN_CHAIN_ID },
      ]);
    }
    // If we're in production, switch to optimism
    if (process.env.NODE_ENV === 'production' && network.name != 'optimism') {
      await provider.send('wallet_switchEthereumChain', [
        { chainId: OPTIMISM_CHAIN_ID },
      ]);
    }

    const signer = provider.getSigner();
    let factory = new ethers.ContractFactory(
      SellOrder.abi,
      SellOrder.bytecode,
      signer
    );
    const erc20Address = token;
    const erc20ABI = [
      'function approve(address spender, uint256 amount)',
      'function decimals() public view returns (uint8)',
    ];
    const erc20 = new ethers.Contract(erc20Address, erc20ABI, signer);
    const decimals = await erc20.decimals();
    const encryptionPublicKey = await provider.send(
      'eth_getEncryptionPublicKey',
      [await signer.getAddress()]
    );
    const result = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          title: title,
          description: description,
          encryptionPublicKey: encryptionPublicKey,
          priceSuggested: toBn(price.toString(), decimals).toHexString(),
          stakeSuggested: toBn(stake.toString(), decimals).toHexString(),
        },
      }),
    });
    const { cid } = await result.json();
    const contract = await factory.deploy(
      erc20Address,
      BigNumber.from(20).mul(BigNumber.from(10).pow(decimals)),
      'ipfs://' + cid,
      60 * 60 * 24 * 30 // 1 month
    );
    await contract.deployTransaction.wait();
    router.push(`/sell/${contract.address}`);
  }

  if (address) {
    return (
      <div>
        <h1>Sale deployed at {address}</h1>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-4xl mx-auto flex flex-col p-8">
        <div className="font-bold mb-8 pb-4 text-xl border-b">
          Create a new sell order
        </div>
        <div className="flex flex-col">
          <label className="flex flex-col">
            <strong className="mb-1">Title</strong>
            <input
              className="border px-4 py-2 mb-2"
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              value={title}
            />
          </label>
          <label className="flex flex-col">
            <strong className="mb-1">Description</strong>
            <textarea
              className="border px-4 py-2 mb-2"
              placeholder="Description"
              onChange={(e) => setDescription(e.target.value)}
              value={description}
            />
          </label>

          <div className="flex">
            <label className="flex flex-1 flex-col">
              <strong className="mb-1">Seller's Stake</strong>
              <input
                className="border px-4 py-2 mb-2"
                type="number"
                placeholder="1.5"
                onChange={(e) => setSellersStake(parseFloat(e.target.value))}
                value={sellersStake}
              />
            </label>

            <label className="flex flex-1 flex-col">
              <strong className="mb-1">Buyer's Stake</strong>
              <input
                className="border-r border-t border-b px-4 py-2 mb-2"
                type="number"
                placeholder="1.5"
                onChange={(e) => setBuyersStake(parseFloat(e.target.value))}
                value={buyersStake}
              />
            </label>
          </div>

          <div className="flex">
            <label className="flex flex-col">
              <strong className="mb-1">Price</strong>
              <input
                className="border-l border-t border-b px-4 py-2 mb-2"
                type="number"
                placeholder="1.5"
                onChange={(e) => setPrice(parseFloat(e.target.value))}
                value={price}
              />
            </label>
            <label className="flex flex-1 flex-col">
              <strong className="mb-1">Token</strong>
              <input
                className="border px-4 py-2 mb-2"
                type="string"
                placeholder="0x..."
                onChange={(e) => setToken(e.target.value)}
                value={token}
              />
            </label>
          </div>
        </div>
        <div className="mt-8">
          <button
            className="border border-blue-900 flex items-center px-4 py-1 rounded bg-blue-500 text-white"
            onClick={deploySale}
          >
            Publish new sell order
          </button>
        </div>
      </div>
    </div>
  );
}
