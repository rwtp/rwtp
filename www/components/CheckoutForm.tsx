import { RefreshIcon } from '@heroicons/react/solid';
import Form from '@rjsf/core';
import { BigNumber } from 'ethers';
import { fromBn } from 'evm-bn';
import { useRouter } from 'next/router';
import { Dispatch, SetStateAction, useState } from 'react';
import nacl from 'tweetnacl';
import { DEFAULT_OFFER_SCHEMA } from '../lib/constants';
import { postToIPFS } from '../lib/ipfs';
import { useTokenMethods } from '../lib/tokens';
import { useChainId } from '../lib/useChainId';
import { useEncryptionKeypair } from '../lib/useEncryptionKey';
import { OrderData, useOrderMethods } from '../lib/useOrder';
import { WalletConnectedButton, KeyStoreConnectedButton } from './Buttons';

export function CheckoutForm(props: {order: OrderData, setTxHash: Dispatch<SetStateAction<string>>}) {
   const [offerData, setOfferData] = useState({});

   const price = fromBn(
      BigNumber.from(props.order.priceSuggested ? props.order.priceSuggested : 0),
      props.order.tokensSuggested[0].decimals
    );

   return <>
      <div>
         {
            props.order.offerSchemaUri && props.order.offerSchemaUri.replace("ipfs://", '') != DEFAULT_OFFER_SCHEMA ?
               <OfferForm
                  schema={props.order.offerSchema}
                  setOfferData={setOfferData}
                  offerData={offerData}
                  price={price}
                  symbol={props.order.tokensSuggested[0].symbol} /> :
               <SimpleOfferForm
                  setOfferData={setOfferData}
                  offerData={offerData}
                  price={price}
                  symbol={props.order.tokensSuggested[0].symbol} />
         }
         <div className="mt-4 w-full">
            <WalletConnectedButton>
               <KeyStoreConnectedButton>
                  <SubmitOfferButton
                     offerData={offerData}
                     order={props.order}
                     setTxHash={props.setTxHash}
                  />
               </KeyStoreConnectedButton>
            </WalletConnectedButton>
            <FormFooter price={price} symbol={props.order.tokensSuggested[0].symbol} />
         </div>
      </div>
   </>
}

function SubmitOfferButton(props: {
   offerData: any,
   order: OrderData,
   setTxHash: Dispatch<SetStateAction<string>>;
}) {
   const router = useRouter();
   const chainId = useChainId();
   const tokenMethods = useTokenMethods(props.order.tokenAddressesSuggested[0]);
   const orderMethods = useOrderMethods(props.order.address);
   const buyersEncryptionKeypair = useEncryptionKeypair();

   const [loadingMessage, setLoadingMessage] = useState('');
   const [errorMessage, setErrorMessage] = useState('');

   const quantity = 1;
   const price = BigNumber.from(props.order.priceSuggested ? props.order.priceSuggested : 0);
   const stake = BigNumber.from(props.order.sellersStakeSuggested ? props.order.sellersStakeSuggested : 0);
   const cost = BigNumber.from(props.order.buyersCostSuggested ? props.order.buyersCostSuggested : 0);
   const timeout = BigNumber.from(props.order.buyersCostSuggested ? props.order.buyersCostSuggested : 60 * 60 * 24 * 7);
   const token = props.order.tokensSuggested[0];

   async function onBuy() {
      setLoadingMessage('Uploading');
      console.log('Submitting offer: ', props.offerData);
      const cid = await uploadBuyerData();
      if (!cid) return;

      setLoadingMessage(`Requesting ${price} ${token.symbol}`);
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
         const secretData = Buffer.from(
            JSON.stringify(props.offerData),
            'utf-8'
         );
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
            publicKey: Buffer.from(buyersEncryptionKeypair.publicKey).toString('hex'),
            nonce: Buffer.from(nonce).toString('hex'),
            message: Buffer.from(encrypted).toString('hex'),
         };
         return await postToIPFS(data);
      } catch (error) {
         setErrorMessage("Error Uploading");
         return undefined;
      }
   }

   async function approveTokens(): Promise<string | undefined> {
      try {
         const tx = await tokenMethods.approve.writeAsync({
            args: [props.order.address, price.add(stake).mul(quantity)],
         });

         props.setTxHash(tx.hash);
         await tx.wait();
         props.setTxHash('');
         return tx.hash;
      } catch (error) {
         setErrorMessage("Error Approving");
         return undefined;
      }
   }

   async function submitOffer(cid: string): Promise<string | undefined> {
      try {
         const tx = await orderMethods.submitOffer.writeAsync({
            args: [BigNumber.from(0), token.address, price, cost, stake, timeout, 'ipfs://' + cid],
            overrides: {
               gasLimit: 1000000,
            },
         });

         props.setTxHash(tx.hash);
         await tx.wait();
         props.setTxHash('');
         return tx.hash;
      } catch (error) {
         setErrorMessage("Error Submitting");
         return undefined;
      }
   }

   return (<>
      {!loadingMessage && !errorMessage && <>
         <button
            className="mt-4 bg-black text-white px-4 py-2 w-full flex justify-between font-bold rounded"
            onClick={onBuy}
         >
            <div>Submit Offer</div>
            <div>{`${fromBn(price, token.decimals)} ` + token.symbol}</div>
         </button>
      </>}
      {loadingMessage && !errorMessage && <>
         <button
            className="cursor-wait mt-4 border px-4 py-2 w-full flex justify-center font-bold rounded"
         >
            <div>{loadingMessage}</div>
            <RefreshIcon className="animate-spin h-4 w-4 ml-2 my-auto" />
         </button>
      </>}
      {errorMessage && <>
         <button
            className="cursor-not-allowed mt-4 bg-red-500 text-white px-4 py-2 w-full flex justify-center font-bold rounded"
         >
            <div>{errorMessage}</div>
         </button>
      </>}
   </>)
}

function FormFooter(props: {
   price: string,
   symbol: string,
}) {
   return (<div className="text-sm mt-4 text-gray-500">
      If this item doesn't ship to you, the seller be fined{' '}
      <span className="font-bold">
         {props.price}{' '}{props.symbol}.
      </span>
   </div>);
}

const fields = {
   DescriptionField: (_description: any) => {
      return <div> </div>;
   },
   TitleField: (_title: any) => {
      return <div> </div>;
   },
   // SchemaField: CustomSchemaField
};

function ObjectFieldTemplate(props: {
   properties: any
}) {
   return (
      <div>
         {/* Let's omit the {props.title} {props.description}*/}
         {props.properties.map((element: any) => <div key={element.name} className="property-wrapper w-full">{element.content}</div>)}
      </div>
   );
}

const customWidgets = {
   TextWidget: (props: any) => {
      return (
         <div className='w-full'>
            <input type="text"
               className="px-2 py-2 border rounded w-full"
               value={props.value}
               required={props.required}
               placeholder={props.uiSchema['ui:placeholder']}
               onChange={(event) => props.onChange(event.target.value)}
            />
         </div>
      )
   }
};


function CustomFieldTemplate(props: any) {
   const { id, classNames, label, help, required, description, errors, children } = props;
   return (
      <div className={classNames + ' w-full'}>
         {id === 'root' || <label htmlFor={id} className="text-xs font-bold py-1">{label}{required ? "*" : null}</label>}
         {description}
         {children}
         {errors}
         {help}
      </div>
   );
}

// Form that will auto generate a schema and format the fields to match our UI style mainly.
function OfferForm(props: {
   schema: string,
   setOfferData: (data: any) => void,
   offerData: any,
   price: string,
   symbol: string,
}) {
   let schema = JSON.parse(props.schema);
   return (

      <div className="flex w-full">
         <Form
            className='w-full mt-4'
            schema={schema}
            widgets={customWidgets}
            fields={fields}
            ObjectFieldTemplate={ObjectFieldTemplate}
            FieldTemplate={CustomFieldTemplate}
            onChange={(e) => {
               // There is some weird bug where the form doesn't update the value.
               // This is a workaround.
               let formData = JSON.parse(JSON.stringify(e.formData));
               let data = props.offerData;
               for (var key in formData) {
                  if (formData.hasOwnProperty(key)) {
                     data[key] = formData[key];
                  }
               }
               props.setOfferData(data);
            }}
         >
         </Form>

      </div>
   );
}

/////////////////////////////////
// Hand rolled forms.
/////////////////////////////////

// This is an hand rolled form that is a 1:1 matching with `ipfs://QmX6CZ7Wf8B79EX5x1PJSityvhtvvFKhkDBCDZK2cd6adF`
function SimpleOfferForm(props: {
   setOfferData: (data: any) => void,
   offerData: any,
   price: string,
   symbol: string,
}) {
   return (
      <div>
         <label className="flex flex-col mt-2">
            <div className="text-xs font-bold py-1">Shipping Address</div>
            <input
               type={'text'}
               className={'px-2 py-2 border rounded'}
               name="address"
               placeholder="100 Saddle Point; San Fransokyo, CA 94112"
               onChange={(e) => props.setOfferData({
                  ...props.offerData,
                  shippingAddress: e.target.value
               })}
            />
         </label>

         <label className="flex flex-col  mt-2">
            <div className="text-xs font-bold py-1">Email</div>
            <input
               type={'text'}
               className={'px-2 py-2 border rounded'}
               name="address"
               placeholder="you@ethereum.org"
               onChange={(e) => props.setOfferData({
                  ...props.offerData,
                  email: e.target.value
               })}
            />
         </label>
      </div>
   );
}
