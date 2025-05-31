import { useXMTP } from '@/context/XMTPContext';
import type {
  Conversation,
  DecodedMessage,
  SafeListMessagesOptions,
} from '@xmtp/browser-sdk';
import { useCallback, useEffect, useRef, useState } from 'react';

type ConversationState = {
  messages: DecodedMessage[];
  isLoading: boolean;
  isLoaded: boolean;
  isSyncing: boolean;
  isSending: boolean;
  isStreaming: boolean;
  error: Error | null;
  lastFetch: number | null;
  lastSync: number | null;
};

const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for messages (shorter than conversations)
const SYNC_COOLDOWN = 30 * 1000; // 30 seconds cooldown between syncs

export const useConversation = (conversation?: Conversation) => {
  const { client } = useXMTP();

  // Single state object for better management
  const [state, setState] = useState<ConversationState>({
    messages: [],
    isLoading: false,
    isLoaded: false,
    isSyncing: false,
    isSending: false,
    isStreaming: false,
    error: null,
    lastFetch: null,
    lastSync: null,
  });

  // Refs to track ongoing operations and prevent duplicates
  const getMessagesPromiseRef = useRef<Promise<DecodedMessage[]> | null>(null);
  const syncPromiseRef = useRef<Promise<void> | null>(null);
  const sendPromiseRef = useRef<Promise<void> | null>(null);
  const streamCleanupRef = useRef<(() => void) | null>(null);
  const conversationIdRef = useRef<string | null>(null);

  // Helper to update state
  const updateState = useCallback((updates: Partial<ConversationState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Check if data is fresh enough
  const isDataFresh = useCallback(() => {
    return state.lastFetch && (Date.now() - state.lastFetch) < CACHE_DURATION;
  }, [state.lastFetch]);

  // Check if sync is on cooldown
  const isSyncOnCooldown = useCallback(() => {
    return state.lastSync && (Date.now() - state.lastSync) < SYNC_COOLDOWN;
  }, [state.lastSync]);

  // Reset state when conversation changes
  useEffect(() => {
    const newConversationId = conversation?.id || null;

    if (conversationIdRef.current !== newConversationId) {
      // Clean up previous stream
      if (streamCleanupRef.current) {
        streamCleanupRef.current();
        streamCleanupRef.current = null;
      }

      // Reset state for new conversation
      setState({
        messages: [],
        isLoading: false,
        isLoaded: false,
        isSyncing: false,
        isSending: false,
        isStreaming: false,
        error: null,
        lastFetch: null,
        lastSync: null,
      });

      // Cancel ongoing operations
      getMessagesPromiseRef.current = null;
      syncPromiseRef.current = null;
      sendPromiseRef.current = null;

      conversationIdRef.current = newConversationId;
    }
  }, [conversation?.id]);

  // Get messages with deduplication and caching
  const getMessages = useCallback(async (
    options?: SafeListMessagesOptions,
    syncFromNetwork = false,
    forceRefresh = false
  ): Promise<DecodedMessage[]> => {
    if (!client || !conversation) {
      throw new Error("XMTP client or conversation is not available");
    }

    // Return cached data if fresh and no force refresh
    if (!forceRefresh && isDataFresh() && state.isLoaded && !syncFromNetwork) {
      return state.messages;
    }

    // If there's already a request in progress, wait for it
    if (getMessagesPromiseRef.current) {
      return getMessagesPromiseRef.current;
    }

    updateState({ isLoading: true, error: null });

    const fetchPromise = (async () => {
      try {
        if (syncFromNetwork) {
          await sync();
        }

        const msgs = await conversation.messages(options);

        updateState({
          messages: msgs,
          isLoaded: true,
          lastFetch: Date.now(),
          error: null,
        });

        return msgs;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to get messages');
        updateState({ error: err });
        throw err;
      } finally {
        updateState({ isLoading: false });
        getMessagesPromiseRef.current = null;
      }
    })();

    getMessagesPromiseRef.current = fetchPromise;
    return fetchPromise;
  }, [client, conversation, isDataFresh, state.isLoaded, state.messages, updateState]);

  // Sync with deduplication and cooldown
  const sync = useCallback(async (force = false): Promise<void> => {
    if (!client || !conversation) {
      throw new Error("XMTP client or conversation is not available");
    }

    // Respect cooldown unless forced
    if (!force && isSyncOnCooldown()) {
      return;
    }

    if (syncPromiseRef.current) {
      return syncPromiseRef.current;
    }

    updateState({ isSyncing: true, error: null });

    const syncPromise = (async () => {
      try {
        await conversation.sync();
        updateState({ lastSync: Date.now() });
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to sync conversation');
        updateState({ error: err });
        throw err;
      } finally {
        updateState({ isSyncing: false });
        syncPromiseRef.current = null;
      }
    })();

    syncPromiseRef.current = syncPromise;
    return syncPromise;
  }, [client, conversation, isSyncOnCooldown, updateState]);

  // Send message with optimistic updates and deduplication
  const send = useCallback(async (
    message: string,
    // optimistic = true
  ): Promise<void> => {
    if (!client || !conversation) {
      throw new Error("XMTP client or conversation is not available");
    }

    if (!message.trim()) {
      throw new Error("Message cannot be empty");
    }

    // Prevent duplicate sends
    if (sendPromiseRef.current) {
      return sendPromiseRef.current;
    }

    updateState({ isSending: true, error: null });

    // // Optimistic update
    // let optimisticMessage: DecodedMessage | null = null;
    // if (optimistic && state.isLoaded) {
    //   optimisticMessage = {
    //     id: `temp-${Date.now()}`,
    //     content: message,
    //     senderInboxId: client.inboxId,
    //     sentAtNs: BigInt(Date.now() * 1_000_000),
    //     // Add other required properties with sensible defaults
    //   } as DecodedMessage<unknown>;
    //
    //   setState(prev => ({
    //     ...prev,
    //     messages: [...prev.messages, optimisticMessage!],
    //   }));
    // }

    const sendPromise = (async () => {
      try {
        await conversation.send(message);

        await getMessages()
        // const messages = await conversation.messages();

        // setState({
        //   ...
        // })
        // Replace optimistic message with real one
        // if (optimistic && optimisticMessage) {
        //   setState(prev => ({
        //     ...prev,
        //     // messages: prev.messages.map(msg =>
        //     //    msg.id === optimisticMessage!.id ? sentMessage : msg
        //     // )
        //     messages: prev.messages.filter(msg => typeof msg === 'string' || msg.id !== optimisticMessage!.id) as DecodedMessage<unknown>[],
        //   }));
        // } else if (!optimistic && state.isLoaded) {
        //   // Add message to list if not using optimistic updates
        //   setState(prev => ({
        //     ...prev,
        //     messages: [...prev.messages, sentMessage],
        //   }));
        // }

        // return sentMessage;
      } catch (error) {
        // Remove optimistic message on error
        // if (optimistic && optimisticMessage) {
        //   setState(prev => ({
        //     ...prev,
        //     messages: prev.messages.filter(msg => typeof msg === 'string' || msg.id !== optimisticMessage!.id) as DecodedMessage<unknown>[],
        //   }));
        // }

        const err = error instanceof Error ? error : new Error('Failed to send message');
        updateState({ error: err });
        throw err;
      } finally {
        updateState({ isSending: false });
        sendPromiseRef.current = null;
      }
    })();

    sendPromiseRef.current = sendPromise as unknown as Promise<void>;
    return sendPromise;
  }, [client, conversation, state.isLoaded, updateState]);

  // Stream messages with proper cleanup and deduplication
  const streamMessages = useCallback(async (): Promise<() => void> => {
    if (!client || !conversation) {
      throw new Error("XMTP client or conversation is not available");
    }

    // Clean up existing stream
    if (streamCleanupRef.current) {
      streamCleanupRef.current();
    }

    updateState({ isStreaming: true, error: null });

    try {
      const onMessage = (
        error: Error | null,
        message: DecodedMessage | undefined
      ) => {
        if (error) {
          updateState({ error });
          return;
        }

        if (message) {
          setState(prev => {
            // Check for duplicates
            const isDuplicate = prev.messages.some(m => typeof m !== 'string' && m.id === message.id);
            if (isDuplicate) return prev;

            // Add message in chronological order
            const newMessages = [...prev.messages, message].sort(
              (a, b) => typeof a !== 'string' && typeof b !== 'string' ? Number(a.sentAtNs - b.sentAtNs) : 0
            );

            return {
              ...prev,
              messages: newMessages,
            };
          });
        }
      };

      const stream = await conversation.stream(onMessage);

      const cleanup = () => {
        updateState({ isStreaming: false });
        if (stream) {
          void stream.return(undefined);
        }
        streamCleanupRef.current = null;
      };

      streamCleanupRef.current = cleanup;
      return cleanup;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to start message stream');
      updateState({ error: err, isStreaming: false });
      throw err;
    }
  }, [client, conversation, updateState]);

  // Auto-start streaming when conversation is available
  useEffect(() => {
    if (conversation && client && !state.isStreaming) {
      streamMessages().catch(console.error);
    }

    return () => {
      if (streamCleanupRef.current) {
        streamCleanupRef.current();
      }
    };
  }, [conversation, client, state.isStreaming, streamMessages]);

  // Auto-fetch messages on mount if needed
  useEffect(() => {
    if (conversation && client && !state.isLoaded && !state.isLoading && !isDataFresh()) {
      getMessages().catch(console.error);
    }
  }, [conversation, client, state.isLoaded, state.isLoading, isDataFresh, getMessages]);

  // Additional utility methods
  const refresh = useCallback(() => {
    return getMessages(undefined, false, true);
  }, [getMessages]);

  const refreshWithSync = useCallback(() => {
    return getMessages(undefined, true, true);
  }, [getMessages]);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const getMessageById = useCallback((messageId: string) => {
    return state.messages.find(msg => msg.id === messageId);
  }, [state.messages]);

  const getLatestMessage = useCallback(() => {
    if (state.messages.length === 0) return null;
    return state.messages.reduce((latest, current) =>
      Number(current.sentAtNs) > Number(latest.sentAtNs) ? current : latest
    );
  }, [state.messages]);

  const getLastStringMessage = useCallback((): DecodedMessage<string> | null => {
    if (state.messages.length === 0) return null;
    return state.messages.reduce((latest, current) =>
      typeof current.content === 'string' ? current : latest
    ) as DecodedMessage<string>;
  }, [state.messages])

  const getMessageCount = useCallback(() => {
    return state.messages.length;
  }, [state.messages.length]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamCleanupRef.current) {
        streamCleanupRef.current();
      }
    };
  }, []);

  return {
    // Data
    messages: state.messages,

    // State flags
    isLoading: state.isLoading,
    isLoaded: state.isLoaded,
    isSyncing: state.isSyncing,
    isSending: state.isSending,
    isStreaming: state.isStreaming,
    error: state.error,

    // Computed state
    isEmpty: state.isLoaded && state.messages.length === 0,
    hasMessages: state.messages.length > 0,
    messageCount: state.messages.length,
    latestMessage: getLatestMessage(),
    latestStringMessage: getLastStringMessage(),
    // Core methods
    getMessages,
    send,
    sync,
    streamMessages,

    // Utility methods
    refresh,
    refreshWithSync,
    clearError,
    getMessageById,
    getLatestMessage,
    getLastStringMessage,
    getMessageCount,

    // Conversation info
    conversationId: conversation?.id || null,
    hasConversation: !!conversation,

  };
};
