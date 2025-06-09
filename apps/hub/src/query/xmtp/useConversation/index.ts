import { useXMTP } from '@/context/XMTPContext';
import type {
  Conversation,
  DecodedMessage,
  SafeListMessagesOptions,
} from '@xmtp/browser-sdk';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult
} from '@tanstack/react-query';

type ConversationState = {
  isStreaming: boolean;
  error: Error | null;
  lastSync: number | null;
};

const SYNC_COOLDOWN = 30 * 1000; // 30 seconds cooldown between syncs
const STALE_TIME = 30 * 1000; // Consider data stale after 30 seconds
const CACHE_TIME = 5 * 60 * 1000; // Keep in cache for 5 minutes

// Query key factories
const conversationKeys = {
  all: ['conversations'] as const,
  conversation: (id: string) => [...conversationKeys.all, id] as const,
  messages: (id: string) => [...conversationKeys.conversation(id), 'messages'] as const,
  messagesWithOptions: (id: string, options?: SafeListMessagesOptions) =>
    [...conversationKeys.messages(id), options] as const,
};

export const useConversation = (conversationParam?: Conversation | string) => {
  const { client } = useXMTP();
  const queryClient = useQueryClient();

  // Local state for streaming and sync tracking
  const [state, setState] = useState<ConversationState>({
    isStreaming: false,
    error: null,
    lastSync: null,
  });

  // Refs for cleanup and tracking
  const streamCleanupRef = useRef<(() => void) | null>(null);
  const conversationIdRef = useRef<string | null>(null);

  // Determine conversation ID and object based on input type
  const conversationId = typeof conversationParam === 'string'
    ? conversationParam
    : conversationParam?.id;

  const conversation = typeof conversationParam === 'string'
    ? undefined
    : conversationParam;

  const hasConversation = !!conversationParam;

  // Helper to update local state
  const updateState = useCallback((updates: Partial<ConversationState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Check if sync is on cooldown
  const isSyncOnCooldown = useCallback(() => {
    return state.lastSync && (Date.now() - state.lastSync) < SYNC_COOLDOWN;
  }, [state.lastSync]);

  // Query to get conversation object when only ID is provided
  const conversationQuery: UseQueryResult<Conversation | undefined, Error> = useQuery({
    queryKey: conversationKeys.conversation(conversationId || ''),
    queryFn: async (): Promise<Conversation | undefined> => {
      if (!client || !conversationId || typeof conversationParam !== 'string') {
        return undefined;
      }

      // Get conversation from client's conversation list
      const conversations = await client.conversations.list();
      return conversations.find(conv => conv.id === conversationId);
    },
    enabled: !!client && !!conversationId && typeof conversationParam === 'string',
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnWindowFocus: false,
  });

  // Get the actual conversation object to use
  const activeConversation = conversation || conversationQuery.data;

  // Messages query
  const messagesQuery: UseQueryResult<DecodedMessage[], Error> = useQuery({
    queryKey: conversationKeys.messages(conversationId || ''),
    queryFn: async (): Promise<DecodedMessage[]> => {
      if (!client || !activeConversation) {
        throw new Error("XMTP client or conversation is not available");
      }
      return await activeConversation.messages();
    },
    enabled: !!client && !!activeConversation && !!conversationId,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME, // Renamed from cacheTime in v5
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: (failureCount, error) => {
      // Don't retry if it's a client/conversation availability error
      if (error.message.includes('not available')) return false;
      return failureCount < 3;
    },
  });

  // Sync mutation
  const syncMutation: UseMutationResult<void, Error, { force?: boolean } | undefined> = useMutation({
    mutationFn: async ({ force = false }: { force?: boolean } = {}): Promise<void> => {
      if (!client || !activeConversation) {
        throw new Error("XMTP client or conversation is not available");
      }

      // Respect cooldown unless forced
      if (!force && isSyncOnCooldown()) {
        return;
      }

      await activeConversation.sync();
      updateState({ lastSync: Date.now() });
    },
    onError: (error: Error) => {
      updateState({ error });
    },
    onSuccess: () => {
      // Invalidate messages after successful sync
      if (conversationId) {
        queryClient.invalidateQueries({
          queryKey: conversationKeys.messages(conversationId)
        });
      }
    },
  });

  // Send message mutation
  const sendMutation: UseMutationResult<void, Error, string> = useMutation({
    mutationFn: async (message: string): Promise<void> => {
      if (!client || !activeConversation) {
        throw new Error("XMTP client or conversation is not available");
      }

      if (!message.trim()) {
        throw new Error("Message cannot be empty");
      }

      await activeConversation.send(message);
    },
    onError: (error: Error) => {
      updateState({ error });
    },
    onSuccess: () => {
      // Refetch messages after successful send
      if (conversationId) {
        queryClient.invalidateQueries({
          queryKey: conversationKeys.messages(conversationId)
        });
      }
    },
  });

  // Get messages with options (separate query for different options)
  const getMessages = useCallback(async (
    options?: SafeListMessagesOptions,
    syncFromNetwork = false,
    forceRefresh = false
  ): Promise<DecodedMessage[]> => {
    if (!client || !activeConversation || !conversationId) {
      throw new Error("XMTP client or conversation is not available");
    }

    // Sync first if requested
    if (syncFromNetwork) {
      await syncMutation.mutateAsync({ force: forceRefresh });
    }

    // If we have options, use a separate query
    if (options) {
      return queryClient.fetchQuery({
        queryKey: conversationKeys.messagesWithOptions(conversationId, options),
        queryFn: async () => await activeConversation.messages(options),
        staleTime: forceRefresh ? 0 : STALE_TIME,
      });
    }

    // Use main query, force refetch if needed
    if (forceRefresh) {
      await queryClient.refetchQueries({
        queryKey: conversationKeys.messages(conversationId)
      });
      return messagesQuery.data || [];
    }

    // Return cached data or trigger fetch
    return messagesQuery.data ||
      await queryClient.fetchQuery({
        queryKey: conversationKeys.messages(conversationId),
        queryFn: async () => await activeConversation.messages(),
        staleTime: 0,
      });
  }, [client, activeConversation, conversationId, queryClient, syncMutation]);

  // Sync wrapper - memoized to prevent recreations
  const sync = useCallback(async (force = false): Promise<void> => {
    return syncMutation.mutateAsync({ force });
  }, [syncMutation.mutateAsync]);

  // Send wrapper - memoized to prevent recreations
  const send = useCallback(async (message: string): Promise<void> => {
    return sendMutation.mutateAsync(message);
  }, [sendMutation.mutateAsync]);

  // Stream messages with proper cleanup and deduplication
  const streamMessages = useCallback(async (): Promise<() => void> => {
    if (!client || !activeConversation || !conversationId) {
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
          // Update query cache with new message
          queryClient.setQueryData<DecodedMessage[]>(
            conversationKeys.messages(conversationId),
            (oldMessages = []) => {
              // Check for duplicates
              const isDuplicate = oldMessages.some(m => m.id === message.id);
              if (isDuplicate) return oldMessages;

              // Add message in chronological order
              const newMessages = [...oldMessages, message].sort(
                (a, b) => Number(a.sentAtNs - b.sentAtNs)
              );

              return newMessages;
            }
          );
        }
      };

      const stream = await activeConversation.stream(onMessage);

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
  }, [client, activeConversation, conversationId, queryClient]);

  // Reset cache and state when conversation changes
  useEffect(() => {
    const newConversationId = conversationParam ?
      typeof conversationParam === 'string'
      ? conversationParam
      : (conversationParam)?.id
      :null;

    if (conversationIdRef.current !== newConversationId) {
      // Clean up previous stream
      if (streamCleanupRef.current) {
        streamCleanupRef.current();
        streamCleanupRef.current = null;
      }

      // Reset local state
      setState({
        isStreaming: false,
        error: null,
        lastSync: null,
      });

      // Cancel ongoing mutations
      syncMutation.reset();
      sendMutation.reset();

      // Remove queries for old conversation
      if (conversationIdRef.current) {
        queryClient.removeQueries({
          queryKey: conversationKeys.conversation(conversationIdRef.current)
        });
      }

      conversationIdRef.current = newConversationId;
    }
  }, [conversationParam, queryClient, syncMutation, sendMutation]);

  // Auto-start streaming when conversation is available
  useEffect(() => {
    let mounted = true;

    const startStreaming = async () => {
      await getMessages(undefined, true, true)
      if (!activeConversation || !client || !conversationId || state.isStreaming) {
        return;
      }

      try {
        const cleanup = await streamMessages();
        // Store cleanup in ref only if component is still mounted
        if (mounted) {
          streamCleanupRef.current = cleanup;
        } else {
          cleanup();
        }
      } catch (error) {
        if (mounted) {
          console.error('Failed to start streaming:', error);
        }
      }
    };

    startStreaming();

    return () => {
      mounted = false;
      if (streamCleanupRef.current) {
        streamCleanupRef.current();
        streamCleanupRef.current = null;
      }
    };
  }, [conversationId, client?.inboxId]); // Only depend on stable identifiers

  // Utility methods - all memoized to prevent infinite renders
  const refresh = useCallback(() => {
    return getMessages(undefined, false, true);
  }, [getMessages]);

  const refreshWithSync = useCallback(() => {
    return getMessages(undefined, true, true);
  }, [getMessages]);

  const clearError = useCallback(() => {
    updateState({ error: null });
    // Also clear mutation errors
    syncMutation.reset();
    sendMutation.reset();
  }, [syncMutation.reset, sendMutation.reset]);

  const getMessageById = useCallback((messageId: string) => {
    return messagesQuery.data?.find(msg => msg.id === messageId);
  }, [messagesQuery.data]);

  const getLatestMessage = useCallback(() => {
    if (!messagesQuery.data || messagesQuery.data.length === 0) return null;
    return messagesQuery.data.reduce((latest, current) =>
      Number(current.sentAtNs) > Number(latest.sentAtNs) ? current : latest
    );
  }, [messagesQuery.data]);

  const getLastStringMessage = useCallback((): DecodedMessage<string> | null => {
    if (!messagesQuery.data || messagesQuery.data.length === 0) return null;
    const lastMessage = messagesQuery.data.reduce((latest, current) =>
      typeof current.content === 'string' ? current : latest
    ) as DecodedMessage<string>;
    return typeof lastMessage.content === 'string' ? lastMessage : null;
  }, [messagesQuery.data]);

  const getMessageCount = useCallback(() => {
    return messagesQuery.data?.length || 0;
  }, [messagesQuery.data?.length]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamCleanupRef.current) {
        streamCleanupRef.current();
      }
    };
  }, []);

  // Combine all errors
  const combinedError = state.error || messagesQuery.error || conversationQuery.error || syncMutation.error || sendMutation.error;

  return {
    // Data
    messages: messagesQuery.data || [],

    // State flags - combining query and mutation states
    isMessagePending: messagesQuery.isPending || (typeof conversationParam === 'string' && conversationQuery.isPending),
    isLoaded: messagesQuery.isSuccess,
    isSyncing: syncMutation.isPending,
    isSending: sendMutation.isPending,
    isStreaming: state.isStreaming,
    error: combinedError,

    // Computed state
    isEmpty: messagesQuery.isSuccess && (messagesQuery.data?.length === 0),
    hasMessages: (messagesQuery.data?.length || 0) > 0,
    messageCount: messagesQuery.data?.length || 0,
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
    conversationId: conversationId || null,
    hasConversation,
    conversation: activeConversation,
    isConversationPending: typeof conversationParam === 'string' && conversationQuery.isPending,

    // Additional TanStack Query specific utilities
    refetch: messagesQuery.refetch,
    isRefetching: messagesQuery.isRefetching,
    isFetching: messagesQuery.isFetching || (typeof conversationParam === 'string' && conversationQuery.isFetching),
    isStale: messagesQuery.isStale,

    // Access to underlying query/mutation objects if needed
    _internal: {
      messagesQuery,
      conversationQuery,
      syncMutation,
      sendMutation,
    },
  };
};
