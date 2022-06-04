import { ConnectButton } from '@rainbow-me/rainbowkit';
import { FingerPrintIcon } from '@heroicons/react/solid';
import Form from '@rjsf/core';
import { createRef } from 'react';
import { useState } from 'react';
import DefaultJsonSchema from '../offer_schemas/QmaLinmex9ucfwPWpgSfDPiD1wy7Xy61MzSFLpakgGr7nC.json';
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

const customWidgets = {
  TextWidget: (props: any) => {
    return (
      <div className="w-full">
        <input
          type="text"
          className="px-2 py-2 border rounded w-full "
          value={props.value}
          required={props.required}
          placeholder={props.uiSchema['ui:placeholder']}
          onChange={(event) => props.onChange(event.target.value)}
        />
      </div>
    );
  },
};

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

/////////////////////////////////
// Hand rolled forms.
/////////////////////////////////

// This is an hand rolled form that is a 1:1 matching with `ipfs://QmX6CZ7Wf8B79EX5x1PJSityvhtvvFKhkDBCDZK2cd6adF`
export function SimpleOfferForm(props: {
  setOfferData: (data: any) => void;
  offerData: any;
  price: string;
  symbol: string;
  onSubmit: () => Promise<void>;
  setValidChecker: (_: () => Boolean) => void;
}) {
  let [errors, setErrors] = useState<ValidationError[]>([]);
  props.setValidChecker(() => {
    // Write code here to validate the form.
    let _errors = validate(props.offerData, DefaultJsonSchema).errors;
    if (_errors) {
      setErrors(_errors);
    }
    // console.log(_errors);
    return _errors.length === 0;
  });
  return (
    <div className="relative w-full">
      <div className="font-serif mb-2 text-2xl">Checkout</div>
      <div className="flex mt-8 flex-col gap-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex flex-col md:w-1/2">
            <div className="text-sm font-bold py-1">First Name*</div>
            <input
              type={'text'}
              className={`px-4 py-2 border rounded ${
                errors.map((x) => x.argument).includes('firstName') &&
                'border-red-500'
              }`}
              name="First Name"
              placeholder="Heinz"
              onChange={(e) =>
                props.setOfferData({
                  ...props.offerData,
                  firstName: e.target.value,
                })
              }
            />
          </div>
          <div className="flex flex-col md:w-1/2">
            <div className="text-sm font-bold py-1">Last Name*</div>
            <input
              type={'text'}
              className={`px-4 py-2 border rounded ${
                errors.map((x) => x.argument).includes('lastName') &&
                'border-red-500'
              }`}
              name="Last Name"
              placeholder="Doofenshmirtz"
              onChange={(e) =>
                props.setOfferData({
                  ...props.offerData,
                  lastName: e.target.value,
                })
              }
            />
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex flex-col md:w-1/2">
            <div className="text-sm font-bold py-1">Email*</div>
            <input
              type={'text'}
              className={`px-4 py-2 border rounded ${
                errors.map((x) => x.argument).includes('email') &&
                'border-red-500'
              }`}
              name="email"
              placeholder="myemail@gmail.com"
              onChange={(e) =>
                props.setOfferData({
                  ...props.offerData,
                  email: e.target.value,
                })
              }
            />
          </div>
          <div className="flex flex-col md:w-1/2">
            <div className="text-sm font-bold py-1">Phone</div>
            <input
              type={'text'}
              className={'px-4 py-2 border rounded'}
              name="phone"
              placeholder="888-888-8888"
              onChange={(e) =>
                props.setOfferData({
                  ...props.offerData,
                  phone: e.target.value,
                })
              }
            />
          </div>
        </div>
        <div className="text-base font-bold py-1 mt-8">Shipping Address</div>
        <div className="flex flex-col">
          <div className="text-sm font-bold py-1">Country*</div>
          <input
            type={'text'}
            className={`px-4 py-2 border rounded ${
              errors.map((x) => x.argument).includes('shippingCountry') &&
              'border-red-500'
            }`}
            name="country"
            placeholder="United States"
            onChange={(e) =>
              props.setOfferData({
                ...props.offerData,
                shippingCountry: e.target.value,
              })
            }
          />
        </div>
        <div className="flex flex-col">
          <div className="text-sm font-bold py-1">Address*</div>
          <input
            type={'text'}
            className={`px-4 py-2 border rounded ${
              errors.map((x) => x.argument).includes('shippingAddress1') &&
              'border-red-500'
            }`}
            name="address1"
            placeholder="888 Berry St"
            onChange={(e) =>
              props.setOfferData({
                ...props.offerData,
                shippingAddress1: e.target.value,
              })
            }
          />
          <input
            type={'text'}
            className={'px-4 py-2 border rounded mt-2'}
            name="address2"
            placeholder="APT 1510"
            onChange={(e) =>
              props.setOfferData({
                ...props.offerData,
                shippingAddress2: e.target.value,
              })
            }
          />
        </div>
        <div className="overflow-hidden flex flex-initial flex-col md:flex-row gap-4">
          <div className="flex flex-col md:w-1/3">
            <div className="text-sm font-bold py-1">City*</div>
            <input
              type={'text'}
              className={`px-4 py-2 border rounded ${
                errors.map((x) => x.argument).includes('shippingCity') &&
                'border-red-500'
              }`}
              name="city"
              placeholder="Austin"
              onChange={(e) =>
                props.setOfferData({
                  ...props.offerData,
                  shippingCity: e.target.value,
                })
              }
            />
          </div>
          <div className="overflow-hidden flex flex-col">
            <div className="text-sm font-bold py-1 md:w-1/3">State</div>
            <input
              type={'text'}
              className={'overflow-hidden px-4 py-2 border rounded'}
              name="state"
              placeholder="TX"
              onChange={(e) =>
                props.setOfferData({
                  ...props.offerData,
                  shippingState: e.target.value,
                })
              }
            />
          </div>
          <div className="overflow-hidden flex flex-col whitespace-nowrap">
            <div className="text-sm font-bold py-1 md:w-1/3">Zip Code</div>
            <input
              type={'text'}
              className={'overflow-hidden px-4 py-2 border rounded'}
              name="zipCode"
              placeholder="12345"
              onChange={(e) =>
                props.setOfferData({
                  ...props.offerData,
                  shippingZipCode: e.target.value,
                })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
