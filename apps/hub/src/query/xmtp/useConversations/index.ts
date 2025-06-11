import { useXMTP } from '@/context/XMTPContext';
import {
  Conversation as OriginalConversation,
  DecodedMessage,
  Group,
  Identifier,
  SafeCreateGroupOptions,
  SafeListConversationsOptions,
  Dm,
  StreamCallback,
} from '@xmtp/browser-sdk';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import type { GroupUpdated } from '@xmtp/content-type-group-updated';

type ConversationsState = {
  isStreaming: boolean;
  error: Error | null;
};

const STALE_TIME = 2 * 60 * 1000; // Consider data stale after 2 minutes
const CACHE_TIME = 5 * 60 * 1000; // Keep in cache for 5 minutes

// Query key factories
const conversationsKeys = {
  all: ['conversations'] as const,
  lists: () => [...conversationsKeys.all, 'list'] as const,
  list: (options?: SafeListConversationsOptions) =>
    [...conversationsKeys.lists(), options] as const,
  conversation: (id: string) =>
    [...conversationsKeys.all, 'conversation', id] as const,
  message: (id: string) => [...conversationsKeys.all, 'message', id] as const,
};

export const useConversations = () => {
  const { client } = useXMTP();
  const queryClient = useQueryClient();

  // Local state for streaming and error tracking
  const [state, setState] = useState<ConversationsState>({
    isStreaming: false,
    error: null,
  });

  // Refs for cleanup and tracking
  const streamCleanupRef = useRef<(() => void) | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const clientInboxId = client?.inboxId;

  // Helper to update local state
  const updateState = useCallback((updates: Partial<ConversationsState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Main conversations query
  const conversationsQuery: UseQueryResult<OriginalConversation[], Error> =
    useQuery({
      queryKey: conversationsKeys.list(),
      queryFn: async (): Promise<OriginalConversation[]> => {
        if (!client) {
          throw new Error('XMTP client is not initialized');
        }
        return (await client.conversations.list()) as OriginalConversation[];
      },
      enabled: !!client && !!clientInboxId,
      staleTime: STALE_TIME,
      gcTime: CACHE_TIME,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      retry: (failureCount, error) => {
        // Don't retry if it's a client availability error
        if (error.message.includes('not initialized')) return false;
        return failureCount < 3;
      },
    });

  // Sync conversations mutation
  const syncMutation: UseMutationResult<void, Error, void> = useMutation({
    mutationFn: async (): Promise<void> => {
      if (!client) {
        throw new Error('XMTP client is not initialized');
      }
      await client.conversations.sync();
    },
    onError: (error: Error) => {
      updateState({ error });
    },
    onSuccess: () => {
      // Invalidate conversations after successful sync
      queryClient.invalidateQueries({
        queryKey: conversationsKeys.lists(),
      });
    },
  });

  // Sync all conversations mutation
  const syncAllMutation: UseMutationResult<void, Error, void> = useMutation({
    mutationFn: async (): Promise<void> => {
      if (!client) {
        throw new Error('XMTP client is not initialized');
      }
      await client.conversations.syncAll();
    },
    onError: (error: Error) => {
      updateState({ error });
    },
    onSuccess: () => {
      // Invalidate conversations after successful sync all
      queryClient.invalidateQueries({
        queryKey: conversationsKeys.lists(),
      });
    },
  });

  // Get conversation by ID mutation
  const getConversationByIdMutation: UseMutationResult<
    OriginalConversation | null,
    Error,
    string
  > = useMutation({
    mutationFn: async (
      conversationId: string
    ): Promise<OriginalConversation | null> => {
      if (!client) {
        throw new Error('XMTP client is not initialized');
      }
      const result = await client.conversations.getConversationById(
        conversationId
      );
      return result as OriginalConversation | null;
    },
    onError: (error: Error) => {
      updateState({ error });
    },
  });

  // Get message by ID mutation
  const getMessageByIdMutation: UseMutationResult<
    DecodedMessage | null,
    Error,
    string
  > = useMutation({
    mutationFn: async (messageId: string): Promise<DecodedMessage | null> => {
      if (!client) {
        throw new Error('XMTP client is not initialized');
      }
      const message = await client.conversations.getMessageById(messageId);
      return message || null;
    },
    onError: (error: Error) => {
      updateState({ error });
    },
  });

  // Create group mutation
  const newGroupMutation: UseMutationResult<
    OriginalConversation,
    Error,
    { inboxIds: string[]; options?: SafeCreateGroupOptions }
  > = useMutation({
    mutationFn: async ({
      inboxIds,
      options,
    }: {
      inboxIds: string[];
      options?: SafeCreateGroupOptions;
    }): Promise<OriginalConversation> => {
      if (!client) {
        throw new Error('XMTP client is not initialized');
      }
      return (await client.conversations.newGroup(
        inboxIds,
        options
      )) as OriginalConversation;
    },
    onError: (error: Error) => {
      updateState({ error });
    },
    onSuccess: (newConversation) => {
      // Add the new conversation to the cache optimistically
      queryClient.setQueryData<OriginalConversation[]>(
        conversationsKeys.list(),
        (oldConversations = []) => [newConversation, ...oldConversations]
      );
    },
  });

  // Create group with identifiers mutation
  const newGroupWithIdentifiersMutation: UseMutationResult<
    Group,
    Error,
    { identifiers: Identifier[]; options?: SafeCreateGroupOptions }
  > = useMutation({
    mutationFn: async ({
      identifiers,
      options,
    }: {
      identifiers: Identifier[];
      options?: SafeCreateGroupOptions;
    }): Promise<Group> => {
      if (!client) {
        throw new Error('XMTP client is not initialized');
      }
      return (await client.conversations.newGroupWithIdentifiers(
        identifiers,
        options
      )) as Group;
    },
    onError: (error: Error) => {
      updateState({ error });
    },
    onSuccess: (newConversation) => {
      // Add the new conversation to the cache optimistically
      queryClient.setQueryData<OriginalConversation[]>(
        conversationsKeys.list(),
        (oldConversations = []) => {
          // Check for duplicates
          const isDuplicate = oldConversations.some(
            (c) => c.id === newConversation.id
          );
          if (isDuplicate) return oldConversations;

          // Add new conversation at the beginning
          return [newConversation, ...oldConversations];
        }
      );
    },
  });

  // Create DM mutation
  const newDmMutation: UseMutationResult<OriginalConversation, Error, string> =
    useMutation({
      mutationFn: async (inboxId: string): Promise<OriginalConversation> => {
        if (!client) {
          throw new Error('XMTP client is not initialized');
        }
        return (await client.conversations.newDm(
          inboxId
        )) as OriginalConversation;
      },
      onError: (error: Error) => {
        updateState({ error });
      },
      onSuccess: (newConversation) => {
        // Add the new conversation to the cache optimistically
        queryClient.setQueryData<OriginalConversation[]>(
          conversationsKeys.list(),
          (oldConversations = []) => [newConversation, ...oldConversations]
        );
      },
    });

  // Create DM with identifier mutation
  const newDmWithIdentifierMutation: UseMutationResult<
    OriginalConversation,
    Error,
    Identifier
  > = useMutation({
    mutationFn: async (
      identifier: Identifier
    ): Promise<OriginalConversation> => {
      if (!client) {
        throw new Error('XMTP client is not initialized');
      }
      return (await client.conversations.newDmWithIdentifier(
        identifier
      )) as OriginalConversation;
    },
    onError: (error: Error) => {
      updateState({ error });
    },
    onSuccess: (newConversation) => {
      // Add the new conversation to the cache optimistically
      queryClient.setQueryData<OriginalConversation[]>(
        conversationsKeys.list(),
        (oldConversations = []) => [newConversation, ...oldConversations]
      );
    },
  });

  // List conversations with options (uses separate queries for different options)
  const list = useCallback(
    async (
      options?: SafeListConversationsOptions,
      syncFromNetwork = false,
      forceRefresh = false
    ): Promise<OriginalConversation[]> => {
      if (!client) {
        throw new Error('XMTP client is not initialized');
      }

      // Sync first if requested
      if (syncFromNetwork) {
        await syncMutation.mutateAsync();
      }

      // If we have options, use a separate query
      if (options) {
        return queryClient.fetchQuery({
          queryKey: conversationsKeys.list(options),
          queryFn: async () => await client.conversations.list(options),
          staleTime: forceRefresh ? 0 : STALE_TIME,
        });
      }

      // Use main query, force refetch if needed
      if (forceRefresh) {
        await queryClient.refetchQueries({
          queryKey: conversationsKeys.list(),
        });
        return conversationsQuery.data || [];
      }

      // Return cached data or trigger fetch
      return (
        conversationsQuery.data ||
        (await queryClient.fetchQuery({
          queryKey: conversationsKeys.list(),
          queryFn: async () => await client.conversations.list(),
          staleTime: 0,
        }))
      );
    },
    [client, queryClient, syncMutation, conversationsQuery.data]
  );

  // Wrapper methods
  const sync = useCallback(async (): Promise<void> => {
    return syncMutation.mutateAsync();
  }, [syncMutation.mutateAsync]);

  const syncAll = useCallback(async (): Promise<void> => {
    return syncAllMutation.mutateAsync();
  }, [syncAllMutation.mutateAsync]);

  const getConversationById = useCallback(
    async (conversationId: string): Promise<OriginalConversation | null> => {
      return getConversationByIdMutation.mutateAsync(conversationId);
    },
    [getConversationByIdMutation.mutateAsync]
  );

  const getMessageById = useCallback(
    async (messageId: string): Promise<DecodedMessage | null> => {
      return getMessageByIdMutation.mutateAsync(messageId);
    },
    [getMessageByIdMutation.mutateAsync]
  );

  const newGroup = useCallback(
    async (
      inboxIds: string[],
      options?: SafeCreateGroupOptions
    ): Promise<OriginalConversation> => {
      return newGroupMutation.mutateAsync({ inboxIds, options });
    },
    [newGroupMutation.mutateAsync]
  );

  const newGroupWithIdentifiers = useCallback(
    async (
      identifiers: Identifier[],
      options?: SafeCreateGroupOptions
    ): Promise<Group> => {
      return newGroupWithIdentifiersMutation.mutateAsync({
        identifiers,
        options,
      });
    },
    [newGroupWithIdentifiersMutation.mutateAsync]
  );

  const newDm = useCallback(
    async (inboxId: string): Promise<OriginalConversation> => {
      return newDmMutation.mutateAsync(inboxId);
    },
    [newDmMutation.mutateAsync]
  );

  const newDmWithIdentifier = useCallback(
    async (identifier: Identifier): Promise<OriginalConversation> => {
      return newDmWithIdentifierMutation.mutateAsync(identifier);
    },
    [newDmWithIdentifierMutation.mutateAsync]
  );

  // Stream conversations with proper cleanup
  const stream = useCallback(async (): Promise<() => void> => {
    if (!client) {
      throw new Error('XMTP client is not initialized');
    }

    // Clean up existing stream
    if (streamCleanupRef.current) {
      streamCleanupRef.current();
    }

    updateState({ isStreaming: true, error: null });

    try {
      const onConversation = (
        error: Error | null,
        conversation: OriginalConversation | undefined
      ) => {
        if (error) {
          updateState({ error });
          return;
        }

        if (conversation) {
          const shouldAdd =
            conversation.metadata?.conversationType === 'dm' ||
            conversation.metadata?.conversationType === 'group';

          if (shouldAdd) {
            // Update query cache with new conversation
            queryClient.setQueryData<OriginalConversation[]>(
              conversationsKeys.list(),
              (oldConversations = []) => {
                // Check for duplicates
                const isDuplicate = oldConversations.some(
                  (c) => c.id === conversation.id
                );
                if (isDuplicate) return oldConversations;

                // Add new conversation at the beginning
                return [conversation, ...oldConversations];
              }
            );
          }
        }
      };

      const stream = await client.conversations.stream(
        onConversation as
          | StreamCallback<
              Group<string | GroupUpdated> | Dm<string | GroupUpdated>
            >
          | undefined
      );

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
      const err =
        error instanceof Error
          ? error
          : new Error('Failed to start conversation stream');
      updateState({ error: err, isStreaming: false });
      throw err;
    }
  }, [client, queryClient, updateState]);

  // Auto-start streaming when client is available
  useEffect(() => {
    let mounted = true;

    const startStreaming = async () => {
      if (!client || !clientInboxId || state.isStreaming) {
        return;
      }

      try {
        const cleanup = await stream();
        // Store cleanup in ref only if component is still mounted
        if (mounted) {
          streamCleanupRef.current = cleanup;
        } else {
          cleanup();
        }
      } catch (error) {
        if (mounted) {
          console.error('Failed to start conversation streaming:', error);
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
  }, [client?.inboxId, clientInboxId]); // Only depend on stable identifiers

  // Utility methods
  const refresh = useCallback(() => {
    return list(undefined, false, true);
  }, [list]);

  const clearError = useCallback(() => {
    updateState({ error: null });
    // Also clear mutation errors
    syncMutation.reset();
    syncAllMutation.reset();
    getConversationByIdMutation.reset();
    getMessageByIdMutation.reset();
    newGroupMutation.reset();
    newGroupWithIdentifiersMutation.reset();
    newDmMutation.reset();
    newDmWithIdentifierMutation.reset();
  }, [
    syncMutation.reset,
    syncAllMutation.reset,
    getConversationByIdMutation.reset,
    getMessageByIdMutation.reset,
    newGroupMutation.reset,
    newGroupWithIdentifiersMutation.reset,
    newDmMutation.reset,
    newDmWithIdentifierMutation.reset,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (streamCleanupRef.current) {
        streamCleanupRef.current();
      }
    };
  }, []);

  // Combine all errors
  const combinedError =
    state.error ||
    conversationsQuery.error ||
    syncMutation.error ||
    syncAllMutation.error ||
    getConversationByIdMutation.error ||
    getMessageByIdMutation.error ||
    newGroupMutation.error ||
    newGroupWithIdentifiersMutation.error ||
    newDmMutation.error ||
    newDmWithIdentifierMutation.error;

  // Check if any mutation is pending
  const isAnyMutationPending =
    syncMutation.isPending ||
    syncAllMutation.isPending ||
    getConversationByIdMutation.isPending ||
    getMessageByIdMutation.isPending ||
    newGroupMutation.isPending ||
    newGroupWithIdentifiersMutation.isPending ||
    newDmMutation.isPending ||
    newDmWithIdentifierMutation.isPending;

  return {
    // Data
    conversations: conversationsQuery.data || [],

    // State flags
    isPending: conversationsQuery.isPending,
    isLoading: conversationsQuery.isLoading || isAnyMutationPending,
    isLoaded: conversationsQuery.isSuccess,
    isSyncing: syncMutation.isPending || syncAllMutation.isPending,
    isStreaming: state.isStreaming,
    error: combinedError,

    // Computed state
    isEmpty:
      conversationsQuery.isSuccess && conversationsQuery.data?.length === 0,

    // Core methods
    list,
    refresh,
    sync,
    syncAll,
    getConversationById,
    getMessageById,
    newGroup,
    newGroupWithIdentifiers,
    newDm,
    newDmWithIdentifier,
    stream,
    clearError,

    // Additional TanStack Query specific utilities
    refetch: conversationsQuery.refetch,
    isRefetching: conversationsQuery.isRefetching,
    isFetching: conversationsQuery.isFetching,
    isStale: conversationsQuery.isStale,

    // Access to underlying query/mutation objects if needed
    _internal: {
      conversationsQuery,
      syncMutation,
      syncAllMutation,
      getConversationByIdMutation,
      getMessageByIdMutation,
      newGroupMutation,
      newGroupWithIdentifiersMutation,
      newDmMutation,
      newDmWithIdentifierMutation,
    },
  };
};
