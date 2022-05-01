import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import ethers from 'ethers';

function StickerStore() {
  return (
    <div>
      <div>
        <div className="text-xs text-gray-500">Try it out!</div>
        <div className="font-bold">Buy Stickers via RWTP</div>
        <label className="border flex flex-col mt-2">
          <div className="text-xs bg-gray-100 px-2 py-1">Shipping Address</div>
          <input
            type={'text'}
            className={'px-2 py-2'}
            placeholder="100 Saddle Point; San Fransokyo, CA 94112"
          />
        </label>

        <label className="border flex flex-col mt-2">
          <div className="text-xs bg-gray-100 px-2 py-1">Email</div>
          <input
            type={'email'}
            className={'px-2 py-2'}
            placeholder="you@ethereum.org"
          />
          <div className="text-xs px-2 py-1 bg-gray-50 border-t">
            *Only used to contact you if something goes wrong, not to sign you
            up for an email list.
          </div>
        </label>

        <div className="flex flex-row items-center justify-end mt-2">
          <div className="text-sm py-2 px-2 items-center text-gray-700 ">
            You'll stake{' '}
            <span className="text-blue-500 font-bold px-1">5 USDC</span> and get
            it back when you confirm the order.
          </div>
          <button className=" ml-2 rounded bg-blue-500 text-white border border-blue-700 px-4 py-2 text-sm">
            Buy for 10 USDC
          </button>
        </div>
      </div>
    </div>
  );
}

const Home: NextPage = () => {
  return (
    <div>
      <Head>
        <title>RWTP - Real World Transport Protocol</title>
        <meta
          name="description"
          content="A way of shipping real world goods on ethereum"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="max-w-4xl mx-auto flex flex-col pb-24 ">
        <div className="m-4 border-b-2 border-black">
          <div className="pb-4 flex justify-between">
            <a className="font-mono flex underline" href="/">
              rwtp
            </a>

            <div className="flex ">
              <a
                className="font-mono flex underline ml-2"
                href="/whitepaper.pdf"
              >
                whitepaper
              </a>

              <a className="font-mono flex underline ml-2" href="/">
                github
              </a>
            </div>
          </div>
          <Image src={'/Header.png'} layout="responsive" height={1} width={2} />
        </div>
        <div className="px-4">
          <h1 className="text-xl font-bold mb-1">
            Real World Transport Protocol
          </h1>
          <p className="mt-2">
            The Real World Transport Protocol <code>(RWTP)</code> is a
            peer-to-peer way to buy and sell real-world goods on Ethereum. Use
            RWTP to build automated companies, low-cost futures markets,
            decentralized ecommerce platforms, or sell really cool stickers like
            we do.
          </p>

          <div className="mt-4">
            <StickerStore />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
