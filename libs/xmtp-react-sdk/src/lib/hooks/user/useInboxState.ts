import { useQuery } from '@tanstack/react-query';
import {UseInboxStateResult} from "../../types";
import {useXmtp} from "../useXmtp";
import {xmtpKeys} from "../../utils/queryKeys";
import {ensureConnected} from "../../utils/helpers";
import {Client, InboxState} from "@xmtp/browser-sdk";
/**
 * Hook to get the current user's inbox state
 * @param refreshFromNetwork Whether to refresh the inbox state from the network
 * @returns The inbox state and loading state
 * @example
 * ```tsx
 * const { inboxState, isLoading, refetch } = useInboxState();
 *
 * // Force refresh from network
 * const handleRefresh = () => {
 *   refetch();
 * };
 *
 * if (isLoading) return <Spinner />;
 * if (!inboxState) return <NotConnected />;
 *
 * return (
 *   <div>
 *     <div>Inbox ID: {inboxState.inboxId}</div>
 *     <div>Created at: {new Date(inboxState.createdAt).toLocaleString()}</div>
 *     <button onClick={handleRefresh}>Refresh</button>
 *   </div>
 * );
 * ```
 */
export const useInboxState = (
  refreshFromNetwork?: boolean
): UseInboxStateResult => {
  const { client } = useXmtp();

  const {
    data: inboxState = null,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: xmtpKeys.inboxState(),
    queryFn: async () => {
      ensureConnected(client as Client | null);

      // Get the client's preferences
      const preferences = client?.preferences;

      if (!preferences) {
        throw new Error('Client preferences not available');
      }

      // Get the inbox state
      return await preferences.inboxState(refreshFromNetwork);
    },
    enabled: !!client,
  });

  return {
    inboxState: inboxState as unknown as InboxState,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};
