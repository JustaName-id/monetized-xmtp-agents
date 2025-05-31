import React, { createContext, useContext, useState } from 'react';
import { Client, Signer } from '@xmtp/browser-sdk';
import {XmtpProviderProps} from "../types";
import {useQueryClient} from "@tanstack/react-query";

/**
 * Context for the XMTP client
 */
interface XmtpContextValue {
  client: Client | null;
  isLoading: boolean;
  error: Error | null;
  connect: (signer: Signer, options?: any) => Promise<void>;
  disconnect: () => void;
}

const XmtpContext = createContext<XmtpContextValue | undefined>(undefined);

/**
 * Provider component that wraps your application and provides XMTP client context
 * and React Query setup.
 */
export const XmtpProvider: React.FC<XmtpProviderProps> = ({
  children,
}) => {
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Use the provided query client or create a default one
  const queryClient = useQueryClient()

  /**
   * Connect to XMTP with the provided signer
   */
  const connect = async (signer: Signer, options?: any) => {
    if (client) return; // Already connected

    setIsLoading(true);
    setError(null);

    try {
      // Check if there's an existing client in storage
      const existingClient = await Client.create(signer, options);
      setClient(existingClient);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to connect to XMTP'));
      console.error('Error connecting to XMTP:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Disconnect from XMTP
   */
  const disconnect = () => {
    setClient(null);
    // Clear any cached queries related to XMTP
    queryClient.invalidateQueries({ queryKey: ['xmtp'] });
  };

  const contextValue: XmtpContextValue = {
    client,
    isLoading,
    error,
    connect,
    disconnect,
  };

  return (
    <XmtpContext.Provider value={contextValue}>
      {children}
    </XmtpContext.Provider>
  );
};

/**
 * Hook to access the XMTP client and connection state
 * @returns The XMTP client context
 * @throws Error if used outside of XmtpProvider
 */
export const useXmtpContext = (): XmtpContextValue => {
  const context = useContext(XmtpContext);
  if (context === undefined) {
    throw new Error('useXmtpContext must be used within an XmtpProvider');
  }
  return context;
};
