import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  useContractEvent,
  useContractWrite,
  useProvider,
  useSigner,
} from 'wagmi';
import { OrderBook } from 'rwtp';
import { useEffect, useState } from 'react';
import { ArrowRightIcon, ExclamationIcon } from '@heroicons/react/solid';
import { ethers } from 'ethers';
import * as nacl from 'tweetnacl';
import { toBn } from 'evm-bn';
import { useRouter } from 'next/router';

function useCreateSellOrder() {
  const signer = useSigner();

  async function createSellOrder(data: {
    title: string;
    description: string;
    priceSuggested: number;
    stakeSuggested: number;
    token: string;
    encryptionPublicKey: string;
  }) {
    if (!signer || !signer.data) return;

    const erc20Address = data.token;
    const erc20ABI = [
      'function approve(address spender, uint256 amount)',
      'function decimals() public view returns (uint8)',
    ];
    const erc20 = new ethers.Contract(erc20Address, erc20ABI, signer.data);
    const decimals = await erc20.decimals();
  }
}

async function postToIPFS(data: any) {
  const result = await fetch('/api/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: data,
    }),
  });
  const { cid } = await result.json();
  return cid;
}

function Layout(props: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <div className="flex px-4 py-4 justify-between items-center w-full bg-gray-50 border-b">
        <div>
          <ConnectButton />
        </div>
        <div className=""></div>
      </div>
      {props.children}
    </div>
  );
}

export default function Page() {
  const [state, setState] = useState({
    title: '',
    description: '',
    sellersStake: 0,
    buyersStake: 0,
    price: 0,
    token: '0xc778417E063141139Fce010982780140Aa0cD5Ab', // Rinkeby wETH
  });
  const [secretKey, setSecretKey] = useState('');
  const [sellOrder, setSellOrder] = useState();
  const signer = useSigner();
  const router = useRouter();

  const book = useContractWrite(
    {
      addressOrName: OrderBook.address,
      contractInterface: OrderBook.abi,
    },
    'createSellOrder'
  );

  async function createSellOrder() {
    if (!signer || !signer.data) return;

    const erc20Address = state.token;
    const erc20ABI = [
      'function approve(address spender, uint256 amount)',
      'function decimals() public view returns (uint8)',
    ];
    const erc20 = new ethers.Contract(erc20Address, erc20ABI, signer.data);
    const decimals = await erc20.decimals();

    const keypair = nacl.box.keyPair();
    setSecretKey(Buffer.from(keypair.secretKey).toString('hex'));

    const cid = await postToIPFS({
      title: state.title,
      description: state.description,
      encryptionPublicKey: Buffer.from(keypair.publicKey).toString('hex'),
      priceSuggested: toBn(state.price.toString(), decimals).toHexString(),
      stakeSuggested: toBn(
        state.buyersStake.toString(),
        decimals
      ).toHexString(),
    });

    const tx = await book.writeAsync({
      args: [
        await signer.data.getAddress(),
        erc20Address,
        toBn(state.sellersStake.toString(), decimals).toHexString(),
        cid,
        60 * 60 * 24 * 30,
      ],
    });
    const result = (await tx.wait()) as any;
    if (!result.events || result.events.length < 1) {
      throw new Error(
        "Unexpectedly could not find 'events' in the transaction hash of createSellOrder. Maybe an ethers bug? Maybe the CreateSellOrder event isn't picked up fast enough? This basically shouldn't happen."
      );
    }
    const sellOrderAddress = result.events[0].args[0];
    setSellOrder(sellOrderAddress);
  }

  if (sellOrder) {
    return (
      <Layout>
        <div className="flex flex-col p-8 h-full mt-12">
          <div className="flex-col max-w-xl mx-auto my-auto h-full">
            <h1 className="text-xl font-bold mb-1 flex items-center">
              Write down this secret key, you'll never see it again.
            </h1>
            <p className="mb-6 text-gray">
              You won't be able to see incoming orders without it. Put it in a
              password manager, or somewhere safe.
            </p>

            <input
              className="px-4 py-2 border border-blue-500 rounded shadow-inner w-full text-sm font-mono"
              value={`${secretKey}`}
              autoFocus
              onFocus={(e) => e.target.select()}
              onChange={(e) => {}}
            />

            <div className="mt-4 flex justify-end">
              <button
                className="underline rounded px-4 py-2 flex items-center"
                onClick={() => {
                  router.push('/sell/' + sellOrder);
                }}
              >
                I wrote down the key <ArrowRightIcon className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 py-4">
        <div className="font-bold mb-8 pb-4 text-xl border-b">
          Create a new sell order
        </div>
        <div className="flex flex-col">
          <label className="flex flex-col">
            <strong className="mb-1">Title</strong>
            <input
              className="border px-4 py-2 mb-2"
              onChange={(e) =>
                setState((s) => ({ ...s, title: e.target.value }))
              }
              placeholder="Title"
              value={state.title}
            />
          </label>
          <label className="flex flex-col">
            <strong className="mb-1">Description</strong>
            <textarea
              className="border px-4 py-2 mb-2"
              placeholder="Description"
              onChange={(e) =>
                setState((s) => ({ ...s, description: e.target.value }))
              }
              value={state.description}
            />
          </label>

          <div className="flex">
            <label className="flex flex-1 flex-col">
              <strong className="mb-1">Seller's Stake</strong>
              <input
                className="border px-4 py-2 mb-2"
                type="number"
                placeholder="1.5"
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    sellersStake: parseFloat(e.target.value),
                  }))
                }
                value={state.sellersStake}
              />
            </label>

            <label className="flex flex-1 flex-col">
              <strong className="mb-1">Buyer's Stake</strong>
              <input
                className="border-r border-t border-b px-4 py-2 mb-2"
                type="number"
                placeholder="1.5"
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    buyersStake: parseFloat(e.target.value),
                  }))
                }
                value={state.buyersStake}
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
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    price: parseFloat(e.target.value),
                  }))
                }
                value={state.price}
              />
            </label>
            <label className="flex flex-1 flex-col">
              <strong className="mb-1">Token</strong>
              <input
                className="border px-4 py-2 mb-2"
                type="string"
                placeholder="0x..."
                onChange={(e) =>
                  setState((s) => ({ ...s, token: e.target.value }))
                }
                value={state.token}
              />
            </label>
          </div>
        </div>
        <div className="mt-8">
          <button
            className="border border-blue-900 flex items-center px-4 py-1 rounded bg-blue-500 text-white hover:bg-blue-400 transition-all"
            onClick={() => createSellOrder().catch(console.error)}
          >
            Publish new sell order <ArrowRightIcon className="w-4 h-4 ml-4" />
          </button>
        </div>
      </div>
    </Layout>
  );
}
