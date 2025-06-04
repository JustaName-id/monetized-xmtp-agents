import { useConversations } from '@/query/xmtp/useConversations';
import { clientEnv } from '@/utils/config/clientEnv';
import { useEnsSubnames } from '@justaname.id/react';
import { useQuery } from '@tanstack/react-query';
import {
  SafeGroupMember,
  SortDirection,
  Conversation as XMTPConversation,
} from '@xmtp/browser-sdk';
import { format, isSameDay } from 'date-fns';
import { useEffect } from 'react';
import { useAccount } from 'wagmi';

const isValidAddress = (address: string): boolean => {
  if (typeof address !== 'string') return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

const groupedChatsKeys = {
  all: ['groupedChats'] as const,
  list: (userId?: string) =>
    userId
      ? [...groupedChatsKeys.all, 'list', userId]
      : [...groupedChatsKeys.all, 'list'],
};

export interface GroupedChat {
  date: string;
  chats: XMTPConversation[];
}

const getOrdinalSuffix = (day: number) => {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
};

const formatDate = (date: Date): string => {
  const day = date.getDate();
  return `${day}${getOrdinalSuffix(day)} ${format(date, 'MMMM')}`;
};

export const useGroupedChats = () => {
  const { address: currentUserAddress } = useAccount();
  const {
    conversations,
    isLoading: isLoadingConversations,
    error: conversationsError,
    refetch: refetchConversations,
  } = useConversations();
  const { data: agentEnsSubnames, isLoading: isLoadingAgentEnsSubnames } =
    useEnsSubnames({
      ensDomain: clientEnv.xmtpAgentEnsDomain,
      isClaimed: true,
      chainId: 1,
    });
  const {
    data,
    isLoading: isLoadingGroupedChats,
    error: errorGroupedChats,
    refetch: refetchGroupedChatsQuery,
  } = useQuery<GroupedChat[], Error>({
    queryKey: groupedChatsKeys.list(currentUserAddress),
    queryFn: async (): Promise<GroupedChat[]> => {
      if (!conversations || conversations.length === 0 || !currentUserAddress) {
        return [];
      }

      const allAgentAddresses =
        agentEnsSubnames?.pages[0]?.data
          ?.map((sub) => sub.sanitizedRecords.ethAddress.value.toLowerCase())
          .filter(Boolean) || [];

      const agentChats: XMTPConversation[] = [];

      for (const convo of conversations) {
        let membersFromSDK: SafeGroupMember[] = [];
        try {
          membersFromSDK = await convo.members();
        } catch (e) {
          console.error(
            `Error fetching members for conversation (ID: ${
              convo.id || 'N/A'
            }):`,
            e
          );
          continue;
        }

        if (!membersFromSDK || membersFromSDK.length === 0) continue;

        let isAgentInConvo = false;

        for (const member of membersFromSDK) {
          const firstIdentifier =
            member.accountIdentifiers && member.accountIdentifiers[0];
          const memberAddress = firstIdentifier
            ? firstIdentifier.identifier
            : undefined;

          if (
            memberAddress &&
            isValidAddress(memberAddress) &&
            memberAddress.toLowerCase() !== currentUserAddress.toLowerCase() &&
            allAgentAddresses.includes(memberAddress.toLowerCase())
          ) {
            isAgentInConvo = true;
            break;
          }
        }

        if (isAgentInConvo) {
          agentChats.push(convo);
        }
      }

      const groups: GroupedChat[] = [];
      if (agentChats.length === 0) return groups;

      const firstChatLastMessage = await agentChats[0].messages({
        direction: SortDirection.Descending,
        limit: BigInt(1),
      });

      let currentGroup: GroupedChat = {
        date: formatDate(
          new Date(Number(firstChatLastMessage[0].sentAtNs) / 1_000_000)
        ),
        chats: [agentChats[0]],
      };
      for (let i = 1; i < agentChats.length; i++) {
        const chat = agentChats[i];
        const chatLastMessage = await chat.messages({
          direction: SortDirection.Descending,
          limit: BigInt(1),
        });
        const chatUpdatedAt = Number(chatLastMessage[0].sentAtNs) / 1_000_000;

        const chatDate = new Date(chatUpdatedAt);

        const currentGroupFirstChatLastMessage =
          await currentGroup.chats[0].messages({
            direction: SortDirection.Descending,
            limit: BigInt(1),
          });
        const currentGroupFirstChatUpdatedAt =
          Number(currentGroupFirstChatLastMessage[0].sentAtNs) / 1_000_000;
        if (typeof currentGroupFirstChatUpdatedAt !== 'number') {
          groups.push(currentGroup);
          currentGroup = { date: formatDate(chatDate), chats: [chat] };
          continue;
        }
        const currentGroupDate = new Date(currentGroupFirstChatUpdatedAt);

        if (isSameDay(chatDate, currentGroupDate)) {
          currentGroup.chats.push(chat);
        } else {
          groups.push(currentGroup);
          currentGroup = {
            date: formatDate(chatDate),
            chats: [chat],
          };
        }
      }
      groups.push(currentGroup);
      return groups;
    },
    enabled:
      !!conversations &&
      conversations.length > 0 &&
      !!currentUserAddress &&
      !isLoadingConversations,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const isLoading =
    isLoadingConversations ||
    isLoadingGroupedChats ||
    isLoadingAgentEnsSubnames;
  const error = conversationsError || errorGroupedChats;

  useEffect(() => {
    if (conversations && conversations.length > 0) {
      refetchGroupedChatsQuery();
    }
  }, [conversations, refetchGroupedChatsQuery]);

  console.log(conversations)
  return {
    groupedChats: data || [],
    isLoading,
    error,
    refetch: async () => {
      if (typeof refetchConversations === 'function') {
        await refetchConversations();
      }
      await refetchGroupedChatsQuery();
    },
  };
};
