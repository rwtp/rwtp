import { Suspense } from 'react';
import { ConnectWalletLayout, Footer } from '../../components/Layout';
import ManageSidebar from '../../components/ManageSidebar';

export default function ManagementSummaryPage() {
  return (
    <ConnectWalletLayout>
      <div className="h-full flex flex-col">
        <div className="mt-6 flex-1 w-full">
          <div className="max-w-6xl mx-auto px-4">
            <Suspense fallback={<div></div>}>
              <ManageSidebar>
                <p>Hello friend!</p>
                <p>
                  You've made the equivalent of <b>0 USD</b> so far.
                </p>
                <p>
                  You currently have <b>0</b> orders pending.
                </p>
              </ManageSidebar>
            </Suspense>
          </div>
        </div>
        <Footer />
      </div>
    </ConnectWalletLayout>
  );
}
