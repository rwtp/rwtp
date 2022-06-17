import { RefreshIcon } from '@heroicons/react/solid';
import { BigNumber } from 'ethers';
import { useRouter } from 'next/router';
import { Dispatch, SetStateAction, useState } from 'react';
import { encrypt } from '../lib/encryption/core';
import { useEncryption } from '../lib/encryption/hooks';
import { postJSONToIPFS } from '../lib/ipfs';
import { formatTokenAmount, useTokenMethods } from '../lib/tokens';
import { useChainId } from '../lib/useChainId';
import {
  buyerTransferAmount,
  OrderData,
  useOrderMethods,
} from '../lib/useOrder';

export function SubmitOfferButton(props: {
  offerData: any;
  order: OrderData;
  setTxHash: Dispatch<SetStateAction<string>>;
  validChecker: () => Boolean;
}) {
  const router = useRouter();
  const chainId = useChainId();
  const tokenMethods = useTokenMethods(props.order.tokenAddressesSuggested[0]);
  const orderMethods = useOrderMethods(props.order.address);
  const encryption = useEncryption();

  const [loadingMessage, setLoadingMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const price = BigNumber.from(
    props.order.priceSuggested ? props.order.priceSuggested : 0
  );
  const stake = BigNumber.from(
    props.order.sellersStakeSuggested ? props.order.sellersStakeSuggested : 0
  );
  const cost = BigNumber.from(
    props.order.buyersCostSuggested ? props.order.buyersCostSuggested : 0
  );
  const timeout = BigNumber.from(
    props.order.suggestedTimeout
      ? props.order.suggestedTimeout
      : 60 * 60 * 24 * 60 //60 days default
  );
  const token = props.order.tokensSuggested[0];
  const transferAmount = buyerTransferAmount(props.order);

  async function onBuy() {
    if (props.validChecker && !props.validChecker()) {
      console.log('Invalid schema');
      return;
    }

    setLoadingMessage('Uploading');
    console.log('Submitting offer: ', props.offerData);
    const cid = await uploadBuyerData();
    if (!cid) return;

    setLoadingMessage(
      `Requesting ${formatTokenAmount(
        transferAmount.toString(),
        props.order.tokensSuggested[0]
      )} ${token.symbol}`
    );
    const approveTxHash = await approveTokens();
    if (!approveTxHash) return;

    setLoadingMessage(`Submitting offer`);
    const submitTxHash = await submitOffer(cid);
    if (!submitTxHash) return;

    setLoadingMessage('');
    router.push(`/buy/${props.order.address}?chain=${chainId}`);
  }

  async function uploadBuyerData(): Promise<string | undefined> {
    if (!props.offerData) return;
    if (!encryption.keypair) return;
    try {
      const msg = encrypt({
        receiverPublicEncryptionKey: props.order.encryptionPublicKey,
        secretData: JSON.stringify(props.offerData),
        senderPrivatekey: encryption.keypair?.secretKey,
      });

      const data = formatMessageForUpload(msg, encryption.keypair.publicKey);
      return await postJSONToIPFS(data);
    } catch (error) {
      setLoadingMessage('');
      setErrorMessage('Error uploading Buyer Data');
      console.log(error);
      return undefined;
    }
  }

  async function approveTokens(): Promise<string | undefined> {
    try {
      const tx = await tokenMethods.approve.writeAsync({
        args: [props.order.address, transferAmount],
      });

      props.setTxHash(tx.hash);
      await tx.wait();
      props.setTxHash('');
      return tx.hash;
    } catch (error) {
      setLoadingMessage('');
      setErrorMessage('Error Approving');
      console.log(error);
      return undefined;
    }
  }

  async function submitOffer(cid: string): Promise<string | undefined> {
    try {
      const submitData = {
        args: [
          BigNumber.from(0),
          token.address,
          price,
          cost,
          stake,
          timeout,
          'ipfs://' + cid,
        ],
        overrides: {
          gasLimit: 1000000,
        },
      };
      console.log('Submitting offer contract data: ', submitData);
      const tx = await orderMethods.submitOffer.writeAsync(submitData);

      props.setTxHash(tx.hash);
      await tx.wait();
      props.setTxHash('');
      return tx.hash;
    } catch (error) {
      setLoadingMessage('');
      setErrorMessage('Error Submitting Offer');
      console.log(error);
      return undefined;
    }
  }

  return (
    <>
      {!loadingMessage && !errorMessage && (
        <>
          <button
            className="px-4 py-3 w-full text-lg justify-center rounded bg-black text-white"
            onClick={onBuy}
          >
            <div>Submit Offer</div>
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
          <button className="cursor-not-allowed mt-4 text-lg bg-red-500 text-white px-4 py-3 w-full flex justify-center font-bold rounded">
            <div>{errorMessage}</div>
          </button>
        </>
      )}
    </>
  );
}
