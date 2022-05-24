import { ArrowRightIcon } from '@heroicons/react/solid';
import Link from 'next/link';
import { InformationPageHeader } from '../../components/Layout';

function DocLink(props: { title: string; description: string; slug: string }) {
  return (
    <Link href={`/docs/${props.slug}`}>
      <a className="bg-white border px-4 py-4 flex flex-col hover:opacity-60 mb-2">
        <div className="flex items-center justify-between w-full">
          <div className="text-xl font-serif">{props.title}</div>{' '}
          <div>
            <ArrowRightIcon className="ml-2 h-4 w-4 text-gray-400" />
          </div>
        </div>
        <div className="text-gray-700">{props.description}</div>
      </a>
    </Link>
  );
}

export default function DocsPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="max-w-6xl mx-auto w-full pb-12 relative flex flex-col">
        <div className="flex flex-col justify-between pt-4 relative">
          <InformationPageHeader />
        </div>
      </div>

      <div className="border-b">
        <div className="max-w-6xl mx-auto w-full pb-12 relative flex flex-col px-4">
          <h1 className="font-serif text-2xl pb-1">Documentation</h1>
          <p className="pb-4">Learn more about how RWTP works.</p>
          <div>
            <Link href="/docs/whitepaper">
              <a className="bg-black text-white rounded px-4 py-2">
                Read the Whitepaper
              </a>
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 flex-1">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="text-gray-500">More documentation coming soon...</div>
          {/* <DocLink
            slug="react"
            title="React"
            description="Learn to use RWTP in a simple React Project"
          />

          <DocLink
            slug="react"
            title="React"
            description="Learn to use RWTP in a simple React Project"
          />

          <DocLink
            slug="react"
            title="React"
            description="Learn to use RWTP in a simple React Project"
          /> */}
        </div>
      </div>
    </div>
  );
}
