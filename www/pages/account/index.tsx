import { Suspense } from 'react';
import { ConnectWalletLayout, Footer } from '../../components/Layout';
import ManageSidebar from '../../components/ManageSidebar';
import { useRouter } from 'next/router';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { CogIcon } from '@heroicons/react/solid';

export default function ManagementSummaryPage() {
  let router = useRouter();
  let n = router.pathname.lastIndexOf('/');
  let page = router.pathname.substring(n + 1);
  //console.log(page);
  return (
    <div className="flex flex-col h-screen w-screen">
      <ConnectWalletLayout>
        <div className="flex flex-row w-full gap-4 h-full">
          {ManageSidebar(page)}
          <Suspense fallback={<div></div>}>
            <ConnectButton.Custom>
              {({ openAccountModal }) => {
                return (
                  <div className="flex mt-32 w-full justify-center">
                    {/* <AvatarComponent address={account?.address} size={null} /> */}
                    <div className="flex flex-row gap-2 align-middle">
                      <div>Hello Friend!</div>
                      <CogIcon
                        className="h-5 w-5"
                        onClick={() => openAccountModal()}
                      />
                    </div>
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </Suspense>
        </div>
      </ConnectWalletLayout>
      <Footer />
    </div>
  );
}
