import { useLocalVariables } from "@/hooks/use-local";
import { createSCWSigner } from "@/utils/helpers/createSigner";
import { Client, type ClientOptions, type Signer } from "@xmtp/browser-sdk";
import type { GroupUpdated } from "@xmtp/content-type-group-updated";
import { TypingCodec } from "@agenthub/xmtp-content-type-typing";
import {
  createContext,
  useCallback,
  useContext, useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { hexToUint8Array } from "uint8array-extras";
import { useAccount, useSignMessage, useSwitchChain } from "wagmi";
import { mainnet } from "wagmi/chains";

export type ContentTypes =
  | string
  | GroupUpdated

export type InitializeClientOptions = {
  dbEncryptionKey?: Uint8Array;
  env?: ClientOptions["env"];
  loggingLevel?: ClientOptions["loggingLevel"];
  signer: Signer;
};

export type XMTPContextValue = {
  /**
   * The XMTP client instance
   */
  client?: Client;
  /**
   * Set the XMTP client instance
   */
  setClient: React.Dispatch<
    React.SetStateAction<Client | undefined>
  >;
  initialize: (
    options: InitializeClientOptions,
  ) => Promise<Client | undefined>;
  isInitializing: boolean;
  isConnected: boolean;
  error: Error | null;
  disconnect: () => void;
  connect: () => Promise<Client | undefined> | undefined;
};

export const XMTPContext = createContext<XMTPContextValue>({
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setClient: () => { },
  initialize: () => Promise.reject(new Error("XMTPProvider not available")),
  isInitializing: false,
  isConnected: false,
  error: null,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  disconnect: () => { },
  connect: () => Promise.reject(new Error("XMTPProvider not available"))
});

export type XMTPProviderProps = React.PropsWithChildren & {
  client?: Client;
};

export const XMTPProvider: React.FC<XMTPProviderProps> = ({
  children,
  client: initialClient,
}) => {
  const [client, setClient] = useState<Client | undefined>(
    initialClient,
  );
  const { address, isConnected, isConnecting, chainId } = useAccount()
  const { switchChainAsync, status } = useSwitchChain();
  const { signMessageAsync } = useSignMessage()
  const {
    encryptionKey,
  } = useLocalVariables();
  const [isInitializing, setisInitializing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  // client is isInitializing
  const isInitializingRef = useRef(false);

  const initialize = useCallback(
    async ({
      dbEncryptionKey,
      env,
      loggingLevel,
      signer,
    }: InitializeClientOptions) => {
      if (!client || status !== 'pending') {
        if (isInitializingRef.current) {
          return undefined;
        }

        isInitializingRef.current = true;

        setError(null);
        setisInitializing(true);

        let xmtpClient: Client;
        try {
          if (chainId !== mainnet.id) {
            await switchChainAsync({ chainId: mainnet.id });
          }
          xmtpClient = await Client.create(signer, {
            env,
            loggingLevel,
            dbEncryptionKey,
            codecs: [new TypingCodec()],
          }) as unknown as Client;
          setClient(xmtpClient);
        } catch (e) {
          console.log('e', e)
          setClient(undefined);
          setError(e as Error);
          throw e;
        } finally {
          isInitializingRef.current = false;
          setisInitializing(false);
        }

        return xmtpClient;
      }
      return client;
    },
    [chainId, client, switchChainAsync, status],
  );

  const connect = useCallback(() => {
    if (!address || client) return
    return initialize({
      dbEncryptionKey: encryptionKey
        ? hexToUint8Array(encryptionKey)
        : undefined,
      env: "production",
      loggingLevel: 'off',
      // loggingLevel: "debug",
      signer: createSCWSigner(address, (message: string) =>
        signMessageAsync({ message }),
      ),
    });
  }, [address, client, encryptionKey, initialize, signMessageAsync])

  const disconnect = useCallback(() => {
    if (client) {
      client.close();
      setClient(undefined);
    }
  }, [client, setClient]);

  const value = useMemo(
    () => ({
      client,
      setClient,
      initialize,
      isInitializing,
      isConnected: !!client,
      error,
      disconnect,
      connect
    }),
    [connect, client, initialize, isInitializing, error, disconnect],
  );


  useEffect(() => {
    if (!isConnected && !client && !isInitializing && !isConnecting) {
      return;
    }
    connect()
  }, [isConnected, connect, client, isInitializing, isConnecting]);

  return <XMTPContext.Provider value={value}>{children}</XMTPContext.Provider>;
};

export const useXMTP = () => {
  return useContext(XMTPContext);
};
