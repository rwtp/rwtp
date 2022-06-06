import { Popup } from 'reactjs-popup';
import { InformationCircleIcon } from '@heroicons/react/outline';

export function BuyersCostInfo() {
  return (
    <Popup
      trigger={(_open) => (
        <button>
          <InformationCircleIcon className="h-4 w-4 hover:opacity-50" />
        </button>
      )}
      position="top left"
    >
      <div className="drop-shadow">
        <div className="px-4 py-2 bg-gray-50 w-60 whitespace-normal text-sm">
          <div>
            <b>Buyer's Cost</b> is the amount of money the buyer will lose if
            they declare that you did not deliver. This is to protect you from
            anyone falsely claiming a failed deal.
            <br />
            <br />
            If the buyer's cost is less than the price of the product, they will
            get a refund of
            <div className="text-sm font-mono py-1">Price - Buyer's Cost</div>
            upon claiming the deal has failed.
          </div>
        </div>
        <div className="ml-2 right-triangle-down"></div>
      </div>
    </Popup>
  );
}

export function SellerSideSellersDepositInfo() {
  return (
    <Popup
      trigger={(_open) => (
        <button>
          <InformationCircleIcon className="h-4 w-4 hover:opacity-50" />
        </button>
      )}
      position="top left"
    >
      <div className="drop-shadow">
        <div className="px-4 py-2 bg-gray-50 w-60 text-sm">
          <span className="whitespace-pre-line">
            <b>Seller's Deposit</b> is the amount of money you put up as a
            deposit everytime a deal is in process. It assures to the buyer that
            you intend to deliver on your product. <br />
            <br /> If the deal fails, you will lose this deposit. If it
            succeeds, you will get your seller's deposit back.
          </span>
        </div>
        <div className="right-triangle-down ml-2"></div>
      </div>
    </Popup>
  );
}

export function BuyerSideSellersDepositInfo() {
  return (
    <Popup
      trigger={(_open) => (
        <button>
          <InformationCircleIcon className="h-3.5 w-3.5 text-gray-400 hover:opacity-50" />
        </button>
      )}
      position="top right"
    >
      <div className="drop-shadow">
        <div className="px-4 py-2 bg-gray-50 w-60 text-sm">
          <span className="whitespace-pre-line">
            <b>Seller's Deposit</b> is the amount of money the seller puts up as
            a deposit everytime a deal is in process. It assures to you that the
            seller intends to deliver on this product. <br />
            <br /> If the deal fails, the seller will lose this deposit.
          </span>
        </div>
        <div className="right-triangle-down-left ml-56"></div>
      </div>
    </Popup>
  );
}

export function BuyersDepositInfo(hasRefund: boolean) {
  if (hasRefund) {
    return;
  } else {
    return (
      <Popup
        trigger={(_open) => (
          <button>
            <InformationCircleIcon className="h-3.5 w-3.5 text-gray-400 hover:opacity-50" />
          </button>
        )}
        position="top left"
      >
        <div className="drop-shadow -ml-12">
          <div className="px-4 py-2 bg-gray-50 w-60 text-sm">
            <span className="whitespace-pre-line">
              <b>Buyer's Deposit</b> is the amount of money you lose if you decide
              the deal has failed (if the seller does not deliver). This is held
              upfront when you purchase the product, and will be returned to you
              once the deal if successful.
            </span>
          </div>
          <div className="right-triangle-down ml-14"></div>
        </div>
      </Popup>
    );
  }
}
