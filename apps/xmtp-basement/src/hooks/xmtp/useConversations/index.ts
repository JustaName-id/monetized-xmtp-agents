import { useXMTP } from '@/context/XMTPContext';
import type {
  Conversation as OriginalConversation,
  Identifier,
  SafeCreateGroupOptions,
  SafeListConversationsOptions,
} from '@xmtp/browser-sdk';
import { useCallback, useEffect, useRef, useState } from 'react';

type ConversationsState = {
  conversations: OriginalConversation[];
  isLoading: boolean;
  isLoaded: boolean;
  isSyncing: boolean;
  error: Error | null;
  lastFetch: number | null;
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useConversations = () => {
  const { client } = useXMTP();

  // Single state object for better management
  const [state, setState] = useState<ConversationsState>({
    conversations: [],
    isLoading: false,
    isLoaded: false,
    isSyncing: false,
    error: null,
    lastFetch: null,
  });

  // Refs to track ongoing operations and prevent duplicates
  const listPromiseRef = useRef<Promise<OriginalConversation[]> | null>(null);
  const syncPromiseRef = useRef<Promise<void> | null>(null);
  const syncAllPromiseRef = useRef<Promise<void> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Helper to update state
  const updateState = useCallback((updates: Partial<ConversationsState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Check if data is fresh enough
  const isDataFresh = useCallback(() => {
    return state.lastFetch && (Date.now() - state.lastFetch) < CACHE_DURATION;
  }, [state.lastFetch]);

  // List conversations with deduplication and caching
  const list = useCallback(async (
    options?: SafeListConversationsOptions,
    syncFromNetwork = false,
    forceRefresh = false
  ): Promise<OriginalConversation[]> => {
    if (!client) {
      throw new Error("XMTP client is not initialized");
    }

    // Return cached data if fresh and no force refresh
    if (!forceRefresh && isDataFresh() && state.isLoaded && !syncFromNetwork) {
      return state.conversations;
    }

    // If there's already a request in progress, wait for it
    if (listPromiseRef.current) {
      return listPromiseRef.current;
    }

    updateState({ isLoading: true, error: null });

    const fetchPromise = (async () => {
      try {
        if (syncFromNetwork) {
          await sync();
        }

        const convos = await client.conversations.list(options);

        updateState({
          conversations: convos,
          isLoaded: true,
          lastFetch: Date.now(),
          error: null,
        });

        return convos;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to list conversations');
        updateState({ error: err });
        throw err;
      } finally {
        updateState({ isLoading: false });
        listPromiseRef.current = null;
      }
    })();

    listPromiseRef.current = fetchPromise;
    return fetchPromise;
  }, [client, isDataFresh, state.isLoaded, state.conversations, updateState]);

  // Sync with deduplication
  const sync = useCallback(async (): Promise<void> => {
    if (!client) {
      throw new Error("XMTP client is not initialized");
    }

    if (syncPromiseRef.current) {
      return syncPromiseRef.current;
    }

    updateState({ isSyncing: true, error: null });

    const syncPromise = (async () => {
      try {
        await client.conversations.sync();
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to sync conversations');
        updateState({ error: err });
        throw err;
      } finally {
        updateState({ isSyncing: false });
        syncPromiseRef.current = null;
      }
    })();

    syncPromiseRef.current = syncPromise;
    return syncPromise;
  }, [client, updateState]);

  // Sync all with deduplication
  const syncAll = useCallback(async (): Promise<void> => {
    if (!client) {
      throw new Error("XMTP client is not initialized");
    }

    if (syncAllPromiseRef.current) {
      return syncAllPromiseRef.current;
    }

    updateState({ isSyncing: true, error: null });

    const syncAllPromise = (async () => {
      try {
        await client.conversations.syncAll();
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to sync all conversations');
        updateState({ error: err });
        throw err;
      } finally {
        updateState({ isSyncing: false });
        syncAllPromiseRef.current = null;
      }
    })();

    syncAllPromiseRef.current = syncAllPromise;
    return syncAllPromise;
  }, [client, updateState]);

  // Auto-fetch on mount if needed
  useEffect(() => {
    if (client && !state.isLoaded && !state.isLoading && !isDataFresh()) {
      list().catch(console.error);
    }
  }, [client, state.isLoaded, state.isLoading, isDataFresh, list]);

  // Other methods remain similar but with proper loading states
  const getConversationById = useCallback(async (conversationId: string) => {
    if (!client) {
      throw new Error("XMTP client is not initialized");
    }

    updateState({ isLoading: true, error: null });

    try {
      const conversation = await client.conversations.getConversationById(conversationId);
      return conversation;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to get conversation');
      updateState({ error: err });
      throw err;
    } finally {
      updateState({ isLoading: false });
    }
  }, [client, updateState]);

  const getMessageById = useCallback(async (messageId: string) => {
    if (!client) {
      throw new Error("XMTP client is not initialized");
    }

    updateState({ isLoading: true, error: null });

    try {
      const message = await client.conversations.getMessageById(messageId);
      return message;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to get message');
      updateState({ error: err });
      throw err;
    } finally {
      updateState({ isLoading: false });
    }
  }, [client, updateState]);

  const newGroup = useCallback(async (
    inboxIds: string[],
    options?: SafeCreateGroupOptions
  ) => {
    if (!client) {
      throw new Error("XMTP client is not initialized");
    }

    updateState({ isLoading: true, error: null });

    try {
      const conversation = await client.conversations.newGroup(inboxIds, options);
      // Invalidate cache to refetch conversations
      updateState({ lastFetch: null });
      return conversation;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to create group');
      updateState({ error: err });
      throw err;
    } finally {
      updateState({ isLoading: false });
    }
  }, [client, updateState]);

  const newGroupWithIdentifiers = useCallback(async (
    identifiers: Identifier[],
    options?: SafeCreateGroupOptions
  ) => {
    if (!client) {
      throw new Error("XMTP client is not initialized");
    }

    updateState({ isLoading: true, error: null });

    try {
      const conversation = await client.conversations.newGroupWithIdentifiers(
        identifiers,
        options
      );
      // Invalidate cache to refetch conversations
      updateState({ lastFetch: null });
      return conversation;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to create group with identifiers');
      updateState({ error: err });
      throw err;
    } finally {
      updateState({ isLoading: false });
    }
  }, [client, updateState]);

  const newDm = useCallback(async (inboxId: string) => {
    if (!client) {
      throw new Error("XMTP client is not initialized");
    }

    updateState({ isLoading: true, error: null });

    try {
      const conversation = await client.conversations.newDm(inboxId);
      // Invalidate cache to refetch conversations
      updateState({ lastFetch: null });
      return conversation;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to create DM');
      updateState({ error: err });
      throw err;
    } finally {
      updateState({ isLoading: false });
    }
  }, [client, updateState]);

  const newDmWithIdentifier = useCallback(async (identifier: Identifier) => {
    if (!client) {
      throw new Error("XMTP client is not initialized");
    }

    updateState({ isLoading: true, error: null });

    try {
      const conversation = await client.conversations.newDmWithIdentifier(identifier);
      // Invalidate cache to refetch conversations
      updateState({ lastFetch: null });
      return conversation;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to create DM with identifier');
      updateState({ error: err });
      throw err;
    } finally {
      updateState({ isLoading: false });
    }
  }, [client, updateState]);

  const stream = useCallback(async () => {
    if (!client) {
      throw new Error("XMTP client is not initialized");
    }

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
          setState(prev => ({
            ...prev,
            conversations: [conversation, ...prev.conversations],
            lastFetch: Date.now(), // Update cache timestamp
          }));
        }
      }
    };

    const stream = await client.conversations.stream(onConversation);

    return () => {
      void stream.return(undefined);
    };
  }, [client, updateState]);

  // Refresh method to force reload
  const refresh = useCallback(() => {
    return list(undefined, false, true);
  }, [list]);

  // Clear error method
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // Data
    conversations: state.conversations,

    // State flags
    isLoading: state.isLoading,
    isLoaded: state.isLoaded,
    isSyncing: state.isSyncing,
    error: state.error,

    // Computed state
    isEmpty: state.isLoaded && state.conversations.length === 0,

    // Methods
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
  };
};
