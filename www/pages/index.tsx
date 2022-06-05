import { ArrowRightIcon } from '@heroicons/react/solid';
import Image from 'next/image';
import Link from 'next/link';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import solidity from 'react-syntax-highlighter/dist/cjs/languages/prism/solidity';
import typescript from 'react-syntax-highlighter/dist/cjs/languages/prism/typescript';
import { InformationPageHeader } from '../components/Layout';

SyntaxHighlighter.registerLanguage('solidity', solidity);
SyntaxHighlighter.registerLanguage('typescript', typescript);

export default function Landing() {
  return (
    <div className="h-full">
      <div className="max-w-6xl mx-auto w-full pb-12 relative ">
        <div className="h-screen flex flex-col justify-between pt-4 relative">
          <InformationPageHeader />
          <div
            className="absolute -z-50"
            style={{
              left: '-50%',
              top: '25%',
            }}
          >
            <Image src="/HighlightBackground.png" height={1500} width={1500} alt="bg"/>
          </div>

          <div className="px-4">
            <div className="pb-24">
              <h1 className="text-4xl font-serif pb-2">
                Real World Trade Protocol
              </h1>
              <p className="text-lg text-gray-800">
                A peer-to-peer protocol for buying and selling real-world goods
                on Ethereum.
              </p>
              <div className="flex">
                <Link href="/docs/whitepaper">
                  <a className="border border-b-2 bg-gray-800 text-white border-black rounded px-4 py-1 mt-4 mr-2 items-center cursor-pointer flex hover:opacity-50 transition-all">
                    Read the docs <ArrowRightIcon className="h-4 w-4 ml-2" />
                  </a>
                </Link>

                <a
                  className="border border-b-2 bg-white border-gray-600 rounded px-4 py-1 mt-4 mr-2 items-center cursor-pointer flex hover:opacity-50 transition-all"
                  href="https://discord.com/invite/ekBqgYG2GW"
                >
                  Join the Discord{' '}
                  <div className="pl-2 items-center flex">
                    <Image src="/discord.svg" width={20} height={20} alt="discord" />
                  </div>
                </a>
              </div>
            </div>

            <div className="mb-2 flex items-center uppercase text-gray-500">
              Program the economy <ArrowRightIcon className="h-4 w-4 ml-2" />
            </div>
          </div>
        </div>
        <div className="px-4">
          <h2 className="text-3xl font-serif pb-2">
            Sell to anyone with a few lines of code.
          </h2>
          <p>
            Build automated companies, decentralized e-commerce, low-cost
            futures markets, and (maybe) more.
          </p>
          <div className="my-4 bg-gray-900 py-4 px-4 rounded flex whitespace-pre-wrap text-xs scroll-auto">
            <SyntaxHighlighter
              useInlineStyles={false}
              language="javascript"
              customStyle={{
                whiteSpace: 'pre-wrap',
                overflow: 'scroll',
              }}
            >
              {`
import { ethers } from 'ethers';
import { OrderBook } from 'rwtp';

// Connect to Ethereum
const provider = new ethers
  .providers.Web3Provider(window.ethereum);
const book = new ethers
  .Contract(OrderBook.address, OrderBook.abi, provider);

// Create a sell order
book.createOrder(
    provider.address, 
    usdcAddress,
    100 // 100 USDC staked
);
`.trim()}
            </SyntaxHighlighter>
          </div>
          <div className="flex mt-4 mb-8">
            <Link href="/docs/whitepaper">
              <a className="border border-black rounded px-4 py-1  mr-2">
                Read Docs
              </a>
            </Link>
          </div>

          {/* <div className="mb-2 flex items-center uppercase text-gray-500 mt-12">
          Cut out the middleman <ArrowRightIcon className="h-4 w-4 ml-2" />
        </div>
        <h2 className="text-3xl font-serif pb-2">
          Sell to a global market without a platform.
        </h2>
        <p>
          RWTP requires no third-party or oracle to validate purchases. Instead,
          buyers and a sellers put down deposits. If the deal fails, both
          deposits are destroyed.{' '}
        </p> */}
        </div>
      </div>
    </div>
  );
}
