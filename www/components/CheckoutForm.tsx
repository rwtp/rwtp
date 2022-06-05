import { RefreshIcon } from '@heroicons/react/solid';
import Form from '@rjsf/core';
import { BigNumber } from 'ethers';
import { fromBn } from 'evm-bn';
import { useRouter } from 'next/router';
import { Dispatch, SetStateAction, useState } from 'react';
import nacl from 'tweetnacl';
import { DEFAULT_OFFER_SCHEMA } from '../lib/constants';
import { postJSONToIPFS } from '../lib/ipfs';
import { useTokenMethods } from '../lib/tokens';
import { useChainId } from '../lib/useChainId';
import { useEncryptionKeypair } from '../lib/useEncryptionKey';
import { OrderData, useOrderMethods } from '../lib/useOrder';
import { WalletConnectedButton, KeyStoreConnectedButton } from './Buttons';
import { createRef } from 'react';
import DefaultJsonSchema from '../offer_schemas/QmaLinmex9ucfwPWpgSfDPiD1wy7Xy61MzSFLpakgGr7nC.json';
import { validate, ValidationError } from 'jsonschema';
import { SubmitOfferButton } from './SubmitOfferButton';
import { OfferForm } from './forms/AutoGeneratedForm';
import { SimpleOfferForm } from './forms/DefaultForm';

export function formatPrice(order: OrderData) {
  return fromBn(
    BigNumber.from(order.priceSuggested ? order.priceSuggested : 0),
    order.tokensSuggested[0].decimals
  );
}

export function CheckoutForm(props: {
  order: OrderData;
  setOfferData: Dispatch<SetStateAction<any>>;
  setValidChecker: (_: () => Boolean) => void;
}) {
  const [offerData, setOfferData] = useState({});

  const price = formatPrice(props.order);
  let validChecker: () => Boolean | undefined;

  return (
    <>
      <div>
        {props.order.offerSchemaUri &&
        props.order.offerSchemaUri.replace('ipfs://', '') !=
          DEFAULT_OFFER_SCHEMA ? (
          <OfferForm
            schema={props.order.offerSchema}
            setOfferData={setOfferData}
            offerData={offerData}
            price={price}
            setValidChecker={props.setValidChecker}
            symbol={props.order.tokensSuggested[0].symbol}
          />
        ) : (
          <SimpleOfferForm
            setOfferData={setOfferData}
            offerData={offerData}
            price={price}
            setValidChecker={props.setValidChecker}
            symbol={props.order.tokensSuggested[0].symbol}
          />
        )}
      </div>
    </>
  );
}
