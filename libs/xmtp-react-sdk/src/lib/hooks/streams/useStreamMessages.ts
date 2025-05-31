import { useEffect, useState } from 'react';
import { DecodedMessage } from '@xmtp/browser-sdk';
import {StreamOptions, StreamResult} from "../../types";
import {useXmtp} from "../useXmtp";
import {useConversation} from "../conversations/useConversation";
import {ensureConnected, ensureConversation} from "../../utils/helpers";

/**
 * Hook to stream messages in a conversation in real-time
 * @param conversationId The conversation ID
 * @param options Options for the stream
 * @returns Stream status and error
 * @example
 * ```tsx
 * const [unreadMessages, setUnreadMessages] = useState([]);
 *
 * // Stream messages in a conversation
 * useStreamMessages('conversation-id', {
 *   onMessage: (message) => {
 *     // Only show notifications for messages from others
 *     if (message.senderInboxId !== currentUserInboxId) {
 *       setUnreadMessages(prev => [message, ...prev]);
 *       playNotificationSound();
 *     }
 *   },
 *   enabled: isConversationOpen
 * });
 *
 * return (
 *   <div>
 *     {unreadMessages.length > 0 && (
 *       <UnreadBadge count={unreadMessages.length} />
 *     )}
 *   </div>
 * );
 * ```
 */
export const useStreamMessages = (
  conversationId: string,
  options?: StreamOptions<DecodedMessage>
): StreamResult => {
  const { client } = useXmtp();
  const { conversation } = useConversation(conversationId);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Extract options
  const { onItem: onMessage, enabled = true } = options || {};

  useEffect(() => {
    // Don't stream if not enabled, client not connected, or conversation not found
    if (!enabled || !client || !conversation) {
      return;
    }

    let isMounted = true;
    let stream: { end: () => void } | undefined;

    const startStream = async () => {
      try {
        ensureConnected(client);
        ensureConversation(conversation);

        setIsStreaming(true);
        setError(null);

        // Start streaming messages
         stream = await conversation.stream((error, message) => {
          if (!isMounted) return;

          if (error) {
            setError(error);
            return;
          }

          if (message && onMessage) {
            onMessage(message);
          }
        });

      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to stream messages'));
          setIsStreaming(false);
        }
      }
    };

    startStream();

    // Cleanup function
    return () => {
      isMounted = false;
      if (stream) {
        stream.end();
      }
      setIsStreaming(false);
    };
  }, [client, conversation, onMessage, enabled]);

  return {
    isStreaming,
    error,
  };
};
