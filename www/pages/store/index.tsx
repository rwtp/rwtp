import { ConnectButton } from '@rainbow-me/rainbowkit';
import cn from 'classnames';
import { useSubgraph } from '../../lib/useSubgraph';

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
        {props.order.sellersStake <= props.order.price * 0.5 && (
          <Tag type="danger">Risky</Tag>
        )}
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
  const { data } = useSubgraph(`{
        sellOrders(first: 5) {
          address
          title
          description
          sellersStake
          stakeSuggested
          priceSuggested

        }
      }`);

  if (!data) {
    return null;
  }
  const orders = data.sellOrders
    .filter((s: any) => !!s.title) // filter ones without titles
    .map((sellOrder: any) => {
      return (
        <OrderView
          key={sellOrder.address}
          order={{
            address: sellOrder.address,
            title: sellOrder.title,
            description: sellOrder.description,
            sellersStake: +sellOrder.sellersStake,
            buyersStake: +sellOrder.stakeSuggested,
            price: +sellOrder.priceSuggested,
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
