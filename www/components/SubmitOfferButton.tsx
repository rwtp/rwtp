import { RefreshIcon } from '@heroicons/react/solid';
import { BigNumber, ethers } from 'ethers';
import { useRouter } from 'next/router';
import { Dispatch, SetStateAction, useState } from 'react';
import nacl from 'tweetnacl';
import { useAccount, useSigner } from 'wagmi';
import { postJSONToIPFS } from '../lib/ipfs';
import { formatTokenAmount, useTokenMethods } from '../lib/tokens';
import { useChainId } from '../lib/useChainId';
import { useEncryptionKeypair } from '../lib/useEncryptionKey';
import { OrderData, useOrderMethods } from '../lib/useOrder';

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
  const buyersEncryptionKeypair = useEncryptionKeypair();

  const [loadingMessage, setLoadingMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const quantity = 1;
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
    props.order.buyersCostSuggested
      ? props.order.buyersCostSuggested
      : 60 * 60 * 24 * 7
  );
  const token = props.order.tokensSuggested[0];

  let tokenBalance = BigNumber.from(0);
  const signer = useSigner();
  if (signer && signer.data) {
    let tokenContract = useTokenMethods(token.address);
    let account = useAccount();
    let balance = tokenContract.balance(account.data?.address).data;
    if (balance) {
      tokenBalance = BigNumber.from(balance);
    }
  }

  async function onBuy() {
    if (props.validChecker && !props.validChecker()) {
      console.log('Invalid schema');
      return;
    }
    if (tokenBalance.lt(price)) {
      const msg = `You don't have enough ${token.symbol} to buy this order.`;
      console.log(msg);
      // TODO: show a better error message here
      alert(msg);
      return;
    }
    setLoadingMessage('Uploading');
    console.log('Submitting offer: ', props.offerData);
    const cid = await uploadBuyerData();
    if (!cid) return;

    setLoadingMessage(
      `Requesting ${formatTokenAmount(
        props.order.priceSuggested,
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
    if (!buyersEncryptionKeypair) return;
    try {
      const secretData = Buffer.from(JSON.stringify(props.offerData), 'utf-8');
      const nonce = nacl.randomBytes(24);
      const sellersPublicEncryptionKey = Uint8Array.from(
        Buffer.from(props.order.encryptionPublicKey, 'hex')
      );

      const encrypted = nacl.box(
        secretData,
        nonce,
        sellersPublicEncryptionKey,
        buyersEncryptionKeypair?.secretKey
      );

      const data = {
        publicKey: Buffer.from(buyersEncryptionKeypair.publicKey).toString(
          'hex'
        ),
        nonce: Buffer.from(nonce).toString('hex'),
        message: Buffer.from(encrypted).toString('hex'),
      };
      return await postJSONToIPFS(data);
    } catch (error) {
      setLoadingMessage('');
      alert('Failure to upload BuyerData');
      console.log(error);
      return undefined;
    }
  }

  async function approveTokens(): Promise<string | undefined> {
    try {
      const transferAmount = (
        cost > price ? price.add(cost.sub(price)) : price
      ).mul(quantity);
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
    </>
  );
}
