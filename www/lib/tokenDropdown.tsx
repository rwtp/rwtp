import optimismList from '@eth-optimism/tokenlist';
import polygonList from '../node_modules/polygon-token-list/src/tokens/allTokens.json';
import Image from 'next/image';

const acceptedCoins = [
  'USDC',
  'WETH',
  'USDT',
  'WBTC',
  'DAI',
  'LINK',
  'UST',
  'FRAX',
];

const rinkebyList = [
  {
    name: 'Wrapped Ether',
    address: '0xc778417E063141139Fce010982780140Aa0cD5Ab',
    symbol: 'WETH',
    decimals: 18,
    chainId: 4,
    logoURI: 'https://ethereum-optimism.github.io/logos/WETH.png',
  },
  {
    name: 'Dai Stablecoin',
    address: '0xc7AD46e0b8a400Bb3C915120d284AafbA8fc4735',
    symbol: 'DAI',
    decimals: 18,
    chainId: 4,
    logoURI:
      'https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.svg?v=010',
  },
  {
    name: 'Maker',
    address: '0xF9bA5210F91D0474bd1e1DcDAeC4C58E359AaD85',
    symbol: 'MKR',
    decimals: 18,
    chainId: 4,
    logoURI: 'https://ethereum-optimism.github.io/logos/MKR.png',
  },
  {
    name: 'Uniswap',
    address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    symbol: 'UNI',
    decimals: 18,
    chainId: 4,
    logoURI: 'https://ethereum-optimism.github.io/logos/UNI.png',
  },
];

export function getNetworkList(network: string) {
  if (network === 'Rinkeby') {
    return ddRinkebyList;
  } else if (network === 'Optimism') {
    return ddOptimismList;
  } else if (network === 'Polygon') {
    return ddPolygonList;
  } else {
    return [{ value: 'Custom', name: 'Custom Token', logo: '' }];
  }
}

export function renderToken(
  props: any,
  option: any,
  _snapshot: any,
  className: any
) {
  const imgStyle = {
    marginRight: 10,
    verticalAlign: 'middle',
  };

  if (option.value === 'Custom') {
    return (
      <button {...props} className={className} type="button">
        <u className="text-sky-600">{option.name}</u>
      </button>
    );
  } else {
    return (
      <button {...props} className={className} type="button">
        <div className="flex flex-row">
          <div className="self-center">
            <img
              alt=""
              style={imgStyle}
              width="16"
              height="16"
              src={option.logo}
            />
          </div>
          <div>{option.name}</div>
        </div>
      </button>
    );
  }
}

export const ddOptimismList = optimismList.tokens
  .filter(
    (token) => acceptedCoins.includes(token.symbol) && token.chainId == 10
  )
  .map((row) => {
    return { value: row.address, name: row.symbol, logo: row.logoURI };
  })
  .concat([{ value: 'Custom', name: 'Custom Token', logo: '' }]);

export const ddPolygonList = polygonList
  .filter(
    (token) => acceptedCoins.includes(token.symbol) && token.chainId == 137
  )
  .map((row) => {
    return { value: row.address, name: row.symbol, logo: row.logoURI };
  })
  .concat([{ value: 'Custom', name: 'Custom Token', logo: '' }]);

export const ddRinkebyList = rinkebyList
  .map((row) => {
    return { value: row.address, name: row.symbol, logo: row.logoURI };
  })
  .concat([{ value: 'Custom', name: 'Custom Token', logo: '' }]);
