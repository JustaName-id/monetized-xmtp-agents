import { useConversations } from '@/hooks/xmtp/useConversations';
import { clientEnv } from '@/utils/config/clientEnv';
import { useEnsSubnames } from '@justaname.id/react';
import { useQuery } from '@tanstack/react-query';
import {
  SafeGroupMember,
  Conversation as XMTPConversation,
} from '@xmtp/browser-sdk';
import { format, isSameDay } from 'date-fns';
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

      const agentChats: XMTPConversation[] = [];

      for (const convo of conversations) {
        const updatedAtNs = (convo as any).updatedAt;
        if (typeof updatedAtNs !== 'number') {
          console.warn(
            `Conversation (ID: ${
              (convo as any).id || (convo as any).topic || 'N/A'
            }) missing valid updatedAt (number), skipping.`
          );
          continue;
        }

        let membersFromSDK: SafeGroupMember[] = [];
        try {
          membersFromSDK = await convo.members();
        } catch (e) {
          console.error(
            `Error fetching members for conversation (ID: ${
              (convo as any).id || (convo as any).topic || 'N/A'
            }):`,
            e
          );
          continue;
        }

        if (!membersFromSDK || membersFromSDK.length === 0) continue;

        let isAgentChatForThisConvo = false;
        const processedPeerAddresses = new Set<string>();

        for (const member of membersFromSDK) {
          const firstIdentifier =
            member.accountIdentifiers && member.accountIdentifiers[0];
          const memberAddress = firstIdentifier
            ? firstIdentifier.identifier
            : undefined;

          if (
            memberAddress &&
            isValidAddress(memberAddress) &&
            memberAddress.toLowerCase() !== currentUserAddress.toLowerCase()
          ) {
            if (processedPeerAddresses.has(memberAddress.toLowerCase()))
              continue;

            try {
              processedPeerAddresses.add(memberAddress.toLowerCase());

              if (
                agentEnsSubnames &&
                agentEnsSubnames.pages &&
                agentEnsSubnames.pages.length > 0 &&
                agentEnsSubnames.pages[0].data &&
                Array.isArray(agentEnsSubnames.pages[0].data)
              ) {
                const agentSubname = agentEnsSubnames.pages[0].data.find(
                  (subname) =>
                    subname.ens &&
                    subname.ens.endsWith(clientEnv.xmtpAgentEnsDomain)
                );
                if (agentSubname) {
                  isAgentChatForThisConvo = true;
                  break;
                }
              }
            } catch (e) {
              console.error(
                `Failed to fetch subnames for ${memberAddress}:`,
                e
              );
            }
          }
        }

        if (isAgentChatForThisConvo) {
          agentChats.push({
            ...(convo as any),
          });
        }
      }

      const sortedAgentChats = agentChats.sort((a, b) => {
        const aTime = (a as any).updatedAt;
        const bTime = (b as any).updatedAt;
        return (
          (typeof bTime === 'number' ? bTime : 0) -
          (typeof aTime === 'number' ? aTime : 0)
        );
      });

      const groups: GroupedChat[] = [];
      if (sortedAgentChats.length === 0) return groups;

      const firstChatUpdatedAt = (sortedAgentChats[0] as any).updatedAt;
      if (typeof firstChatUpdatedAt !== 'number') {
        console.warn(
          'First chat in sorted list has invalid updatedAt, cannot group.'
        );
        return groups;
      }

      let currentGroup: GroupedChat = {
        date: formatDate(new Date(firstChatUpdatedAt / 1_000_000)),
        chats: [sortedAgentChats[0]],
      };

      for (let i = 1; i < sortedAgentChats.length; i++) {
        const chat = sortedAgentChats[i];
        const chatUpdatedAt = (chat as any).updatedAt;
        if (typeof chatUpdatedAt !== 'number') continue;

        const chatDate = new Date(chatUpdatedAt / 1_000_000);

        const currentGroupFirstChatUpdatedAt = (currentGroup.chats[0] as any)
          .updatedAt;
        if (typeof currentGroupFirstChatUpdatedAt !== 'number') {
          groups.push(currentGroup);
          currentGroup = { date: formatDate(chatDate), chats: [chat] };
          continue;
        }
        const currentGroupDate = new Date(
          currentGroupFirstChatUpdatedAt / 1_000_000
        );

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
