import { CheckCircleIcon, ArrowLeftIcon } from '@heroicons/react/solid';
import { NextRouter } from 'next/router';
import { FadeIn } from './FadeIn';

export function KeystoreModal(props: {
  login: () => Promise<void>;
  router: NextRouter;
}) {
  return (
    <div className="fixed top-0 left-0 right-0 bottom-0">
      <FadeIn className="bg-gray-300 bg-opacity-50 h-full w-full p-4 border-t flex items-center justify-center">
        <div className="bg-white border max-w-xl mx-auto">
          <div className="p-8">
            <h1 className="text-2xl mb-2 font-serif">
              Allow this site to handle sensitive data?
            </h1>
            <p className="pb-2 ">
              This page wants to handle personally identifiable information
              required for shipping packages, like names, emails, mailing
              addresses, and so on.
            </p>
            <div className="flex-col flex gap-2 mt-4">
              <div className="flex items-center">
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Your information is encrypted in transit and at rest.
              </div>
              <div className="flex items-center">
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                The creators of this website do not see your information.
              </div>
              <div className="flex items-center">
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                <span>
                  This website is{' '}
                  <a
                    className="underline"
                    href="https://github.com/rwtp/rwtp"
                    target="_blank"
                  >
                    {' '}
                    open source
                  </a>{' '}
                  and researchers can audit the code.
                </span>
              </div>
            </div>
          </div>

          <div className="flex px-4 pb-4 pt-4 justify-between">
            <button
              onClick={() => {
                props.router.back();
              }}
              className=" px-4 py-2 rounded flex items-center"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" /> Go back
            </button>
            <button
              onClick={() => {
                props.login().catch(console.error);
              }}
              className="bg-black hover:opacity-50 transition-all text-white px-4 py-2 rounded flex items-center"
            >
              Approve <CheckCircleIcon className="h-4 w-4 ml-2" />
            </button>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
