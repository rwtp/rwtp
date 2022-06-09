import { Tab } from '@headlessui/react';
import React, { useState } from 'react';
import {
  ConnectWalletLayout,
  InformationPageHeader,
} from '../components/Layout';
import cn from 'classnames';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import solidity from 'react-syntax-highlighter/dist/cjs/languages/prism/solidity';
import typescript from 'react-syntax-highlighter/dist/cjs/languages/prism/typescript';

function CuteTab(props: { children: React.ReactNode }) {
  return (
    <Tab
      className={({ selected }) =>
        cn(
          'rounded-t py-1 text-sm leading-5 px-4',
          'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
          selected
            ? 'bg-white border border-black'
            : 'text-gray-500 hover:bg-white/[0.12] hover:text-gray-200'
        )
      }
    >
      {props.children}
    </Tab>
  );
}

export default function Page() {
  const [txHash, setTxHash] = useState('');

  return (
    <div className="h-full flex flex-col ">
      <ConnectWalletLayout txHash={txHash}>
        <div className="flex h-full ">
          {/* <div className="p-4 md:flex hidden  bg-black text-white border-r">
            <div className="flex flex-col">
              <div>
                <div className="text-lg">Sell to DAOs</div>
              </div>
            </div>
          </div> */}

          <div className="flex-1">
            <div className="pt-8 pb-4 p-4 max-w-6xl mx-auto">
              <h1 className="text-2xl font-serif mb-2">Create a Sell Order</h1>
              <p className="text-gray-700 mb-4">
                Start selling on RWTP in 5 minutes. (well, like, you know, it's
                pretty darn quick)
              </p>
            </div>

            <div className="bg-gray-50 border-t h-full bg-gray-200 pattern">
              <div className="max-w-6xl mx-auto  p-4 py-8">
                <Tab.Group>
                  <Tab.List className="flex space-x-1 pb-2">
                    <CuteTab>SaaS example</CuteTab>
                    <CuteTab>Shipping example</CuteTab>
                  </Tab.List>
                  <Tab.Panels>
                    <Tab.Panel className="bg-white border border-black ">
                      <div className="p-4 py-8 ">
                        <h2 className="font-serif text-lg">
                          Use RWTP to sell off-chain software
                        </h2>
                        <p className="text-gray-700">
                          Become purchasable on-chain by DAOs and close annual
                          deals with a growing economy.
                        </p>
                      </div>
                      <div className="border-t border-black p-4">
                        <div>
                          Define the information you'll need from the buyer in
                          JSON schema.
                        </div>

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
{
    "title": "Very Good Hosting Services",
    "description": "Payload required to connect this sell order to a buyer",
    "type": "object",
    "properties": {
      "email": {
        "title": "Email",
        "description": "Email of the buyer associated with an account.",
        "type": "string",
        "pattern": "^\\S+@\\S+\\.\\S+$",
        "format": "email",
        "minLength": 6,
        "maxLength": 127
      },
      "org": {
        "title": "Organization ID",
        "description": "A unique identifier for the buyer's team.",
        "type": "string",
      }
    },
    "required": [
      "email",
      "org"
    ]
  }
  
`.trim()}
                          </SyntaxHighlighter>
                        </div>
                      </div>
                    </Tab.Panel>

                    <Tab.Panel className="bg-white border p-4">hi</Tab.Panel>

                    <Tab.Panel className="bg-white border p-4">hi</Tab.Panel>
                  </Tab.Panels>
                </Tab.Group>
              </div>
            </div>
          </div>
        </div>
      </ConnectWalletLayout>
    </div>
  );
}
