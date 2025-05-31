import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ContentTypeId } from '@xmtp/content-type-primitives';
import {UseSendMessageResult} from "../../types";
import {useXmtp} from "../useXmtp";
import {useConversation} from "../conversations/useConversation";
import {ensureConnected, ensureConversation} from "../../utils/helpers";
import {xmtpKeys} from "../../utils/queryKeys";
import {Client} from "@xmtp/browser-sdk";

/**
 * Hook to send messages with support for different content types
 * @param conversationId The conversation ID
 * @returns Functions to send messages and loading state
 * @example
 * ```tsx
 * const { sendMessage, sendOptimistic, isSending } = useSendMessage('conversation-id');
 *
 * // Send text message
 * const handleSend = async (text) => {
 *   await sendMessage(text);
 * };
 *
 * // Send with custom content type
 * const handleReact = async (messageId) => {
 *   await sendMessage({ reaction: '👍', messageId }, ContentTypeReaction);
 * };
 *
 * // Send optimistically (appears immediately, syncs later)
 * const handleQuickSend = async (text) => {
 *   await sendOptimistic(text);
 * };
 * ```
 */
export const useSendMessage = (
  conversationId: string
): UseSendMessageResult => {
  const { client } = useXmtp();
  const { conversation } = useConversation(conversationId);
  const queryClient = useQueryClient();

  // Mutation for sending messages
  const mutation = useMutation({
    mutationFn: async ({
      content,
      contentType
    }: {
      content: any;
      contentType?: ContentTypeId
    }): Promise<string> => {
      ensureConnected(client);
      ensureConversation(conversation);

      // Send the message
      return await conversation.send(content, contentType);
    },
    onSuccess: () => {
      // Invalidate the messages query to include the new message
      queryClient.invalidateQueries({
        queryKey: xmtpKeys.messages(conversationId)
      });

      // Invalidate the conversation query to update the last message
      queryClient.invalidateQueries({
        queryKey: xmtpKeys.conversation(conversationId)
      });
    },
  });

  // Function to send a message
  const sendMessage = async (
    content: any,
    contentType?: ContentTypeId
  ): Promise<string> => {
    return await mutation.mutateAsync({ content, contentType });
  };

  // Function to send a message optimistically
  const sendOptimistic = async (
    content: any,
    contentType?: ContentTypeId
  ): Promise<string> => {
    ensureConnected(client as Client);
    ensureConversation(conversation);

    // Create an optimistic message ID
    const optimisticId = `optimistic-${Date.now()}`;

    // Get the current messages from the cache
    const queryKey = xmtpKeys.messages(conversationId);
    const previousData = queryClient.getQueryData(queryKey);

    try {
      // Create an optimistic message
      const optimisticMessage = {
        id: optimisticId,
        content,
        contentType,
        senderInboxId: client?.inboxId,
        sent: new Date(),
        status: 'sending',
      };

      // Add the optimistic message to the cache
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return { pages: [{ messages: [optimisticMessage] }], pageParams: [undefined] };

        // Add to the first page
        const newPages = [...old.pages];
        newPages[0] = {
          ...newPages[0],
          messages: [optimisticMessage, ...newPages[0].messages],
        };

        return {
          ...old,
          pages: newPages,
        };
      });

      // Actually send the message
      const messageId = await conversation.send(content, contentType);

      // Invalidate queries to refresh with the real message
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({
        queryKey: xmtpKeys.conversation(conversationId)
      });

      return messageId;
    } catch (error) {
      // Restore the previous data on error
      queryClient.setQueryData(queryKey, previousData);
      throw error;
    }
  };

  return {
    sendMessage,
    sendOptimistic,
    isSending: mutation.isPending,
    error: mutation.error as Error | null,
  };
};
