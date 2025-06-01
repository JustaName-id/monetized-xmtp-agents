"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { baseSepolia } from "wagmi/chains";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { type ReactNode, useState } from "react";
import { type State, WagmiProvider } from "wagmi";
import { JustWeb3Provider } from "@justweb3/widget";
import { clientEnv } from "@/utils/config/clientEnv";
import "@justweb3/widget/styles.css";
// import '@coinbase/onchainkit/styles.css';
import { ThemeProvider } from "next-themes";
import { XMTPProvider } from "@/context/XMTPContext";
import {ChatBasedProvider} from "@/providers/ChatBasedProvider";
import {getConfig} from "@/wagmi";

export function Providers(props: {
  children: ReactNode;
  initialState?: State;
}) {
  const [config] = useState(() => getConfig())

  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries:{
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
            openOnWalletConnect: false
          }}>
            <OnchainKitProvider
              apiKey={clientEnv.onchainClientApiKey}
              chain={baseSepolia}
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
          </JustWeb3Provider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}
