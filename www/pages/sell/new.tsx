import { BigNumber, ethers } from 'ethers';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { SellOrder } from 'rwtp';
import { useSendTransaction } from 'wagmi';
import { useState } from 'react';
import { KOVAN_CHAIN_ID, OPTIMISM_CHAIN_ID } from '../../lib/constants';

export default function StickerStore() {
  const [address, setAddress] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

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

    const erc20Address = '0xd0a1e359811322d97991e03f863a0c30c2cf029c';
    const erc20ABI = [
      'function approve(address spender, uint256 amount)',
      'function decimals() public view returns (uint8)',
    ];
    const erc20 = new ethers.Contract(erc20Address, erc20ABI, signer);

    const result = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          title: title,
          description: description,
        },
      }),
    });
    const { cid } = await result.json();

    const contract = await factory.deploy(
      erc20Address,
      BigNumber.from(20).mul(BigNumber.from(10).pow(await erc20.decimals())),
      'ipfs://' + cid,
      60 * 60 * 24 * 30 // 1 month
    );

    setAddress(contract.address);
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
            />
          </label>
          <label className="flex flex-col">
            <strong className="mb-1">Description</strong>
            <textarea
              className="border px-4 py-2 mb-2"
              placeholder="Description"
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          {/* 
          <label className="flex flex-col">
            <strong className="mb-1">Primary Image</strong>
            <input type={'file'} />
          </label> */}
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
