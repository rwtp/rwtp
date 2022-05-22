import { ConnectButton } from '@rainbow-me/rainbowkit';
import { FingerPrintIcon } from '@heroicons/react/solid';
import Form from '@rjsf/core';


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


function SubmitOfferButton(props: {
  onClick?: () => void,
  price: string,
  symbol: string
}) {
  return (
    <button className="mt-4 bg-black text-white px-4 py-2 w-full flex justify-between font-bold rounded"
      onClick={props.onClick}
    >
      <div>Submit Offer</div>
      <div>{props.price} {props.symbol}</div>
    </button>
  )
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
export function OfferForm(props: {
  schema: string,
  setOfferData: (data: any) => void,
  offerData: any,
  price: string,
  onSubmit: () => Promise<void>,
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
        onSubmit={() => props.onSubmit().catch(console.error)}
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
        <div className='mt-4'>
          <SubmitOfferButton price={props.price} symbol={props.symbol} />
          <FormFooter price={props.price} symbol={props.symbol} />
        </div>
      </Form>

    </div>
  );
}

/////////////////////////////////
// Hand rolled forms.
/////////////////////////////////

// This is an hand rolled form that is a 1:1 matching with `ipfs://QmX6CZ7Wf8B79EX5x1PJSityvhtvvFKhkDBCDZK2cd6adF`
export function SimpleOfferForm(props: {
  setOfferData: (data: any) => void,
  offerData: any,
  price: string,
  symbol: string,
  onSubmit: () => Promise<void>,
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
      <div className="mt-4">
        <SubmitOfferButton price={props.price} symbol={props.symbol} onClick={() => props.onSubmit().catch(console.error)} />
        <FormFooter price={props.price} symbol={props.symbol} />
      </div>
    </div>
  );
}
