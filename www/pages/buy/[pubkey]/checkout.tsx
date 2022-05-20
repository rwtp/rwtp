import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useRouter } from 'next/router';
import { BigNumber } from 'ethers';
import { Suspense, useState } from 'react';
import Image from 'next/image';
import {
  SellOrderData,
  useSellOrder,
  useSellOrderMethods,
} from '../../../lib/useSellOrder';
import { useTokenMethods } from '../../../lib/tokens';
import { postToIPFS } from '../../../lib/ipfs';
import { fromBn, toBn } from 'evm-bn';
import { ArrowLeftIcon, FingerPrintIcon } from '@heroicons/react/solid';
import { ConnectWalletLayout } from '../../../components/Layout';
import * as nacl from 'tweetnacl';
import { RequiresKeystore } from '../../../lib/keystore';
import { useEncryptionKeypair } from '../../../lib/useEncryptionKey';
import { DEFAULT_OFFER_SCHEMA } from '../../../lib/constants';
import Form from '@rjsf/core';
// const SchemaField = require('@rjsf/core/lib/components/fields/SchemaField');

function ConnectWalletButton(props: {
  children: React.ReactNode;
  onClick: () => void;
  className: string;
}) {
  return (
    <ConnectButton.Custom>
      {({ account, mounted, chain, openConnectModal, openChainModal }) => {
        function onClick() {
          if (!mounted || !account || !chain) {
            return openConnectModal();
          }

          if (chain?.unsupported) {
            return openChainModal();
          }

          props.onClick();
        }

        return (
          <button className={props.className} onClick={onClick}>
            {account && mounted && chain ? (
              props.children
            ) : (
              <>
                Connect Wallet <FingerPrintIcon className="h-4 w-4 ml-2" />
              </>
            )}
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
}

function BuyPage({ sellOrder }: { sellOrder: SellOrderData }) {
  const tokenMethods = useTokenMethods(sellOrder.token.address);
  const sellOrderMethods = useSellOrderMethods(sellOrder.address);
  const router = useRouter();
  const buyersEncryptionKeypair = useEncryptionKeypair();
  const [offerData, setOfferData] = useState({});
  const [submitHandler, setSubmitHandler] = useState({
    submit: () => {},
  });

  const quantity = 1;
  const price = sellOrder.priceSuggested
    ? BigNumber.from(sellOrder.priceSuggested)
    : BigNumber.from(0);
  const stake = sellOrder.stakeSuggested
    ? BigNumber.from(sellOrder.stakeSuggested)
    : BigNumber.from(0);

  async function onBuy() {
    if (!offerData) return;
    if (!buyersEncryptionKeypair) return;

    const secretData = Buffer.from(
      JSON.stringify(offerData),
      'utf-8'
    );
    const nonce = nacl.randomBytes(24);
    const sellersPublicEncryptionKey = Uint8Array.from(
      Buffer.from(sellOrder.encryptionPublicKey, 'hex')
    );

    const encrypted = nacl.box(
      secretData,
      nonce,
      sellersPublicEncryptionKey,
      buyersEncryptionKeypair?.secretKey
    );

    const data = {
      publicKey: buyersEncryptionKeypair.publicKey,
      nonce: Buffer.from(nonce).toString('hex'),
      message: Buffer.from(encrypted).toString('hex'),
    };
    const cid = await postToIPFS(data);

    const approveTx = await tokenMethods.approve.writeAsync({
      args: [sellOrder.address, price.add(stake).mul(quantity)],
    });
    await approveTx.wait();

    const tx = await sellOrderMethods.submitOffer.writeAsync({
      args: [0, quantity, price, stake, 'ipfs://' + cid],
      overrides: {
        gasLimit: 1000000,
      },
    });

    await tx.wait();
    router.push(`/buy/${sellOrder.address}`);
  }

  return (
    <ConnectWalletLayout>
      <div className="h-full w-full flex flex-col border-t">
        <div className="h-full flex w-full">
          <div className="flex w-full border-l border-r mx-auto">
            <div className="flex-1 justify-center flex flex-col bg-gray-50 items-center">
              <div>
                <div className="flex">
                  <a
                    href="/buy"
                    className="flex gap-2 justify-between items-center py-1 hover:opacity-50 transition-all text-sm text-gray-700"
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                    <div>Back</div>
                  </a>
                </div>

                <h1 className="pt-2 text-sm pt-12 text-gray-700">
                  {sellOrder.title}
                </h1>
                <p className="pb-2 text-xl mt-2">
                  {fromBn(price, sellOrder.token.decimals)}{' '}
                  {sellOrder.token.symbol}
                </p>

                <div className="flex mb-2 pt-12 ">
                  <div className="border rounded bg-white">
                    <Image width={256} height={256} src="/rwtp.png" />
                  </div>
                </div>
              </div>
            </div>
            <div className="py-24 px-8 flex-1 flex justify-center flex-col bg-white p-4 ">
              <div className="mt-4">
                {
                  sellOrder.offerSchemaUri && sellOrder.offerSchemaUri.replace("ipfs://", '') != DEFAULT_OFFER_SCHEMA ?
                    <OfferForm schema={sellOrder.offerSchema} setOfferData={setOfferData} offerData={offerData} setSubmitHandler={setSubmitHandler}/> :
                    <SimpleOfferForm setOfferData={setOfferData} offerData={offerData} />
                }
              </div>
              <div className="mt-4">
                <ConnectWalletButton
                  className="bg-black text-white px-4 py-2 rounded w-full justify-between flex items-center"
                  onClick={() => {
                    submitHandler && submitHandler.submit();
                    onBuy().catch(console.error);
                  }}
                >
                  <div>Submit Offer</div>
                  <div>{fromBn(price, sellOrder.token.decimals)}</div>
                </ConnectWalletButton>
                <div className="text-sm mt-4 text-gray-500">
                  If this item doesn't ship to you, the seller be fined{' '}
                  <span className="font-bold">
                    {fromBn(
                      BigNumber.from(sellOrder.sellersStake),
                      sellOrder.token.decimals
                    )}{' '}
                    {sellOrder.token.symbol}.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ConnectWalletLayout>
  );
}



function SimpleOfferForm(props: {
  setOfferData: (data: any) => void,
  offerData: any,
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


const CustomSchemaField = function(props) {
  return (
    <div id="custom">
      {/* <SchemaField {...props} /> */}
    </div>
  );
};

const fields = {
  DescriptionField: (description: any) => {
    return <div> </div>;
  },
  TitleField: (title: any) => {
    return <div> </div>;
  },
  // SchemaField: CustomSchemaField
};

function ObjectFieldTemplate(props: {
  properties: any
}) {
  return (
    <div>
      {/* {props.title} */}
      {/* {props.description} */}
      {props.properties.map((element: any) => <div key={element.id} className="property-wrapper w-full">{element.content}</div>)}
    </div>
  );
}

const customWidgets = {
  // To add a placeholder we will need to update the uiSchema prop on Form.
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
  const {id, classNames, label, help, required, description, errors, children} = props;

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
function OfferForm(props: {
  schema: string,
  setOfferData: (data: any) => void,
  offerData: any,
  setSubmitHandler: any
}) {
  // TODO: Add form validation on submit button.
  let yourForm;
  let schema = JSON.parse(props.schema);
  const onSubmit = ({formData}) => console.log("Data submitted: ",  formData);
  return (
    
    <div className="flex w-full">
      {/* <div>sadklfjlkadsjgflkajsd;lfkjs;adlkjfl;ksadjf;lkadsjf;kjasd;lfkjasd;lkfj;laksjfdl;ksadjf;l</div> */}
      <Form 
      className='w-full'
      schema={schema}
        widgets={customWidgets}
        fields={fields}
        // onSubmit={onSubmit}
        ObjectFieldTemplate={ObjectFieldTemplate}
        FieldTemplate={CustomFieldTemplate}
        // ref={(form) => {yourForm = form;}}
        // ref={(form) => {props.setSubmitHandler(form);}}
        onChange={(e) => {
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
        { /* This body needs to be empty so that the submit button isn't rendered. */ }
        <div className="mt-4">
          <ConnectWalletButton
            className="bg-black text-white px-4 py-2 rounded w-full justify-between flex items-center"
            onClick={() => {
              // onBuy().catch(console.error);
            }}
          >
            <div>Submit Offer</div>
            {/* <div>{fromBn(price, sellOrder.token.decimals)}</div> */}
          </ConnectWalletButton>
        </div>
      </Form>

    </div>
  );
}

function Loading() {
  return <div className="bg-gray-50 animate-pulse h-screen w-screen"></div>;
}

function PageWithPubkey(props: { pubkey: string }) {
  const sellOrder = useSellOrder(props.pubkey);

  if (!sellOrder.data) return <Loading />;

  return <BuyPage sellOrder={sellOrder.data} />;
}

export default function Page() {
  const router = useRouter();
  const pubkey = router.query.pubkey as string;

  if (!pubkey) {
    return <Suspense fallback={<Loading />}></Suspense>;
  }

  return (
    <Suspense fallback={<Loading />}>
      <RequiresKeystore>
        <PageWithPubkey pubkey={pubkey} />
      </RequiresKeystore>
    </Suspense>
  );
}
