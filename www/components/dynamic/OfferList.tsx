import { useAccount } from 'wagmi';
import { OfferData, useOffers } from '../../lib/useOffer';
import Tag from '../../components/Tag';

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
  const offers = useOffers({
    first: 10,
    skip: 0,
    seller: props.seller,
  });

  if (!offers.data) {
    return null;
  }

  if (offers.data && offers.data.length == 0) {
    return <div>No offers found.</div>;
  }

  return <Results offers={offers.data} />;
}

function Results(props: { offers: any }) {
  const offersView = props.offers.map((offer: any) => {
    return (
      <OfferView
        key={offer.id}
        offer={{
          id: offer.id,
          buyer: offer.buyer,
          seller: offer.seller,
          index: offer.index,
          quantity: offer.quantity,
          pricePerUnit: offer.pricePerUnit,
          stakePerUnit: offer.stakePerUnit,
          uri: offer.uri,
          createdAt: offer.createdAt,
        }}
      />
    );
  });

  return <div>{offersView}</div>;
}

function OfferView(props: { offer: OfferData }) {
  return (
    <div className="py-2">
      <div className="flex gap-2 items-center justify-between">
        <a
          className="underline font-serif"
          href={`/app/seller/offers/${props.offer.index}`}
        >
          Offer from {props.offer.buyer}
        </a>
        <div className="h-px bg-black w-full flex-1" />
        <Tag type="info">Price ${props.offer.pricePerUnit}/unit</Tag>
        <Tag type="info">Stake ${props.offer.stakePerUnit}/unit</Tag>
        <Tag type="info">Qty {props.offer.quantity}x</Tag>
      </div>
    </div>
  );
}

export default OfferList;
