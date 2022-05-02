import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { ethers, BigNumber } from 'ethers';
import { SellOrder } from 'rwtp';
import * as ethUtil from 'ethereumjs-util';
import * as sigUtil from '@metamask/eth-sig-util';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import solidity from 'react-syntax-highlighter/dist/cjs/languages/prism/solidity';
import typescript from 'react-syntax-highlighter/dist/cjs/languages/prism/typescript';
import { KOVAN_CHAIN_ID, OPTIMISM_CHAIN_ID } from '../lib/constants';

SyntaxHighlighter.registerLanguage('solidity', solidity);
SyntaxHighlighter.registerLanguage('typescript', typescript);

const useCountdown = (targetDate: any) => {
  const countDownDate = new Date(targetDate).getTime();

  const [countDown, setCountDown] = useState(
    countDownDate - new Date().getTime()
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCountDown(countDownDate - new Date().getTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [countDownDate]);

  return getReturnValues(countDown);
};

const getReturnValues = (countDown: any) => {
  // calculate time left
  const days = Math.floor(countDown / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (countDown % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor((countDown % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((countDown % (1000 * 60)) / 1000);

  return [days, hours, minutes, seconds];
};

function encryptMessage(publicKey: string, message: string) {
  return ethUtil.bufferToHex(
    Buffer.from(
      JSON.stringify(
        sigUtil.encrypt({
          publicKey: publicKey,
          data: message,
          version: 'x25519-xsalsa20-poly1305',
        })
      ),
      'utf8'
    )
  );
}

const STICKERS_SELL_ORDER =
  process.env.NODE_ENV === 'production'
    ? '0x295221bdc096c06a02CD51e8689c5ac1044b4316' // production
    : '0x4D2787E7C9B19Ec6C68734088767a39250476989'; // development
const WRAPPED_ETH =
  process.env.NODE_ENV === 'production'
    ? '0x4200000000000000000000000000000000000006' // production (optimism)
    : '0xd0A1E359811322d97991E03f863a0C30C2cF029C'; // development (kovan)
const STICKER_SELLER = '0xc05c2aaDfAdb5CdD8EE25ec67832B524003B2E37'; // evan's pubkey

function StickerStore() {
  const [email, setEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');

  const DEFAULT_STAKE = 5;
  const DEFAULT_PRICE = 10;

  const router = useRouter();
  async function submitBuyOrder() {
    const provider = new ethers.providers.Web3Provider(window.ethereum as any);
    await provider.send('eth_requestAccounts', []); // <- this promps user to connect metamask

    const network = await provider.getNetwork();
    // If we're in development, switch to Kovan
    if (process.env.NODE_ENV !== 'production' && network.name != 'kovan') {
      await provider.send('wallet_switchEthereumChain', [
        { chainId: KOVAN_CHAIN_ID },
      ]);
    }

    // If we're in production, switch to optimism
    if (process.env.NODE_ENV === 'production' && network.name != 'optimism') {
      await provider.send('wallet_switchEthereumChain', [
        { chainId: OPTIMISM_CHAIN_ID },
      ]);
    }

    const signer = provider.getSigner();
    const sellOrder = new ethers.Contract(
      STICKERS_SELL_ORDER,
      SellOrder.abi,
      signer
    );
    const seller = await sellOrder.seller();

    // Encrypt the shipping details
    const encryptionPublicKey = await provider.send(
      'eth_getEncryptionPublicKey',
      [seller]
    );

    const encryptedMessage = encryptMessage(
      encryptionPublicKey,
      JSON.stringify({
        email: email,
        shippingAddress: shippingAddress,
      })
    );

    const result = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: encryptedMessage,
      }),
    });
    const { cid } = await result.json();

    const erc20ABI = [
      'function approve(address spender, uint256 amount)',
      'function decimals() public view returns (uint8)',
    ];
    const erc20 = new ethers.Contract(
      await sellOrder.token(),
      erc20ABI,
      signer
    );
    await erc20.approve(
      sellOrder.address,
      BigNumber.from(DEFAULT_PRICE + DEFAULT_STAKE).mul(
        BigNumber.from(10).pow(await erc20.decimals())
      )
    );

    const tx = await sellOrder.submitOffer(
      BigNumber.from(DEFAULT_PRICE).mul(
        BigNumber.from(10).pow(await erc20.decimals())
      ),
      BigNumber.from(DEFAULT_STAKE).mul(
        BigNumber.from(10).pow(await erc20.decimals())
      ),
      'ipfs://' + cid
    );
    router.push('/orders/' + STICKERS_SELL_ORDER);
  }

  const [days, hours, minutes, seconds] = useCountdown('2022-05-09');

  return (
    <div className="bg-blue-50 p-4 pb-8">
      <div className="text-xs text-gray-500 px-4 pb-2">
        (Currently only Metamask is supported due to{' '}
        <a
          className="underline"
          target={'_blank'}
          href="https://github.com/ethers-io/ethers.js/issues/1422"
        >
          this issue
        </a>
        )
      </div>
      <div className="bg-white border border-black rounded ">
        <div className="px-4 py-2 bg-gray-50 border-b border-black">
          <div className="font-mono text-xs pt-2">
            {' '}
            Available for {days} days {hours} hours {minutes} minutes {seconds}{' '}
            seconds
          </div>
          <div className="font-bold pb-2">Buy Stickers</div>
          <div className="text-sm pb-2">
            We'll deliver limited-edition stickers to your doorstep via the
            RWTP. You can trust that we'll deliver them to you, because we've
            staked <span className="text-blue-500 font-bold">20 USDC</span>. If
            the deal doesn't go through, we'll lose those sweet 20 bucks to the
            void.
          </div>
        </div>
        <div className="px-4 py-4">
          <label className="border flex flex-col mt-2">
            <div className="text-xs bg-gray-100 px-2 py-1">
              Shipping Address
            </div>
            <input
              type={'text'}
              className={'px-2 py-2'}
              name="address"
              placeholder="100 Saddle Point; San Fransokyo, CA 94112"
              onChange={(e) => setShippingAddress(e.target.value)}
            />
          </label>

          <label className="border flex flex-col mt-2">
            <div className="text-xs bg-gray-100 px-2 py-1">Email</div>
            <input
              type={'email'}
              className={'px-2 py-2'}
              placeholder="you@ethereum.org"
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="text-xs px-2 py-1 bg-gray-50 border-t">
              *Only used to contact you if something goes wrong, not to sign you
              up for an email list.
            </div>
          </label>

          <div className="flex flex-col sm:flex-row items-center justify-end mt-2">
            <div className="text-sm py-2 px-2 items-center text-gray-700 ">
              You'll stake{' '}
              <span className="text-blue-500 font-bold">5 USDC</span>. If you
              confirm the delivery, you'll get this back.
            </div>
            <button
              onClick={() => submitBuyOrder().catch(console.error)}
              className="ml-2 rounded bg-blue-500 text-white border border-blue-700 px-4 py-2 text-sm disabled:opacity-50 transition-all"
              disabled={!email || !shippingAddress}
            >
              Buy stickers for 10 USDC
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const Home: NextPage = () => {
  return (
    <div>
      <Head>
        <title>RWTP - Real World Trade Protocol</title>
        <meta
          name="description"
          content="A way of shipping real world goods on ethereum"
        />
        <link rel="icon" href="/favicon.ico" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary" key="twcard" />
        <meta
          name="twitter:creator"
          content={'strangemoodorg'}
          key="twhandle"
        />

        {/* Open Graph */}
        <meta
          property="og:site_name"
          content={'Strangemood'}
          key="ogsitename"
        />
        <meta
          property="og:title"
          content={'RWTP - Real World Trade Protocol'}
          key="ogtitle"
        />
        <meta
          property="og:description"
          content={'A way to buy and sell real-world goods on Ethereum'}
          key="ogdesc"
        />
      </Head>

      <div className="max-w-4xl mx-auto flex flex-col pb-24 ">
        <div className="m-4 border-b-2 border-black">
          <div className="pb-4 flex justify-between">
            <a className="font-mono flex underline" href="/">
              <Image width={1} height={1} src="/favicon.png" />
              rwtp
            </a>

            <div className="flex ">
              <a
                className="font-mono flex underline ml-2"
                href="https://discord.gg/evqa7Evuw6"
              >
                discord
              </a>

              <a
                className="font-mono flex underline ml-2"
                href="/whitepaper.pdf"
              >
                whitepaper
              </a>

              <a
                className="font-mono flex underline ml-2"
                href="https://github.com/flaque/rwtp"
              >
                github
              </a>
            </div>
          </div>

          <Image src={'/Header.png'} layout="responsive" height={1} width={2} />
        </div>
        <div className="px-4 mt-4">
          <h1 className="text-2xl font-bold mb-1 items-center flex">
            Real World Trade Protocol{' '}
            <span className="bg-blue-50 ml-2 p-1 rounded font-mono text-blue-600 text-sm">
              v0.1.0
            </span>
          </h1>
          <p className="mt-2 ">
            The Real World Trade Protocol <code>(RWTP)</code> is a peer-to-peer
            way to buy and sell real-world goods on Ethereum. Use RWTP to build
            automated companies, low-cost futures markets, decentralized
            ecommerce platforms, sell moderately cool stickers, or otherwise
            program the economy.
          </p>

          <div className="mt-4">
            <StickerStore />
          </div>
        </div>

        {/* <div className="px-4 mt-12">
          <h2 className="text-xl font-bold mb-2">Usage</h2>
          <p className="pb-2">
            To put something up for sale, deploy a new <code>SellOrder</code>.
          </p>
          <div className="bg-gray-900 px-4 py-2 rounded">
            <SyntaxHighlighter language="solidity" useInlineStyles={false}>
              {`new StickerStore(address _token, address _router, address _signer)`}
            </SyntaxHighlighter>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default Home;
