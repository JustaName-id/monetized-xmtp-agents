import { useQuery } from '@tanstack/react-query';
import {xmtpKeys} from "../../utils/queryKeys";
import {UseConversationResult} from "../../types";
import {useXmtp} from "../useXmtp";
import {ensureConnected} from "../../utils/helpers";
import {Client} from "@xmtp/browser-sdk";

/**
 * Hook to fetch a single conversation by ID and keep it synced
 * @param conversationId The conversation ID
 * @returns The conversation and loading state
 * @example
 * ```tsx
 * const { conversation, isLoading, error } = useConversation('conversation-id');
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <ErrorMessage error={error} />;
 * if (!conversation) return <NotFound />;
 *
 * return <ConversationView conversation={conversation} />;
 * ```
 */
export const useConversation = (
  conversationId: string
): UseConversationResult => {
  const { client } = useXmtp();

  const {
    data: conversation = null,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: xmtpKeys.conversation(conversationId),
    queryFn: async () => {
      ensureConnected(client as Client | null);

      // Get the conversation by ID
      const conversation = await client?.conversations.getConversationById(conversationId);

      if (!conversation) {
        return null;
      }

      // Sync the conversation to ensure we have the latest data
      await conversation.sync();

      return conversation;
    },
    enabled: !!client && !!conversationId,
  });

  return {
    conversation,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};
