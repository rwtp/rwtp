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
      <div className="bg-gray-50 border-t px-4 py-1 font-mono text-sm text-gray-500">
        <a
          href="https://github.com/Flaque/rwtp/tree/main/www"
          className="underline"
        >
          edit this website
        </a>
      </div>
    </Provider>
  );
}

export default MyApp;
