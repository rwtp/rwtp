import {
  useOffersFrom,
  OfferData,
  OrderData,
  useOrderMethods,
  useAllOrderOffers,
  useOrderOffersFrom,
} from '../../lib/useOrder';
import { Suspense, useState } from 'react';
import { ConnectWalletLayout, Footer } from '../../components/Layout';
import ManageSidebar from '../../components/ManageSidebar';
import { useAccount } from 'wagmi';
import dayjs from 'dayjs';
import { useRouter } from 'next/router';
import {
  toUIString,
  getExpirationNum,
  getBuyerFriendlyStatus,
} from '../../lib/ui-logic';
import { BigNumber } from 'ethers';
import { getPrimaryImageLink } from '../../lib/image';

// function ActionButtons(props: { listing: OrderData }) {
//     const [isSetActiveLoading, setisSetActiveLoadingg] = useState(false);
//     //const signer = useSigner();
//     const account = useAccount();

//     const methods = useOrderMethods(props.order.address);

//     async function callToggleActive(active:boolean) {
//       const tx = await methods.confirm.writeAsync({
//         args: [active],
//         overrides: {
//           gasLimit: 1000000,
//         },
//       });
//     }
// }

function RenderOffers(props: { listing: OrderData }) {
  const totalOffers = props.listing.offers.length;
  if (totalOffers === 0) {
    return (
      <div className="flex flex-row gap-2 w-full">
        <div className="text-sm font-mono text-gray-400">Total Offers:</div>
        <div className="text-sm">{totalOffers}</div>
      </div>
    );
  } else {
    return (
      //   <div className="flex flex-col gap-1">
      //     <div className="flex flex-row gap-2 w-full">
      //       <div className="text-sm font-mono text-gray-400">Total Offers:</div>
      //       <div className="text-sm">{totalOffers}</div>
      //     </div>
      //     <div className="ml-4 flex flex-row gap-2 w-full">
      //       <div className="text-sm font-mono text-gray-400">In Progress:</div>
      //       <div className="text-sm">
      //         {
      //           props.listing.offers.filter(
      //             (l: OfferData) =>
      //               l.history[l.history.length - 1].state === 'Committed'
      //           ).length
      //         }
      //       </div>
      //     </div>
      //     <div className="ml-4 flex flex-row gap-2 w-full">
      //       <div className="text-sm font-mono text-gray-400">Completed:</div>
      //       <div className="text-sm">
      //         {
      //           props.listing.offers.filter(
      //             (l: OfferData) =>
      //               l.history[l.history.length - 1].state === 'Confirmed'
      //           ).length
      //         }
      //       </div>
      //     </div>
      //   </div>
      <div className="flex flex-col gap-1">
        <div className="grid grid-cols-2 gap-2 w-full">
          <div className="flex flex-col gap-1">
            <div className="text-sm font-bold font-mono text-gray-400">
              Total Offers:
            </div>
            <div className="ml-4 text-sm font-mono text-gray-400">
              In Progress:
            </div>
            <div className="ml-4 text-sm font-mono text-gray-400">
              Completed:
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-sm font-bold">{totalOffers}</div>
            <div className="text-sm">
              {
                props.listing.offers.filter(
                  (l: OfferData) =>
                    l.history[l.history.length - 1].state === 'Committed'
                ).length
              }
            </div>
            <div className="text-sm">
              {
                props.listing.offers.filter(
                  (l: OfferData) =>
                    l.history[l.history.length - 1].state === 'Confirmed'
                ).length
              }
            </div>
          </div>
        </div>
      </div>
    );
  }
}

function ListingTile(props: {
  listing: OrderData;
  setTxHash: (_: any) => void;
}) {
  console.log(props.listing.offers);
  return (
    <div className={`flex flex-col lg:flex-row border gap-4 p-2 pr-4`}>
      <img
        className="object-cover w-full h-60 lg:w-36 lg:h-36"
        src={getPrimaryImageLink(props.listing)}
        alt="item"
      />
      <div className="flex flex-col w-full">
        <div className="flex flex-row gap-4 justify-between">
          <div className="overflow-hidden font-serif text-lg">
            {props.listing.title}
          </div>
          <div className="text-lg font-bold">
            {toUIString(
              BigNumber.from(props.listing.priceSuggested),
              props.listing.tokensSuggested[0].decimals
            )}{' '}
            {props.listing.tokensSuggested[0].symbol}
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-2 lg:gap-4 mt-4">
          <div className="flex flex-col gap-2 w-full">
            <div className="flex flex-row gap-2">
              <div className="text-sm font-mono text-gray-400">Created:</div>
              <div className="text-sm whitespace-nowrap">
                {dayjs
                  .unix(Number.parseInt(props.listing.createdAt))
                  .format('MMM D YYYY, h:mm a')}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex flex-row gap-2 w-full">
                <RenderOffers listing={props.listing} />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-row gap-2 lg:place-self-end">
              <div className="text-sm font-mono text-gray-400 lg:whitespace-nowrap">
                Suggested Buyer's Deposit:
              </div>
              <div className="text-sm lg:whitespace-nowrap">
                {toUIString(
                  BigNumber.from(props.listing.buyersCostSuggested),
                  props.listing.tokensSuggested[0].decimals
                )}{' '}
                {props.listing.tokensSuggested[0].symbol}
              </div>
            </div>
            <div className="flex flex-row gap-2 lg:place-self-end">
              <div className="text-sm font-mono text-gray-400 whitespace-nowrap">
                Your Deposit:
              </div>
              <div className="text-sm whitespace-nowrap">
                {toUIString(
                  BigNumber.from(props.listing.sellersStakeSuggested),
                  props.listing.tokensSuggested[0].decimals
                )}{' '}
                {props.listing.tokensSuggested[0].symbol}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Listings(props: { setTxHash: (_: any) => void }) {
  const account = useAccount();
  const listings = useAllOrderOffers(account.data?.address || '');

  if (listings.error) {
    return <pre>{JSON.stringify(listings.error, null, 2)}</pre>;
  }

  if (!listings.data) {
    return null;
  }

  if (listings.data.length === 0) {
    return <div className="text-gray-500">You have not made any listings.</div>;
  }

  const listingView = listings.data
    .sort((listing_0, listing_1) => {
      return (
        Number.parseInt(listing_0.createdAt) -
        Number.parseInt(listing_1.createdAt)
      );
    })
    .map((listing: OrderData) => {
      return (
        <ListingTile
          key={listing.address + listing.uri}
          listing={listing}
          setTxHash={props.setTxHash}
        />
      );
    });

  return <div className="w-full flex flex-col gap-4 mr-4">{listingView}</div>;
}

export default function ManageListingPage() {
  let router = useRouter();
  let n = router.pathname.lastIndexOf('/');
  let page = router.pathname.substring(n + 1);
  const [txHash, setTxHash] = useState('');

  return (
    <ConnectWalletLayout txHash={txHash}>
      <div className="h-full flex flex-col">
        <div className="flex-1 max-w-6xl">
          <div className="flex flex-row gap-4 h-full">
            {ManageSidebar(page)}
            <Suspense fallback={<div></div>}>
              <Listings setTxHash={setTxHash} />
            </Suspense>
          </div>
        </div>
        <Footer />
      </div>
    </ConnectWalletLayout>
  );
}
