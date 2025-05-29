import { useXMTP } from '@/context/XMTPContext';
import type {
  Conversation,
  Identifier,
  SafeCreateGroupOptions,
  SafeListConversationsOptions,
} from '@xmtp/browser-sdk';
import { useState } from 'react';

export const useConversations = () => {
  const { client } = useXMTP();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);



  const list = async (
    options?: SafeListConversationsOptions,
    syncFromNetwork = false
  ) => {
    if (!client) {
      throw new Error("XMTP client is not initialized");
    }

    if (syncFromNetwork) {
      await sync();
    }

    setLoading(true);

    try {
      const convos = await client.conversations.list(options);
      setConversations(convos);
      return convos;
    } finally {
      setLoading(false);
    }
  };

  const sync = async () => {
    if (!client) {
      throw new Error("XMTP client is not initialized");
    }

    setSyncing(true);

    try {
      await client.conversations.sync();
    } finally {
      setSyncing(false);
    }
  };

  const syncAll = async () => {
    if (!client) {
      throw new Error("XMTP client is not initialized");
    }

    setSyncing(true);

    try {
      await client.conversations.syncAll();
    } finally {
      setSyncing(false);
    }
  };

  const getConversationById = async (conversationId: string) => {
    if (!client) {
      throw new Error("XMTP client is not initialized");
    }

    setLoading(true);

    try {
      const conversation = await client.conversations.getConversationById(
        conversationId
      );
      return conversation;
    } finally {
      setLoading(false);
    }
  };

  const getMessageById = async (messageId: string) => {
    if (!client) {
      throw new Error("XMTP client is not initialized");
    }

    setLoading(true);

    try {
      const message = await client.conversations.getMessageById(messageId);
      return message;
    } finally {
      setLoading(false);
    }
  };

  const newGroup = async (
    inboxIds: string[],
    options?: SafeCreateGroupOptions
  ) => {
    if (!client) {
      throw new Error("XMTP client is not initialized");
    }

    setLoading(true);

    try {
      const conversation = await client.conversations.newGroup(
        inboxIds,
        options
      );
      return conversation;
    } finally {
      setLoading(false);
    }
  };

  const newGroupWithIdentifiers = async (
    identifiers: Identifier[],
    options?: SafeCreateGroupOptions
  ) => {
    if (!client) {
      throw new Error("XMTP client is not initialized");
    }

    setLoading(true);

    try {
      const conversation = await client.conversations.newGroupWithIdentifiers(
        identifiers,
        options
      );
      return conversation;
    } finally {
      setLoading(false);
    }
  };

  const newDm = async (inboxId: string) => {
    if (!client) {
      throw new Error("XMTP client is not initialized");
    }

    setLoading(true);

    try {
      const conversation = await client.conversations.newDm(inboxId);
      return conversation;
    } finally {
      setLoading(false);
    }
  };

  const newDmWithIdentifier = async (identifier: Identifier) => {
    if (!client) {
      throw new Error("XMTP client is not initialized");
    }

    setLoading(true);

    try {
      const conversation = await client.conversations.newDmWithIdentifier(
        identifier
      );
      return conversation;
    } finally {
      setLoading(false);
    }
  };

  const stream = async () => {
    if (!client) {
      throw new Error("XMTP client is not initialized");
    }

    const onConversation = (
      error: Error | null,
      conversation: Conversation | undefined
    ) => {
      if (conversation) {
        const shouldAdd =
          conversation.metadata?.conversationType === 'dm' ||
          conversation.metadata?.conversationType === 'group';
        if (shouldAdd) {
          setConversations((prev) => [conversation, ...prev]);
        }
      }
    };

    const stream = await client.conversations.stream(onConversation);

    return () => {
      void stream.return(undefined);
    };
  };

  return {
    conversations,
    getConversationById,
    getMessageById,
    list,
    loading,
    newDm,
    newDmWithIdentifier,
    newGroup,
    newGroupWithIdentifiers,
    stream,
    sync,
    syncAll,
    syncing,
  };
};
