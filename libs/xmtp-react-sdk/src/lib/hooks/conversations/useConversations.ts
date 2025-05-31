import { useQuery } from '@tanstack/react-query';
import {Client, SafeListConversationsOptions} from '@xmtp/browser-sdk';
import { UseConversationsResult } from '../../types';
import {useXmtp} from "../useXmtp";
import {xmtpKeys} from "../../utils/queryKeys";
import {ensureConnected} from "../../utils/helpers";


/**
 * Hook to fetch and sync all conversations (groups and DMs)
 * @param options Optional filters for listing conversations
 * @returns List of conversations and loading state
 * @example
 * ```tsx
 * const { conversations, isLoading, error } = useConversations();
 *
 * // With options
 * const { conversations } = useConversations({
 *   sort: 'desc',
 *   limit: 20
 * });
 * ```
 */
export const useConversations = (
  options?: SafeListConversationsOptions
): UseConversationsResult => {
  const { client } = useXmtp();

  const {
    data: conversations = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: xmtpKeys.conversations(),
    queryFn: async () => {
      ensureConnected(client as Client | null);

      // Sync conversations to ensure we have the latest data
      await client?.conversations.sync();

      // Fetch conversations with the provided options
      const convos = await client?.conversations.list(options);

      return convos;
    },
    enabled: !!client,
  });

  return {
    conversations,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};
