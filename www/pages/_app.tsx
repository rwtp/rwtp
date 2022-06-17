import '../styles/globals.css';
import '../styles/prism.css';
import 'katex/dist/katex.min.css';

import type { AppProps } from 'next/app';
import Script from 'next/script';
import '@rainbow-me/rainbowkit/styles.css';

import {
  apiProvider,
  configureChains,
  getDefaultWallets,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { chain, createClient, WagmiProvider } from 'wagmi';
import Head from 'next/head';

const { chains, provider } = configureChains(
  // [chain.mainnet, chain.polygon, chain.optimism, chain.rinkeby],
  [
    chain.optimism,
    chain.rinkeby,
    chain.kovan,
    chain.polygon,
    chain.mainnet,
    chain.goerli,
  ],
  [apiProvider.fallback()]
);

const { connectors } = getDefaultWallets({
  appName: 'RWTP',
  chains,
});

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <WagmiProvider client={wagmiClient}>
      <RainbowKitProvider chains={chains}>
        <Component {...pageProps} />
        <Head>
          <title>Real World Trade Protocol</title>
        </Head>
        <Script
          src="https://bluejeans.rwtp.org/script.js"
          data-site="CAQMFJOY"
          defer
        />
      </RainbowKitProvider>
    </WagmiProvider>
  );
}

export default MyApp;
