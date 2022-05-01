import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { ethers } from 'ethers';
import { SellOrder } from 'rwtp';
import * as ethUtil from 'ethereumjs-util';
import * as sigUtil from '@metamask/eth-sig-util';
import { useRouter } from 'next/router';

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

const STICKERS_SELL_ORDER = '0x333C338218B72A315e00DfdB0Dd7b129014f2268';

function StickerStore() {
  const router = useRouter();
  async function submitBuyOrder() {
    const provider = new ethers.providers.Web3Provider(window.ethereum as any);
    await provider.send('eth_requestAccounts', []); // <- this promps user to connect metamask

    // Encrypt the shipping details
    const encryptionPublicKey = await provider.send(
      'eth_getEncryptionPublicKey',
      ['0xc05c2aaDfAdb5CdD8EE25ec67832B524003B2E37']
    );

    const encryptedMessage = encryptMessage(
      encryptionPublicKey,
      JSON.stringify({
        email: 'email',
        shippingAddress: 'shipping address',
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

    // Submit the order
    const signer = provider.getSigner();
    const sellOrder = new ethers.Contract(
      STICKERS_SELL_ORDER,
      SellOrder.abi,
      signer
    );

    const abi = ['function approve(address spender, uint256 amount)'];
    const erc20 = new ethers.Contract(await sellOrder.token(), abi, signer);
    await erc20.approve(sellOrder.address, 1 + 1);

    const tx = await sellOrder.submitOffer(1, 1, 'ipfs://' + cid);
    router.push('/orders/' + STICKERS_SELL_ORDER);
  }

  return (
    <div className="bg-blue-50 p-4 pb-8">
      <div className="text-xs text-gray-500 px-4 pb-2">Try it out!</div>
      <div className="bg-white border border-black rounded ">
        <div className="px-4 py-2 bg-gray-50 border-b border-black">
          <div className="font-bold py-2">Buy Stickers</div>
          <div className="text-sm pb-2">
            We'll deliver limited-edition stickers to your doorstep via the
            RWTP. You can trust that we'll deliver them to you, because we've
            staked <span className="text-blue-500 font-bold">20 USDC</span>. If
            the deal doesn't go through, we'll lose those sweet 20 bucks.
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

          <div className="flex flex-col sm:flex-row items-center justify-end mt-2">
            <div className="text-sm py-2 px-2 items-center text-gray-700 ">
              You'll stake{' '}
              <span className="text-blue-500 font-bold">5 USDC</span>. If you
              confirm the delivery, you'll get this back.
            </div>
            <button
              onClick={() => submitBuyOrder().catch(console.error)}
              className="ml-2 rounded bg-blue-500 text-white border border-blue-700 px-4 py-2 text-sm"
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
        <div className="px-4 mt-4">
          <h1 className="text-2xl font-bold mb-1 items-center flex">
            Real World Transport Protocol{' '}
            <span className="bg-blue-50 ml-2 p-1 rounded font-mono text-blue-600 text-sm">
              beta
            </span>
          </h1>
          <p className="mt-2 ">
            The Real World Transport Protocol <code>(RWTP)</code> is a
            peer-to-peer way to buy and sell real-world goods on Ethereum. Use
            RWTP to build automated companies, low-cost futures markets,
            decentralized ecommerce platforms, or sell moderately cool stickers
            like we do.
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
