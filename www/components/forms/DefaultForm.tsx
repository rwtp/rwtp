import DefaultJsonSchema from '../../offer_schemas/QmaLinmex9ucfwPWpgSfDPiD1wy7Xy61MzSFLpakgGr7nC.json';
import { validate, ValidationError } from 'jsonschema';
import { useState } from 'react';

// This is an hand rolled form that is a 1:1 matching with `ipfs://QmX6CZ7Wf8B79EX5x1PJSityvhtvvFKhkDBCDZK2cd6adF`
export function SimpleOfferForm(props: {
  setOfferData: (_: any) => void;
  offerData: any;
  price: string;
  symbol: string;
  setValidChecker: (_: () => Boolean) => void;
}) {
  let [errors, setErrors] = useState<ValidationError[]>([]);
  props.setValidChecker(() => {
    // Write code here to validate the form.
    console.log(DefaultJsonSchema);
    let _errors = validate(props.offerData, DefaultJsonSchema).errors;
    if (_errors) {
      console.error(errors);
      setErrors(_errors);
    }
    console.log();
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
              className={`px-4 py-2 border rounded ${
                errors.map((x) => x.argument).includes('phone') &&
                'border-red-500'
              }`}
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
            className={`px-4 py-2 mt-2 border rounded ${
              errors.map((x) => x.argument).includes('shippingAddress2') &&
              'border-red-500'
            }`}
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
              className={`px-4 py-2 border rounded ${
                errors.map((x) => x.argument).includes('shippingState') &&
                'border-red-500'
              }`}
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
              className={`px-4 py-2 border rounded ${
                errors.map((x) => x.argument).includes('shippingZipCode') &&
                'border-red-500'
              }`}
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
