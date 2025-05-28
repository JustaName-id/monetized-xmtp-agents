"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { base, baseSepolia } from "wagmi/chains";
import { http, cookieStorage, createConfig, createStorage } from "wagmi";
import { coinbaseWallet } from "wagmi/connectors";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { type ReactNode, useState } from "react";
import { type State, WagmiProvider } from "wagmi";
import { JustWeb3Provider } from "@justweb3/widget";
import { clientEnv } from "@/utils/config/clientEnv";
import "@justweb3/widget/styles.css";
import '@coinbase/onchainkit/styles.css';
import { ThemeProvider } from "next-themes";
import { XMTPProvider } from "@/context/XMTPContext";

const config = createConfig({
  chains: [baseSepolia],
  connectors: [
    coinbaseWallet({
      appName: clientEnv.onchainProjectName,
      preference: clientEnv.onchainWalletConfig,
      // @ts-ignore
      keysUrl: "https://keys.coinbase.com/connect",
    }),
  ],
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  transports: {
    [baseSepolia.id]: http(""),
  },
});

export function Providers(props: {
  children: ReactNode;
  initialState?: State;
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <WagmiProvider config={config} initialState={props.initialState}>
        <QueryClientProvider client={queryClient}>
          <JustWeb3Provider config={{
            openOnWalletConnect: false
          }}>
            <OnchainKitProvider
              apiKey={clientEnv.onchainClientApiKey}
              // @ts-ignore
              chain={base}
              config={{
                appearance: {
                  mode: "auto",
                  theme: "base",
                },
              }}
            >
              <XMTPProvider>
                {props.children}
              </XMTPProvider>
            </OnchainKitProvider>
          </JustWeb3Provider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}
