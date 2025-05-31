import { useXMTP } from '@/context/XMTPContext';
import { clientEnv } from '@/utils/config/clientEnv';
import { usePrimaryName } from '@justaname.id/react';
import type {
  Conversation as OriginalConversation,
  Identifier,
  SafeCreateGroupOptions,
  SafeListConversationsOptions,
} from '@xmtp/browser-sdk';
import { SortDirection } from '@xmtp/browser-sdk';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

export type AgentConversation = OriginalConversation & {
  peerAddress: string;
  primaryName?: string | null;
  lastMessageTimestamp: number;
};

export const useConversations = () => {
  const { client } = useXMTP();
  const { address } = useAccount();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { getPrimaryName } = usePrimaryName();
  const [conversations, setConversations] = useState<OriginalConversation[]>(
    []
  );
  const [agentConversations, setAgentConversations] = useState<
    AgentConversation[]
  >([]);

  useEffect(() => {
    const fetchAgentConversations = async () => {
      console.log(address, clientEnv.userEnsDomain, client, conversations.length)
      if (
        !address ||
        !clientEnv.userEnsDomain ||
        !client ||
        conversations.length === 0
      ) {
        return;
      }

      console.log(conversations)
      const conversationChecks = conversations.map(async (conversation) => {
        try {
          const members = await conversation.members();
          const peerMember = members.find(
            (member) => member.accountIdentifiers[0].identifier !== address
          );
          if (!peerMember) {
            return null;
          }
          const peerAddress = peerMember.accountIdentifiers[0].identifier;
          const primaryName = await getPrimaryName({
            address: peerAddress as `0x${string}`,
            chainId: 1,
          });
          const isAgent = primaryName?.endsWith(clientEnv.userEnsDomain);

          if (isAgent) {
            const messages = await conversation.messages({
              direction: SortDirection.Descending,
              limit: 1n,
            });
            const lastMessageTimestamp =
              messages.length > 0
                ? Number(messages[0].sentAtNs) / 1_000_000
                : conversation.createdAt?.getTime() ?? 0;

            return {
              ...conversation,
              peerAddress,
              primaryName,
              lastMessageTimestamp,
            } as AgentConversation;
          }
          return null;
        } catch (error) {
          console.error('Error processing conversation:', error);
          return null;
        }
      });

      const results = await Promise.all(conversationChecks);
      const filteredAgentConversations = results.filter(
        (c) => c !== null
      ) as AgentConversation[];

      const sortedConversations = [...filteredAgentConversations].sort(
        (a, b) => {
          return (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0);
        }
      );
      setAgentConversations(sortedConversations);
    };

    void fetchAgentConversations();
  }, [
    client,
    conversations,
    address,
    clientEnv.userEnsDomain,
    getPrimaryName,
    conversations.length,
  ]);

  if (!client) {
    return {
      conversations: [],
      agentConversations: [],
      getConversationById: async () => undefined,
      getMessageById: async () => undefined,
      list: async () => [],
      loading: false,
    };
  }

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
      conversation: OriginalConversation | undefined
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
    agentConversations,
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
