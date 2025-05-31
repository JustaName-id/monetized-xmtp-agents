import { useMutation } from '@tanstack/react-query';
import {Client, ConsentState} from '@xmtp/browser-sdk';
import {UseSyncAllResult} from "../../types";
import {useXmtp} from "../useXmtp";
import {ensureConnected} from "../../utils/helpers";

/**
 * Hook to sync all conversations and messages with the network
 * @returns Function to sync all conversations and messages
 * @example
 * ```tsx
 * const { syncAll, isSyncing, error } = useSyncAll();
 *
 * // Sync all conversations and messages
 * const handleSync = async () => {
 *   await syncAll();
 * };
 *
 * // Sync only allowed conversations
 * const handleSyncAllowed = async () => {
 *   await syncAll(['ALLOWED']);
 * };
 *
 * return (
 *   <div>
 *     <button
 *       onClick={handleSync}
 *       disabled={isSyncing}
 *     >
 *       {isSyncing ? 'Syncing...' : 'Sync All'}
 *     </button>
 *     {error && <ErrorMessage error={error} />}
 *   </div>
 * );
 * ```
 */
export const useSyncAll = (): UseSyncAllResult => {
  const { client } = useXmtp();

  // Mutation for syncing all conversations and messages
  const mutation = useMutation({
    mutationFn: async (consentStates?: ConsentState[]) => {
      ensureConnected(client as Client | null);

      // Sync all conversations and messages
      await client?.conversations.syncAll(consentStates);
    },
  });

  // Function to sync all conversations and messages
  const syncAll = async (consentStates?: ConsentState[]): Promise<void> => {
    await mutation.mutateAsync(consentStates);
  };

  return {
    syncAll,
    isSyncing: mutation.isPending,
    error: mutation.error as Error | null,
  };
};
