import { ConnectButton } from '@rainbow-me/rainbowkit';
import cn from 'classnames';
import { useContract, useProvider } from 'wagmi';
import { OrderBook } from 'rwtp';
import { useEffect } from 'react';
import useSWR from 'swr';
import { request } from 'graphql-request';

const fetcher = (query: any, variables: any) =>
  request(
    'https://api.studio.thegraph.com/query/26326/justin-test-rwtp/v0.0.4',
    query,
    variables
  );

function useGraph(args: string | [string, any]) {
  return useSWR(args, fetcher);
}

function Layout(props: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex px-4 py-4 justify-between items-center w-full bg-gray-50 border-b">
        <div>
          <ConnectButton />
        </div>
        <div className=""></div>
      </div>
      {props.children}
    </div>
  );
}

interface SellOrder {
  address: string;
  title: string;
  description: string;
  sellersStake: number;
  buyersStake: number;
  price: number;
  token: string;
  encryptionPublicKey: string;
}

function Tag(props: {
  children: React.ReactNode;
  type: 'danger' | 'success' | 'warning' | 'info';
}) {
  return (
    <div
      className={cn({
        'border text-sm px-2 py-px': true,
        'bg-green-50 border-green-200': props.type === 'success',
        'bg-blue-50 border-blue-200': props.type === 'info',
        'bg-yellow-50 border-yellow-200': props.type === 'warning',
        'bg-red-50 border-red-200': props.type === 'danger',
      })}
    >
      {props.children}
    </div>
  );
}

function OrderView(props: { order: SellOrder }) {
  return (
    <div className="py-2">
      <div className="flex gap-2 items-center justify-between">
        <Tag type="danger">Risky</Tag>
        <a
          className="underline font-serif"
          href={`/sell/${props.order.address}`}
        >
          {props.order.title}
        </a>
        <div className="h-px bg-black w-full flex-1" />
        <Tag type="info">Deposit $2</Tag>
        <Tag type="info">Price $20</Tag>
      </div>
    </div>
  );
}

function Results() {
  const { data } = useGraph(`{
        sellOrders(first: 5) {
          address
        }
      }`);

  if (!data) {
    return null;
  }

  const orders = data.sellOrders.map((sellOrder: any) => {
    return (
      <OrderView
        key={sellOrder.address}
        order={{
          address: sellOrder.address,
          title: 'Some title about the product',
          description: 'Some description about the product',
          sellersStake: 10,
          buyersStake: 10,
          price: 0,
          token: '0xc778417E063141139Fce010982780140Aa0cD5Ab', // Rinkeby wETH
          encryptionPublicKey: '',
        }}
      />
    );
  });

  return <>{orders}</>;
}

export default function Page() {
  return (
    <Layout>
      <div className="h-full p-4">
        <Results />
      </div>
    </Layout>
  );
}
