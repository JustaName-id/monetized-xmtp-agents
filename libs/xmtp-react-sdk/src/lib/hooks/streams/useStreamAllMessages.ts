import { useEffect, useState } from 'react';
import {
  Client,
  ConsentState,
  ConversationType,
  DecodedMessage,
} from '@xmtp/browser-sdk';
import { StreamOptions, StreamResult } from '../../types';
import { useXmtp } from '../useXmtp';
import { ensureConnected } from '../../utils/helpers';

/**
 * Hook to stream all messages across all conversations in real-time
 * @param options Options for the stream
 * @returns Stream status and error
 * @example
 * ```tsx
 * const [notifications, setNotifications] = useState([]);
 *
 * // Stream all messages
 * useStreamAllMessages({
 *   onMessage: (message) => {
 *     // Only show notifications for messages from others
 *     if (message.senderInboxId !== currentUserInboxId) {
 *       setNotifications(prev => [{
 *         id: message.id,
 *         conversationId: message.conversationId,
 *         content: message.content,
 *         sender: message.senderInboxId,
 *         timestamp: message.sent
 *       }, ...prev.slice(0, 9)]); // Keep last 10 notifications
 *     }
 *   },
 *   enabled: true
 * });
 *
 * return (
 *   <NotificationCenter notifications={notifications} />
 * );
 * ```
 */
export const useStreamAllMessages = (
  options?: StreamOptions<DecodedMessage> & {
    conversationType?: ConversationType;
    consentStates?: ConsentState[];
  }
): StreamResult => {
  const { client } = useXmtp();
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Extract options
  const {
    onItem: onMessage,
    enabled = true,
    conversationType,
    consentStates,
  } = options || {};

  useEffect(() => {
    // Don't stream if not enabled or client not connected
    if (!enabled || !client) {
      return;
    }

    let isMounted = true;
    let stream: { end: () => void } | undefined;

    const startStream = async () => {
      try {
        ensureConnected(client as Client | null);

        setIsStreaming(true);
        setError(null);

        // Start streaming all messages
        stream = await client.conversations.streamAllMessages(
          (err: Error | null, message?: DecodedMessage<unknown>) => {
            if (!isMounted) return;

            if (err) {
              setError(err);
              return;
            }

            if (!message && onMessage) {
              // Skip undefined messages
              return;
            }

            if (message && onMessage) {
              onMessage(message);
            }
          },
          conversationType,
        );
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err
              : new Error('Failed to stream all messages')
          );
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
  }, [client, onMessage, enabled, conversationType, consentStates]);

  return {
    isStreaming,
    error,
  };
};
