import { useAccount } from 'wagmi';
import { OfferData } from '../../lib/useOffer';
import { FadeIn } from '../FadeIn';
import { fromBn } from 'evm-bn';
import { BigNumber } from 'ethers';
import { SellOrderData, useAllSellOrderOffers } from '../../lib/useSellOrder';

function OfferList() {
  const signer = useAccount();

  const address = signer && signer.data ? signer.data.address : undefined;

  const offerList = address ? (
    <OfferListForSeller seller={address} />
  ) : (
    <div>Connect your wallet to view offers</div>
  );

  return offerList;
}

function OfferListForSeller(props: { seller: string }) {
  const orders = useAllSellOrderOffers(props.seller);

  if (orders.error) {
    return <pre>{JSON.stringify(orders.error, null, 2)} </pre>;
  }

  if (!orders.data) {
    return null;
  }

  if (orders.data && orders.data.length == 0) {
    return <div>No offers found.</div>;
  }

  console.log(orders.data);

  const view = orders.data
    .map((sellOrder) => {
      const offers = sellOrder.offers.map((offer) => {
        return (
          <OfferView
            key={offer.index + sellOrder.address}
            offer={{
              buyer: offer.buyer,
              sellOrder: sellOrder,
              index: offer.index,
              quantity: offer.quantity,
              pricePerUnit: offer.pricePerUnit,
              stakePerUnit: offer.stakePerUnit,
              uri: offer.uri,
              createdAt: offer.createdAt,
              state: offer.state,
            }}
          />
        );
      });

      return offers;
    })
    .flat();

  return <div className="flex flex-col flex-1">{view}</div>;
}

function OfferView(props: { offer: OfferData & { sellOrder: SellOrderData } }) {
  return (
    <FadeIn className="flex flex-col py-4">
      <div className="bg-white border">
        <div className="flex px-4 pt-4">
          <div className="flex flex-col">
            <div className="text-gray-500 text-xs">Ordered on</div>
            <div className="text-lg font-serif">
              {new Date().toDateString()}
            </div>
          </div>
        </div>
        <div className="flex gap-4 justify-between py-4 px-4">
          <div className="flex-1">
            <div className="text-gray-500 text-xs">Quantity</div>
            <div className="text-lg font-mono">1</div>
          </div>
          <div className="flex-1">
            <div className="text-gray-500 text-xs">Price</div>
            <div className="text-lg font-mono">
              {fromBn(
                BigNumber.from(props.offer.pricePerUnit),
                props.offer.sellOrder.token.decimals
              )}{' '}
              <span className="text-sm">
                {props.offer.sellOrder.token.symbol}
              </span>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-gray-500 text-xs">Buyer's deposit</div>
            <div className="text-lg font-mono">
              {fromBn(
                BigNumber.from(props.offer.stakePerUnit),
                props.offer.sellOrder.token.decimals
              )}{' '}
              <span className="text-sm">
                {props.offer.sellOrder.token.symbol}
              </span>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-gray-500 text-xs">Seller's Deposit</div>
            <div className="text-lg font-mono">
              {fromBn(
                BigNumber.from(props.offer.sellOrder.sellersStake),
                props.offer.sellOrder.token.decimals
              )}{' '}
              <span className="text-sm">
                {props.offer.sellOrder.token.symbol}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 items-center p-4 border-t px-4">
          <button className="bg-black rounded text-white text-sm px-4 py-2 hover:opacity-50">
            Accept Order
          </button>
        </div>
      </div>
    </FadeIn>
  );
}

export default OfferList;
