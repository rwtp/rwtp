import { ArrowRightIcon } from '@heroicons/react/solid';
import Image from 'next/image';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import solidity from 'react-syntax-highlighter/dist/cjs/languages/prism/solidity';
import typescript from 'react-syntax-highlighter/dist/cjs/languages/prism/typescript';

SyntaxHighlighter.registerLanguage('solidity', solidity);
SyntaxHighlighter.registerLanguage('typescript', typescript);

export default function Landing() {
  return (
    <div className="max-w-5xl mx-auto w-full pb-12">
      <div className="h-screen flex flex-col justify-between px-4 pt-4">
        <div className="flex justify-between">
          <Image src="/rwtp.png" width={32} height={32} />
          <div className="gap-4 flex items-center">
            <Image src={'/github.svg'} width={16} height={16} />
            <Image src={'/twitter.svg'} width={16} height={16} />
            <div className="text-sm">Docs</div>
          </div>
        </div>

        <div className="">
          <div className="pb-24">
            <h1 className="text-3xl font-serif pb-2">
              Real World Trade Protocol
            </h1>
            <p className="">
              RWTP is a peer-to-peer protocol for buying and selling real world
              goods on Ethereum.
            </p>
            <div className="flex">
              <div className="border border-black rounded px-4 py-1 mt-4 mr-2">
                Learn More
              </div>
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
          Build automated companies, decentralized e-commerce, low-cost futures
          markets, and (maybe) more.
        </p>
        <div className="my-4 bg-gray-900 py-4 px-4 rounded">
          <SyntaxHighlighter useInlineStyles={false} language="javascript">
            {`
import { ethers } from 'ethers';
import { OrderBook } from 'rwtp';

// Connect to Ethereum
const provider = new ethers.providers.Web3Provider(window.ethereum);
const book = new ethers.Contract(OrderBook.address, OrderBook.abi, provider);

// Create a sell order
book.createSellOrder(
    provider.address, 
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC 
    100 // 100 USDC staked
);
`.trim()}
          </SyntaxHighlighter>
        </div>
        <div className="flex mt-4 mb-8">
          <div className="border border-black rounded px-4 py-1  mr-2">
            Read Docs
          </div>
          <div className="border border-black rounded px-4 py-1  mr-2">
            See Examples
          </div>
        </div>

        <div className="mb-2 flex items-center uppercase text-gray-500 mt-12">
          Cut out the middleman <ArrowRightIcon className="h-4 w-4 ml-2" />
        </div>
        <h2 className="text-3xl font-serif pb-2">
          Sell to a global market without a platform.
        </h2>
        <p>RWTP requires no third-party or oracle to validate purchases.</p>
      </div>
    </div>
  );
}
