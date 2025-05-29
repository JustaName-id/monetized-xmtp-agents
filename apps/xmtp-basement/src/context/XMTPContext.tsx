import { Client, type ClientOptions, type Signer } from "@xmtp/browser-sdk";
import type { GroupUpdated } from "@xmtp/content-type-group-updated";
import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
} from "react";

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
    initializing: boolean;
    error: Error | null;
    disconnect: () => void;
};

export const XMTPContext = createContext<XMTPContextValue>({
    setClient: () => { },
    initialize: () => Promise.reject(new Error("XMTPProvider not available")),
    initializing: false,
    error: null,
    disconnect: () => { },
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

    const [initializing, setInitializing] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    // client is initializing
    const initializingRef = useRef(false);

    const initialize = useCallback(
        async ({
            dbEncryptionKey,
            env,
            loggingLevel,
            signer,
        }: InitializeClientOptions) => {
            if (!client) {
                if (initializingRef.current) {
                    return undefined;
                }

                initializingRef.current = true;

                setError(null);
                setInitializing(true);

                let xmtpClient: Client;

                try {
                    xmtpClient = await Client.create(signer, {
                        env,
                        loggingLevel,
                        dbEncryptionKey,
                        codecs: [],
                    });
                    setClient(xmtpClient);
                } catch (e) {
                    setClient(undefined);
                    setError(e as Error);
                    throw e;
                } finally {
                    initializingRef.current = false;
                    setInitializing(false);
                }

                return xmtpClient;
            }
            return client;
        },
        [client],
    );

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
            initializing,
            error,
            disconnect,
        }),
        [client, initialize, initializing, error, disconnect],
    );

    return <XMTPContext.Provider value={value}>{children}</XMTPContext.Provider>;
};

export const useXMTP = () => {
    return useContext(XMTPContext);
};