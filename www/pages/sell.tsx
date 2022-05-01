import { ethers } from 'ethers';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { SellOrder } from 'rwtp';
import { useSendTransaction } from 'wagmi';
import { useState } from 'react';

export default function StickerStore() {
  const [address, setAddress] = useState('');

  async function deploySale() {
    const provider = new ethers.providers.Web3Provider(window.ethereum as any);
    await provider.send('eth_requestAccounts', []); // <- this promps user to connect metamask

    const signer = provider.getSigner();
    let factory = new ethers.ContractFactory(
      SellOrder.abi,
      SellOrder.bytecode,
      signer
    );
    const contract = await factory.deploy(
      '0xd0a1e359811322d97991e03f863a0c30c2cf029c',
      'ipfs://testnet',
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
            <input className="border px-4 py-2 mb-2" placeholder="Title" />
          </label>
          <label className="flex flex-col">
            <strong className="mb-1">Description</strong>
            <textarea
              className="border px-4 py-2 mb-2"
              placeholder="Description"
            />
          </label>

          <label className="flex flex-col">
            <strong className="mb-1">Primary Image</strong>
            <input type={'file'} />
          </label>
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
