import type { NextPage } from 'next';
import Head from 'next/head';
import { BigNumber, ethers } from 'ethers';
import { SellOrder } from 'rwtp';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import {
  CashIcon,
  ChevronRightIcon,
  InboxInIcon,
  LockClosedIcon,
  MailIcon,
  HomeIcon,
} from '@heroicons/react/solid';
import { Footer } from '../../components/Footer';

interface Offer {
  buyer: string;
  price: string;
  stake: string;
  uri: string;
  state: string;
  acceptedAt: number;
  email: string;
  address: string;
}

const STATES = ['CLOSED', 'OPEN', 'COMMITTED', 'COMPLETED'];

function Inner() {
  const router = useRouter();
  const [timeout, setTimeout] = useState(0);
  const [offers, setOffers] = useState<Offer[]>();

  useEffect(() => {
    // TODO: Handle when there are no offers
    async function load() {
      if (!router.query.pubkey) return;
      // Prepare prepare provider
      const provider = new ethers.providers.Web3Provider(
        window.ethereum as any
      );
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();

      // Load sellOrder contract
      const address = await provider.getSigner().getAddress();
      const sellOrder = new ethers.Contract(
        router.query.pubkey as string,
        SellOrder.abi,
        signer
      );

      const timeout = await sellOrder.timeout();
      setTimeout(timeout.toNumber());

      // Load token contract
      const token = await sellOrder.token();
      const abi = ['function decimals() public view returns (uint8)'];
      const erc20 = new ethers.Contract(token, abi, signer);
      const decimals = await erc20.decimals();

      // Get buyer
      const filter = sellOrder.filters.OfferSubmitted();
      let events = await sellOrder.queryFilter(filter);

      const buyerAddresses = new Set<string>();
      events.map((event) => {
        buyerAddresses.add(event.args![0]);
      });
      let offers: Offer[] = await Promise.all(
        Array.from(buyerAddresses).map<Promise<Offer>>(async (buyerAddress) => {
          const [price, stake, uri, state, acceptedAt] = await sellOrder.offers(
            buyerAddress
          );
          return {
            buyer: buyerAddress,
            price:
              (
                (price as BigNumber).toNumber() / Math.pow(10, decimals)
              ).toString() || '',
            stake:
              (
                (stake as BigNumber).toNumber() / Math.pow(10, decimals)
              ).toString() || '',
            uri: uri,
            state: STATES[Number(state)],
            acceptedAt: acceptedAt?.toNumber(),
            email: localStorage.getItem(`${uri}-email`) ?? '',
            address: localStorage.getItem(`${uri}-address`) ?? '',
          };
        })
      );
      setOffers(offers);
    }
    load().catch(console.error);
  }, [router.query.pubkey]);

  async function decryptShippingData(index: number) {
    if (!offers) return;

    // Fetch encrypted data from IPFS
    const uri = offers[index].uri;
    const cid = (uri as string).replace('ipfs://', '');
    const result = await fetch(`https://ipfs.io/ipfs/${cid}`, {
      method: 'GET',
    });
    const data = await result.text();

    // Decrypt data with metamask
    const provider = new ethers.providers.Web3Provider(window.ethereum as any);
    const signer = await provider.getSigner().getAddress();
    const decrypted = await provider.send('eth_decrypt', [data, signer]);

    // Update offers
    const json = JSON.parse(decrypted);
    const offer = offers[index];
    offer.email = json['email'] ?? '';
    localStorage.setItem(`${uri}-email`, offer.email);
    offer.address = json['shippingAddress'] ?? '';
    localStorage.setItem(`${uri}-address`, offer.address);
    offers[index] = offer;
    setOffers([...offers]);
  }

  async function commitToOffer(buyer: string) {
    // Load sell order
    if (!router.query.pubkey) return;
    const provider = new ethers.providers.Web3Provider(window.ethereum as any);
    await provider.send('eth_requestAccounts', []); // <- this prompts user to connect metamask
    const signer = provider.getSigner();
    const sellOrder = new ethers.Contract(
      router.query.pubkey as string,
      SellOrder.abi,
      signer
    );
    // Approve ERC 20 transfer for stake
    const erc20ABI = [
      'function approve(address spender, uint256 amount)',
      'function decimals() public view returns (uint8)',
    ];
    const token = await sellOrder.token();
    const erc20 = new ethers.Contract(token, erc20ABI, signer);
    const orderStake: BigNumber = await sellOrder.orderStake();
    const tokenTx = await erc20.approve(sellOrder.address, orderStake);
    const tokenRcpt = await tokenTx.wait();
    if (tokenRcpt.status != 1) {
      console.log('Error approving tokens');
      return;
    }

    // Commit to the order
    const tx = await sellOrder.commit(buyer);
    console.log(tx);
  }

  if (!offers) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col pb-24">Loading...</div>
    );
  }

  return (
    <div className="bg-blue-50">
      <div className="max-w-2xl mx-auto px-4 pt-24 w-full flex gap-4">
        <h1 className="text-4xl font-bold">Offers</h1>
        <a href="/" className="underline mt-auto">
          home
        </a>
      </div>
      <div className="max-w-2xl mx-auto my-auto flex flex-col pb-24 p-4 gap-4">
        {offers.map((offer, index) => {
          return (
            <div
              hidden={offer.state === 'CLOSED' || !offer.state}
              key={offer.buyer}
              className="bg-white border border-black"
            >
              <div className="bg-gray-50 px-2 py-1 border-b font-mono text-sm">
                <div className="opacity-50 text-xs">From: {offer.buyer}</div>
                <div className="flex items-center py-2">
                  <div
                    className={
                      offer.state === 'OPEN'
                        ? 'text-blue-600 font-bold'
                        : 'opacity-50'
                    }
                  >
                    Offer Made
                  </div>

                  <ChevronRightIcon className="h-4 w-4" />

                  <div
                    className={
                      offer.state === 'COMMITTED'
                        ? 'text-blue-600 font-bold'
                        : 'opacity-50'
                    }
                  >
                    Offer Accepted
                  </div>
                  <ChevronRightIcon className="h-4 w-4" />

                  <div
                    className={
                      offer.state === 'COMPLETED'
                        ? 'text-blue-600 font-bold'
                        : 'opacity-50'
                    }
                  >
                    Completed
                  </div>
                </div>
              </div>

              <div className="px-4 py-4">
                <div className="flex items-center">
                  <CashIcon className="h-4 w-4 mr-2" />
                  <div>
                    Price
                    <span className="font-bold"> {offer.price} USDC.</span>
                  </div>
                </div>

                <div className="flex items-center">
                  <InboxInIcon className="h-4 w-4 mr-2" />
                  <div>
                    Stake
                    <span className="font-bold"> {offer.stake} USDC.</span>
                  </div>
                </div>

                {offer.email.length == 0 && offer.address.length == 0 && (
                  <div className="flex items-center">
                    <LockClosedIcon className="h-4 w-4 mr-2" />
                    <div>
                      <a
                        href={
                          'https://ipfs.io/ipfs/' +
                          offer.uri.replace('ipfs://', '')
                        }
                        target="_blank"
                        className="underline"
                      >
                        Encrypted shipping data
                      </a>
                    </div>
                  </div>
                )}

                {offer.email && offer.address && (
                  <div className="flex items-center">
                    <MailIcon className="h-4 w-4 mr-2" />
                    <div>{offer.email}</div>
                  </div>
                )}

                {offer.email && offer.address && (
                  <div className="flex items-center">
                    <HomeIcon className="h-4 w-4 mr-2" />
                    <div>{offer.address}</div>
                  </div>
                )}
              </div>
              <div className="flex flex-row gap-4 px-4 pb-4">
                {offer.email.length == 0 && offer.address.length == 0 && (
                  <button
                    className="rounded bg-blue-500 text-white border border-blue-700 px-4 py-2 text-sm disabled:opacity-50 transition-all"
                    onClick={async () => await decryptShippingData(index)}
                  >
                    Decrypt data
                  </button>
                )}

                {offer.state && offer.state === 'OPEN' && (
                  <button
                    className="rounded bg-blue-500 text-white border border-blue-700 px-4 py-2 text-sm disabled:opacity-50 transition-all"
                    onClick={async () => await commitToOffer(offer.buyer)}
                  >
                    Accept offer
                  </button>
                )}
                {offer.state && offer.state === 'COMMITTED' && (
                  <div>
                    <span className="font-bold">
                      Expires at{' '}
                      {new Date(
                        (offer.acceptedAt + timeout) * 1000
                      ).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const Home: NextPage = () => {
  return (
    <div className="h-full">
      <Head>
        <title>RWTP - Real World Transport Protocol</title>
        <meta
          name="description"
          content="A way of shipping real world goods on ethereum"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Inner />
    </div>
  );
};

export default Home;
