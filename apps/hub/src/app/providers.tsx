"use client";

import { clientEnv } from "@/utils/config/clientEnv";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { JustWeb3Provider } from "@justweb3/widget";
import "@justweb3/widget/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { type State, WagmiProvider } from "wagmi";
// import '@coinbase/onchainkit/styles.css';
import { XMTPProvider } from "@/context/XMTPContext";
import { ChatBasedProvider } from "@/providers/ChatBasedProvider";
import { getConfig } from "@/wagmi";
import { ThemeProvider } from "next-themes";
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

export function Providers(props: {
  children: ReactNode;
  initialState?: State;
}) {
  const [config] = useState(() => getConfig())

  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        staleTime: Infinity
      }
    }
  }));

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
            networks: [
              {
                chainId: 1,
                providerUrl: 'https://eth.drpc.org'
              }
            ],
            disableOverlay: true,
            enableAuth: false,
            openOnWalletConnect: false
          }}>
            <OnchainKitProvider
              apiKey={clientEnv.onchainClientApiKey}
              chain={clientEnv.baseNetwork}
              config={{
                appearance: {
                  mode: "auto",
                  theme: "base",
                },
              }}
            >
              <XMTPProvider>
                <ChatBasedProvider>
                  {props.children}
                </ChatBasedProvider>
              </XMTPProvider>
            </OnchainKitProvider>
                    {/*<ReactQueryDevtools />*/}
          </JustWeb3Provider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}
