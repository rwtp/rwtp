import { useContractWrite, useSigner } from 'wagmi';
import { OrderBook } from 'rwtp';
import { Dispatch, SetStateAction, useState } from 'react';
import { RefreshIcon, XIcon } from '@heroicons/react/solid';
import { ethers } from 'ethers';
import { toBn } from 'evm-bn';
import { useRouter } from 'next/router';
import { ConnectWalletLayout } from '../../components/Layout';
import { useEncryptionKeypair } from '../../lib/useEncryptionKey';
import SelectSearch from 'react-select-search';
import { renderToken, getNetworkList } from '../../lib/tokenDropdown';
import { DEFAULT_TOKEN } from '../../lib/constants';
import cn from 'classnames';
import { DEFAULT_OFFER_SCHEMA } from '../../lib/constants';
import { InputCustomSchema } from '../../components/AddCustomSchema';

import { useNetwork } from 'wagmi';
import { useChainId } from '../../lib/useChainId';
import {
  KeyStoreConnectedButton,
  WalletConnectedButton,
} from '../../components/Buttons';
import {
  BuyersCostInfo,
  SellerSideSellersDepositInfo,
} from '../../components/infoBlurbs';
import {
  ipfsFetchableUrl,
  postJSONToIPFS,
  postFileToIPFS,
} from '../../lib/ipfs';

export default function Page() {
  const { activeChain } = useNetwork();
  const [state, setState] = useState({
    title: '',
    description: '',
    // User-entered URL
    primaryImageUrl: '',
    // Fetched image data
    primaryImageBlob: undefined as undefined | Blob,
    // Fetched image data as a `data:` URL
    primaryImageDataUrl: '',
    sellersStake: 0,
    buyersCost: 0,
    price: 0,
    token: DEFAULT_TOKEN,
    customIPFSSchema: '',
    customJSONSchema: '',
  });
  const [imageUploading, setImageUploading] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [txHash, setTxHash] = useState('');

  let [customTokenDisabled, setCustomTokenDisabled] = useState(true);

  /// Updates the state's `primaryImageBlob` and `primaryImageDataUrl`
  /// according to a newly received `Blob`. Returns false if the blob is too
  /// large.
  const setNewImage = (blob: Blob): boolean => {
    setImageUploading(true);

    // Error if file is over 3MB
    if (blob.size > 3_000_000) {
      return false;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target!.result! as string;

      setState((s) => ({
        ...s,
        primaryImageBlob: blob,
        primaryImageDataUrl: dataUrl,
      }));
      setImageUploading(false);
      setShowImagePreview(true);
    };

    reader.readAsDataURL(blob);

    return true;
  };

  return (
    <ConnectWalletLayout txHash={txHash}>
      <div className="px-4 py-4 max-w-3xl mx-auto">
        <div className="font-serif mb-2 mt-12 text-2xl">
          Create a new sell listing
        </div>
        <p className="mb-10">Sell anything, from a pack of gum to a ferrari.</p>

        <div className="flex flex-col space-y-8">
          <label className="flex flex-col">
            <strong className="mb-1 text-sm">Title</strong>
            <input
              className="font-sans border px-4 py-2 rounded"
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
              className="border px-4 py-2 rounded"
              placeholder="Description of the item you sell here. Try using tags to make it easier for the user to find your stuff. For example: Used car. #automobile #sedan #tan"
              onChange={(e) =>
                setState((s) => ({ ...s, description: e.target.value }))
              }
              value={state.description}
            />
          </label>
          <div className="flex flex-col">
            <strong className="mb-1 text-sm">Image</strong>
            <label className="flex flex-row content-center">
              <input
                type="text"
                className="px-4 py-2 border rounded my-auto flex-grow"
                placeholder="ipfs://cid or https://image.jpg"
                hidden={imageUploading}
                value={state.primaryImageUrl}
                onChange={(e) => {
                  setShowImagePreview(false);
                  setState((s) => ({
                    ...s,
                    primaryImageUrl: e.target.value,
                    primaryImageBlob: new Blob(),
                    primaryImageDataUrl: '',
                  }));
                }}
                onBlur={() => {
                  if (state.primaryImageUrl) {
                    fetch(ipfsFetchableUrl(state.primaryImageUrl))
                      .then((response) => {
                        if (!response.ok) {
                          throw Error(response.statusText);
                        }
                        return response.blob();
                      })
                      .then((blob) => {
                        if (!setNewImage(blob)) {
                          throw Error('Image must be less than 3 MB');
                        }
                      })
                      .catch((e) => {
                        alert('Error: ' + e);
                        setState((s) => ({
                          ...s,
                          primaryImageUrl: '',
                          primaryImageBlob: new Blob(),
                          primaryImageDataUrl: '',
                        }));
                        setImageUploading(false);
                        return;
                      });
                  }
                }}
              />
              <p
                className="my-auto px-5 text-center"
                hidden={
                  !!state.primaryImageUrl ||
                  !!state.primaryImageDataUrl ||
                  imageUploading
                }
              >
                or
              </p>
              <input
                className="max-2-1/4 py-2 my-auto"
                type="file"
                accept={'image/png, image/gif, image/jpeg'}
                hidden={
                  !!state.primaryImageUrl ||
                  !!state.primaryImageDataUrl ||
                  imageUploading
                }
                onChange={async (e) => {
                  if (!e.target.files) return;
                  const file = e.target.files[0];
                  if (!file || !file.name) return;
                  setImageUploading(true);

                  if (!setNewImage(file)) {
                    alert('Error: Image must be less than 3 MB');
                    e.target.value = '';
                    setImageUploading(false);
                    return;
                  }
                }}
              />
              <div className="my-auto" hidden={!imageUploading}>
                <p className="my-auto animate-pulse">Loading...</p>
              </div>
              {imageUploading ||
              !(state.primaryImageUrl || state.primaryImageDataUrl) ||
              !showImagePreview ? (
                <></>
              ) : (
                <div className="relative h-20 ml-5">
                  <img
                    className="h-full"
                    src={showImagePreview ? state.primaryImageDataUrl : ''}
                    onLoadStart={() => setShowImagePreview(false)}
                    onLoad={() => setShowImagePreview(true)}
                    onError={() => setShowImagePreview(false)}
                    alt="Preview"
                  />
                  <button
                    className="absolute top-0 right-0"
                    onClick={() => {
                      setState((s) => ({
                        ...s,
                        primaryImageUrl: '',
                        primaryImageDataUrl: '',
                        primaryImageBlob: new Blob(),
                      }));
                    }}
                  >
                    <XIcon className="w-5 h-5 text-white bg-black rounded-full p-1 m-1" />
                  </button>
                </div>
              )}
              <div
                className="my-auto ml-5"
                hidden={
                  imageUploading || !state.primaryImageUrl || showImagePreview
                }
              >
                <RefreshIcon className="animate-spin w-5 h-5 text-black" />
              </div>
            </label>
          </div>
          <div className="flex flex-col md:flex-row gap-x-4 gap-y-8">
            <label className="flex flex-1 flex-col max-w-full md:max-w-33">
              <strong className="mb-1 text-sm">Price</strong>
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
                min="0"
              />
            </label>
            <div className="flex flex-1 flex-row max-w-full">
              <label className="flex flex-col">
                <strong className="mb-1 text-sm">Token</strong>
                <SelectSearch
                  className={(classes: string) =>
                    cn({
                      'w-40': true,
                      'px-4 py-2 border rounded-l': classes === 'input',
                      'px-4 py-2 w-full hover:bg-slate-50':
                        classes === 'option',
                      'border rounded-b absolute bg-white drop-shadow':
                        classes === 'options',
                    })
                  }
                  options={getNetworkList(activeChain?.name!)}
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
                <strong className="mb-1 text-sm">Token Address</strong>
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
          </div>
          <div className="flex flex-col md:flex-row gap-x-4 gap-y-8">
            <label className="flex flex-1 flex-col">
              <div className="flex flex-row mb-1 gap-1">
                <strong className="text-sm">Seller's Deposit</strong>
                <SellerSideSellersDepositInfo />
              </div>
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
                min="0"
              />
            </label>

            <label className="flex flex-1 flex-col">
              <div className="flex flex-row mb-1 gap-1">
                <strong className="text-sm">Buyer's Cost</strong>
                <BuyersCostInfo />
              </div>
              <input
                className="border px-4 py-2 rounded"
                type="number"
                placeholder="1.5"
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    buyersCost: parseFloat(e.target.value),
                  }))
                }
                value={state.buyersCost}
                min="0"
              />
            </label>
          </div>
        </div>
        <InputCustomSchema
          JSONSchema={state.customJSONSchema}
          IPFSSchema={state.customIPFSSchema}
          setIPFSSchema={(schema) =>
            setState((s) => ({ ...s, customIPFSSchema: schema }))
          }
          setJSONSchema={(schema) =>
            setState((s) => ({ ...s, customJSONSchema: schema }))
          }
        />
        <div className="mt-8">
          <WalletConnectedButton>
            <KeyStoreConnectedButton>
              <CreateOrderButton state={state} setTxHash={setTxHash} />
            </KeyStoreConnectedButton>
          </WalletConnectedButton>
        </div>
      </div>
    </ConnectWalletLayout>
  );
}

function CreateOrderButton(props: {
  state: {
    title: string;
    description: string;
    primaryImageBlob: undefined | Blob;
    sellersStake: number;
    buyersCost: number;
    price: number;
    token: string;
    customIPFSSchema: string;
    customJSONSchema: string;
  };
  setTxHash: Dispatch<SetStateAction<string>>;
}) {
  const state = props.state;
  const setTxHash = props.setTxHash;
  const signer = useSigner();
  const router = useRouter();
  const chainId = useChainId();
  const sellersEncryptionKeypair = useEncryptionKeypair();
  const [loadingMessage, setLoadingMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const book = useContractWrite(
    {
      addressOrName: OrderBook.address,
      contractInterface: OrderBook.abi,
    },
    'createOrder'
  );

  async function getOfferSchema(
    customIPFSSchema: string,
    customJSONSchema: string
  ) {
    if (customIPFSSchema) {
      // REAL-415: probably want to validate this is a valid ipfs cid.
      return customIPFSSchema;
    } else if (customJSONSchema) {
      // REAL-416: handle error if upload fails
      const cid = await postJSONToIPFS(JSON.parse(customJSONSchema), true);
      return `ipfs://${cid}`;
    } else {
      return `ipfs://${DEFAULT_OFFER_SCHEMA}`;
    }
  }

  async function createOrder() {
    if (!signer || !signer.data) return;

    setLoadingMessage('Uploading Order Data');
    const cid = await uploadOrderData();
    if (!cid) return;

    setLoadingMessage('Creating Order');
    const tx = await book.writeAsync({
      args: [await signer.data.getAddress(), `ipfs://${cid}`, false],
    });

    setTxHash(tx.hash);
    const result = (await tx.wait()) as any;
    setTxHash('');
    if (!result.events || result.events.length < 1) {
      setLoadingMessage('');
      setErrorMessage('Error Creating Order');
      console.log(result.error);
      return;
    }
    const orderAddress = result.events[0].args[0];
    setLoadingMessage('');
    router.push(`/buy/${orderAddress}?chain=${chainId}`);
  }

  async function uploadOrderData(): Promise<string | undefined> {
    if (!signer || !signer.data) return undefined;
    try {
      const erc20Address = state.token;
      const erc20ABI = [
        'function approve(address spender, uint256 amount)',
        'function decimals() public view returns (uint8)',
      ];
      const erc20 = new ethers.Contract(erc20Address, erc20ABI, signer.data);
      const decimals = await erc20.decimals();
      const offerSchema = await getOfferSchema(
        state.customIPFSSchema,
        state.customJSONSchema
      );

      let primaryImageUrl = undefined;
      if (state.primaryImageBlob) {
        const primaryImageArrayBuffer =
          await state.primaryImageBlob.arrayBuffer();
        const primaryImageCid = await postFileToIPFS(
          Buffer.from(primaryImageArrayBuffer)
        );
        primaryImageUrl = 'ipfs://' + primaryImageCid;
      }
      return await postJSONToIPFS({
        publicKey: sellersEncryptionKeypair?.publicKeyAsHex,
        offerSchema: offerSchema,
        title: state.title,
        description: state.description,
        primaryImage: primaryImageUrl,
        tokenAddressesSuggested: [erc20Address],
        priceSuggested: toBn(state.price.toString(), decimals).toHexString(),
        sellersStakeSuggested: toBn(
          state.sellersStake.toString(),
          decimals
        ).toHexString(),
        buyersCostSuggested: toBn(
          state.buyersCost.toString(),
          decimals
        ).toHexString(),
        suggestedTimeout: toBn(
          (60 * 60 * 24 * 7).toString(),
          decimals
        ).toHexString(),
      });
    } catch (error) {
      setLoadingMessage('');
      setErrorMessage('Error Uploading Data');
      console.log(error);
      return undefined;
    }
  }

  return (
    <>
      {!loadingMessage && !errorMessage && (
        <>
          <button
            className="w-full px-4 py-3 text-lg text-center rounded bg-black text-white hover:opacity-50 transition-all"
            onClick={() => createOrder().catch(console.error)}
          >
            Publish Sell Order
          </button>
        </>
      )}
      {loadingMessage && !errorMessage && (
        <>
          <button className="cursor-wait border px-4 py-3 w-full flex justify-center font-bold rounded">
            <div>{loadingMessage}</div>
            <RefreshIcon className="animate-spin h-4 w-4 ml-2 my-auto" />
          </button>
        </>
      )}
      {errorMessage && (
        <>
          <button className="cursor-not-allowed mt-4 bg-red-500 text-white px-4 py-2 w-full flex justify-center font-bold rounded">
            <div>{errorMessage}</div>
          </button>
        </>
      )}
    </>
  );
}
