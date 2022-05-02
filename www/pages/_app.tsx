import '../styles/globals.css';
import '../styles/prism.css';
import type { AppProps } from 'next/app';
import { Provider, createClient } from 'wagmi';

const client = createClient();

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Provider client={client}>
      <Component {...pageProps} />
    </Provider>
  );
}

export default MyApp;
