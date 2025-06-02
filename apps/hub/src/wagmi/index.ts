import { cookieStorage, createConfig, createStorage, http } from 'wagmi';
import { base, baseSepolia, mainnet } from 'wagmi/chains';
import { coinbaseWallet } from 'wagmi/connectors';
import { clientEnv } from '@/utils/config/clientEnv';

export function getConfig() {
  return createConfig({
    chains: [base, baseSepolia, mainnet],
    connectors: [
      coinbaseWallet({
        appName: clientEnv.onchainProjectName,
        preference: clientEnv.onchainWalletConfig,
        // @ts-ignore
        keysUrl: 'https://keys.coinbase.com/connect',
      }),
    ],
    storage: createStorage({
      storage: cookieStorage,
    }),
    ssr: true,
    transports: {
      [base.id]: http(''),
      [baseSepolia.id]: http(''),
      [mainnet.id]: http(''),
    },
  });
}

declare module 'wagmi' {
  interface Register {
    config: ReturnType<typeof getConfig>;
  }
}
