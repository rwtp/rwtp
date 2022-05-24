import { useContractWrite, useSigner } from 'wagmi';
import { OrderBook } from 'rwtp';
import { useState } from 'react';
import { ArrowRightIcon } from '@heroicons/react/solid';
import { ethers } from 'ethers';
import { toBn } from 'evm-bn';
import { useRouter } from 'next/router';
import { ConnectWalletLayout } from '../../components/Layout';
import { RequiresKeystore } from '../../lib/keystore';
import { useEncryptionKeypair } from '../../lib/useEncryptionKey';
import SelectSearch from 'react-select-search';
import { renderToken, optimismList } from '../../lib/tokenDropdown';
import { DEFAULT_TOKEN } from '../../lib/constants';
import cn from 'classnames';
import { DEFAULT_OFFER_SCHEMA } from '../../lib/constants';
import { InputCustomSchema } from '../../components/AddCustomSchema';


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


function NewSellOrder() {
  const [state, setState] = useState({
    title: '',
    description: '',
    sellersStake: 0,
    buyersStake: 0,
    price: 0,
    token: DEFAULT_TOKEN,
    customIPFSSchema: '',
    customJSONSchema: '',
  });
  const signer = useSigner();
  const router = useRouter();
  const sellersEncryptionKeypair = useEncryptionKeypair();

  const book = useContractWrite(
    {
      addressOrName:
        '0x0e18a94e59ba260090cd2a1b9d81222b0e0a6abe' || OrderBook.address, // TODO, go back to orderbook.address
      contractInterface: OrderBook.abi,
    },
    'createSellOrder'
  );

  async function getOfferSchema(customIPFSSchema: string, customJSONSchema: string) {
    if (customIPFSSchema) {
      // TODO probably want to validate this is a valid ipfs cid.
      return customIPFSSchema;
    } else if (customJSONSchema) {
      // TODO handle error if upload fails
      const cid = await postToIPFS(JSON.stringify(customJSONSchema));
      return `ipfs://${cid}`;
    } else {
      return `ipfs://${DEFAULT_OFFER_SCHEMA}`;
    }
  }

  async function createSellOrder() {
    if (!signer || !signer.data) return;

    const erc20Address = state.token;
    const erc20ABI = [
      'function approve(address spender, uint256 amount)',
      'function decimals() public view returns (uint8)',
    ];
    const erc20 = new ethers.Contract(erc20Address, erc20ABI, signer.data);
    const decimals = await erc20.decimals();
    const offerSchema = getOfferSchema(state.customIPFSSchema, state.customJSONSchema)
    const cid = await postToIPFS({
      offerSchema: offerSchema,
      title: state.title,
      description: state.description,
      encryptionPublicKey: sellersEncryptionKeypair?.publicKeyAsHex,
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
    router.push(`/buy/${sellOrderAddress}`);
  }

  let [customTokenDisabled, setCustomTokenDisabled] = useState(true);

  return (
    <ConnectWalletLayout requireConnected={true}>
      <div className="px-4 py-4 max-w-6xl mx-auto">
        <div className="font-serif mb-12 mt-12 text-2xl">
          Create a new sell listing
        </div>
        {/* <p className="mb-8">Sell anything, from a pack of gum to a ferrari.</p> */}

        <div className="flex flex-col">
          <label className="flex flex-col mb-8">
            <div className="font-sans mb-1 text-base">Title</div>
            <input
              className="font-sans border px-4 py-2 rounded"
              onChange={(e) =>
                setState((s) => ({ ...s, title: e.target.value }))
              }
              placeholder="Title"
              value={state.title}
            />
          </label>
          <div className="flex mb-8">
            <label className="flex flex-1 flex-col mr-4">
              <div className="font-sans mb-1 text-base">Price</div>
              <input
                className="border px-4 py-2 rounded"
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

            <label className="flex-col">
              <div className="font-sans mb-1 text-base">Token</div>
              <SelectSearch
                className={(classes: string) =>
                  cn({
                    'w-40': true,
                    'px-4 py-2 border rounded-l': classes === 'input',
                    'px-4 py-2 w-full hover:bg-slate-50': classes === 'option',
                    'border rounded-b absolute bg-white drop-shadow':
                      classes === 'options',
                  })
                }
                options={optimismList}
                placeholder={customTokenDisabled ? 'USDC' : 'Custom Token'}
                onChange={(opt: any) => {
                  if (opt === 'Custom') {
                    setCustomTokenDisabled(false);
                    setState((s) => ({ ...s, token: '' }));
                  } else {
                    setState((s) => ({ ...s, token: opt }));
                    setCustomTokenDisabled(true);
                  }
                }}
                search
                renderOption={renderToken}
                value={state.token}
              />
            </label>

            <label className="flex flex-1 flex-col">
              <div className="font-sans mb-1 text-base">Token Address</div>
              <input
                className="border-r border-t border-b px-4 py-2 rounded-r"
                placeholder={DEFAULT_TOKEN}
                disabled={customTokenDisabled}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    token: e.target.value,
                  }))
                }
                value={state.token}
              />
            </label>
          </div>
          <label className="flex flex-col mb-8">
            <div className="font-sans mb-1 text-base">Description</div>
            <textarea
              className="border px-4 py-2 rounded"
              placeholder="Description of the item you sell here. Try using tags to make it easier for the user to find your stuff. For example: Used car. #automobile #sedan #tan"
              onChange={(e) =>
                setState((s) => ({ ...s, description: e.target.value }))
              }
              value={state.description}
            />
          </label>
          <div className="flex mb-8">
            <label className="flex flex-1 flex-col mr-4">
              <div className="mb-1 text-base">Seller's Stake</div>
              <input
                className="border px-4 py-2 rounded"
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
              <div className="mb-1 text-base">Buyer's Stake</div>
              <input
                className="border px-4 py-2 rounded"
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
        </div>
        <InputCustomSchema JSONSchema={state.customJSONSchema} IPFSSchema={state.customIPFSSchema}
          setIPFSSchema={
            (schema) =>
              setState((s) => ({ ...s, customIPFSSchema: schema }))
          }
          setJSONSchema={
            (schema) =>
              setState((s) => ({ ...s, customJSONSchema: schema }))
          }
        />
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


export default function Page() {
  return (
    <RequiresKeystore>
      <NewSellOrder />
    </RequiresKeystore>
  );
}
