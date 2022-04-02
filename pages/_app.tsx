import { providers } from "ethers";
import type { AppProps } from "next/app";
import { QueryClient, QueryClientProvider } from "react-query";
import {
  chain,
  Connector,
  defaultChains,
  InjectedConnector,
  Provider,
} from "wagmi";
import { WalletConnectConnector } from "wagmi/connectors/walletConnect";

const alchemyId = process.env.NEXT_PUBLIC_ALCHEMY_ID as string;
const etherscanApiKey = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY as string;
const infuraId = process.env.NEXT_PUBLIC_INFURA_ID as string;

type ProviderConfig = { chainId?: number; connector?: Connector };

const defaultChain = chain.mainnet;

const isChainSupported = (chainId?: number) =>
  defaultChains.some((x) => x.id === chainId);

const provider = ({ chainId }: ProviderConfig) =>
  providers.getDefaultProvider(
    isChainSupported(chainId) ? chainId : defaultChain.id,
    {
      alchemy: alchemyId,
      etherscan: etherscanApiKey,
      infura: infuraId,
    }
  );

const connectors = [
  new InjectedConnector({
    chains: [defaultChain],
    options: {
      shimDisconnect: true,
    },
  }),
  new WalletConnectConnector({
    options: {
      infuraId,
      qrcode: true,
    },
  }),
];

const webSocketProvider = ({ chainId }: ProviderConfig) =>
  isChainSupported(chainId)
    ? new providers.InfuraWebSocketProvider(chainId, infuraId)
    : undefined;

const queryClient = new QueryClient();

const MyApp = ({ Component, pageProps }: AppProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider
        autoConnect
        connectorStorageKey="project.connector"
        connectors={connectors}
        provider={provider}
        webSocketProvider={webSocketProvider}
      >
        <Component {...pageProps} />
      </Provider>
    </QueryClientProvider>
  );
};

export default MyApp;
