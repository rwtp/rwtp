import { useContractWrite, useSigner } from 'wagmi';
import { OrderBook } from 'rwtp';
import { useState } from 'react';
import { ArrowRightIcon } from '@heroicons/react/solid';
import { ethers } from 'ethers';
import * as nacl from 'tweetnacl';
import { toBn } from 'evm-bn';
import { useRouter } from 'next/router';
import { ConnectWalletLayout } from '../../../components/Layout';

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
      addressOrName:
        '0x0e18a94e59ba260090cd2a1b9d81222b0e0a6abe' || OrderBook.address, // TODO, go back to orderbook.address
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
        `ipfs://${cid}`,
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
      <ConnectWalletLayout>
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
                  router.push('/buy/orders/' + sellOrder);
                }}
              >
                I wrote down the key <ArrowRightIcon className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </ConnectWalletLayout>
    );
  }

  return (
    <ConnectWalletLayout>
      <div className="px-4 py-4 max-w-6xl mx-auto">
        <div className="font-serif pb-2 text-2xl">New Sell Order</div>
        <p className="mb-8">Sell anything, from a pack of gum to a ferrari.</p>
        <div className="flex flex-col">
          <label className="flex flex-col">
            <strong className="mb-1 text-sm">Title</strong>
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
            <strong className="mb-1 text-sm">Description</strong>
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
              <strong className="mb-1 text-sm">Seller's Stake</strong>
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
              <strong className="mb-1 text-sm">Buyer's Stake</strong>
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
              <strong className="mb-1 text-sm">Price</strong>
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
              <strong className="mb-1 text-sm">Token</strong>
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
            className="flex items-center px-4 py-2 rounded bg-black text-white border-black hover:opacity-50 transition-all"
            onClick={() => createSellOrder().catch(console.error)}
          >
            Publish new sell order <ArrowRightIcon className="w-4 h-4 ml-4" />
          </button>
        </div>
      </div>
    </ConnectWalletLayout>
  );
}
