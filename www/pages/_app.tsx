import '../styles/globals.css';
import '../styles/prism.css';
import type { AppProps } from 'next/app';
import { Provider, createClient } from 'wagmi';
import Head from 'next/head';
import Script from 'next/script';

const client = createClient();

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Provider client={client}>
      <Component {...pageProps} />
      <Script
        src="https://bluejeans.rwtp.org/script.js"
        data-site="CAQMFJOY"
        defer
      />
    </Provider>
  );
}

export default MyApp;
