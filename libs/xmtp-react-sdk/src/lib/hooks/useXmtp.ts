import {UseXmtpResult} from "../types";
import {useXmtpContext} from "../providers/XmtpProvider";

/**
 * Hook to access the XMTP client and connection state
 * @returns The XMTP client and connection state
 * @example
 * ```tsx
 * const { client, isConnected, connect, disconnect } = useXmtp();
 *
 * const handleConnect = async () => {
 *   const signer = await getSigner(); // Your signer implementation
 *   await connect(signer, { env: 'production' });
 * };
 * ```
 */
export const useXmtp = (): UseXmtpResult => {
  const { client, isLoading, error, connect, disconnect } = useXmtpContext();

  return {
    client,
    isLoading,
    error,
    isConnected: !!client,
    connect,
    disconnect,
  };
};
