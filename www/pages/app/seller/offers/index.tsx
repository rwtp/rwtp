import dynamic from 'next/dynamic';
import { ConnectWalletLayout, Footer } from '../../../../components/Layout';

const OfferList = dynamic(
  () => import('../../../../components/dynamic/OfferList'),
  {
    ssr: false,
  }
);

export default function Page() {
  return (
    <ConnectWalletLayout>
      <div className="h-full flex flex-col">
          <div className="h-full p-4 max-w-6xl mx-auto w-full flex-1">
            <div className="pb-8">
              <h1 className="font-serif text-2xl pb-1">Offers</h1>
              <p className="pb-4">This list may be incomplete.</p>
            </div>
            <OfferList />
          </div>
        <Footer />
      </div>
    </ConnectWalletLayout>
  );
}
