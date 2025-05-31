import { SetStateAction, useEffect, useState } from 'react';
import { Client, Dm, Group } from '@xmtp/browser-sdk';
import { StreamOptions, StreamResult } from '../../types';
import { useXmtp } from '../useXmtp';
import { ensureConnected } from '../../utils/helpers';

/**
 * Hook to stream new conversations in real-time
 * @param options Options for the stream
 * @returns Stream status and error
 * @example
 * ```tsx
 * const [notifications, setNotifications] = useState([]);
 *
 * // Stream new conversations
 * useStreamConversations({
 *   onConversation: (conversation) => {
 *     // Show notification for new conversations
 *     setNotifications(prev => [
 *       { id: conversation.id(), type: 'new-conversation' },
 *       ...prev
 *     ]);
 *   },
 *   enabled: true
 * });
 *
 * return (
 *   <div>
 *     {notifications.map(notification => (
 *       <Notification key={notification.id} notification={notification} />
 *     ))}
 *   </div>
 * );
 * ```
 */
export const useStreamConversations = (
  options?: StreamOptions<Group | Dm>
): StreamResult => {
  const { client } = useXmtp();
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Extract options
  const { onItem: onConversation, enabled = true } = options || {};

  useEffect(() => {
    // Don't stream if not enabled or client not connected
    if (!enabled || !client) {
      return;
    }

    let isMounted = true;
    let stream: { end: () => void } | undefined;

    const startStream = async () => {
      try {
        ensureConnected(client as Client);

        setIsStreaming(true);
        setError(null);

        // Start streaming conversations
        stream = await client
          .conversations
          .stream(
            (error: Error | null, conversation?: Group | Dm) => {
              if (!isMounted) return;

              if (error) {
                setError(error as SetStateAction<Error | null>);
                return;
              }

              if (conversation && onConversation) {
                onConversation(conversation);
              }
            }
          );
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err
              : new Error('Failed to stream conversations')
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
  }, [client, onConversation, enabled]);

  return {
    isStreaming,
    error,
  };
};
