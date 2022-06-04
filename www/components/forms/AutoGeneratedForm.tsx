import { RefreshIcon } from '@heroicons/react/solid';
import Form from '@rjsf/core';
import { BigNumber } from 'ethers';
import { fromBn } from 'evm-bn';
import { useRouter } from 'next/router';
import { Dispatch, SetStateAction, useState } from 'react';
import nacl from 'tweetnacl';
import { DEFAULT_OFFER_SCHEMA } from '../../lib/constants';
import { postToIPFS } from '../../lib/ipfs';
import { useTokenMethods } from '../../lib/tokens';
import { useChainId } from '../../lib/useChainId';
import { useEncryptionKeypair } from '../../lib/useEncryptionKey';
import { OrderData, useOrderMethods } from '../../lib/useOrder';
import { WalletConnectedButton, KeyStoreConnectedButton } from '../Buttons';
import { createRef } from 'react';
import DefaultJsonSchema from '../../offer_schemas/QmazbhKYabkic5Z3F6hPC6rkGJP5gimu3eP9ABqMUZHFsk.json';
import { validate, ValidationError } from 'jsonschema';

const fields = {
  DescriptionField: (_description: any) => {
    return <div> </div>;
  },
  TitleField: (_title: any) => {
    return <div> </div>;
  },
  // SchemaField: CustomSchemaField
};

const customWidgets = {
  TextWidget: (props: any) => {
    return (
      <div className="w-full">
        <input
          type="text"
          className="px-2 py-2 border rounded w-full"
          value={props.value}
          required={props.required}
          placeholder={props.uiSchema['ui:placeholder']}
          onChange={(event) => props.onChange(event.target.value)}
        />
      </div>
    );
  },
};

function ObjectFieldTemplate(props: { properties: any }) {
  return (
    <div>
      {/* Let's omit the {props.title} {props.description}*/}
      {props.properties.map((element: any) => (
        <div key={element.name} className="property-wrapper w-full">
          {element.content}
        </div>
      ))}
    </div>
  );
}

function CustomFieldTemplate(props: any) {
  const {
    id,
    classNames,
    label,
    help,
    required,
    description,
    errors,
    children,
  } = props;
  return (
    <div className={classNames + ' w-full mt-4'}>
      {id === 'root' || (
        <label htmlFor={id} className="text-sm font-bold py-1">
          {label}
          {required ? '*' : null}
        </label>
      )}
      {description}
      {children}
      {errors}
      {help}
    </div>
  );
}

// Form that will auto generate a schema and format the fields to match our UI style mainly.
export function OfferForm(props: {
  schema: string;
  setOfferData: (data: any) => void;
  offerData: any;
  price: string;
  setValidChecker: (_: () => Boolean) => void;
  symbol: string;
}) {
  let submitFormRef = createRef<HTMLButtonElement>();
  let formRef: Form<any> | null;
  let [offerData, setOfferData] = useState<any>();

  props.setValidChecker(() => {
    submitFormRef.current !== null && submitFormRef.current.click();
    return (
      formRef !== null &&
      formRef !== undefined &&
      formRef.validate(offerData).errors.length === 0
    );
  });
  let schema = JSON.parse(props.schema);
  return (
    <div className="flex flex-1 flex-col w-full">
      <div className="font-serif mb-2 text-2xl">Checkout</div>
      <Form
        className="w-full mt-4"
        schema={schema}
        widgets={customWidgets}
        fields={fields}
        ref={(form) => {
          formRef = form;
        }}
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
          setOfferData(data);
        }}
      >
        {/* Using this implementation https://github.com/rjsf-team/react-jsonschema-form/issues/500#issuecomment-743116788 */}
        <button
          ref={submitFormRef}
          type="submit"
          style={{ display: 'none' }}
        ></button>
      </Form>
    </div>
  );
}
