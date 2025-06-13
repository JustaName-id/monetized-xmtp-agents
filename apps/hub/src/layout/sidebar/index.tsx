'use client';
import { ChatCard } from '@/layout/sidebar/ChatCard';
import { Button } from '@/components/ui';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useXMTP } from '@/context/XMTPContext';
import { ExploreIcon, ExternalIcon, LoadingIcon, PackageIcon, PenIcon, ProfileIcon } from '@/lib/icons';
import { useSubscription } from "@/query/subscription";
import Link from 'next/link';
import { useConversation, useConversations } from "@/query/xmtp";
import React, { useEffect, useMemo, useCallback } from "react";
import { Conversation } from "@xmtp/browser-sdk";
import {useAccount} from "wagmi";
import {useMembers} from "@/query/xmtp/useMembers";
import {useAddressSubnames} from "@justaname.id/react";
import {clientEnv} from "@/utils/config/clientEnv";

interface ConversationWithDate {
  conversation: Conversation;
  lastMessageDate: Date;
}

interface GroupedConversations {
  [date: string]: ConversationWithDate[];
}

export function AppSidebar() {
  const [conversationDates, setConversationDates] = React.useState<Map<string, Date>>(new Map());
  const { conversations, isLoading } = useConversations();
  const { client, isInitializing, connect } = useXMTP();
  const { validSubscriptions } = useSubscription();

  const handleConversationOrder = useCallback((conversation: Conversation, lastMessageDate: Date) => {
    setConversationDates(prev => {
      const newMap = new Map(prev);
      const currentDate = prev.get(conversation.id);

      // Only update if the date has actually changed to prevent unnecessary re-renders
      if (!currentDate || currentDate.getTime() !== lastMessageDate.getTime()) {
        newMap.set(conversation.id, lastMessageDate);
      }

      return newMap;
    });
  }, []);

  // Memoized grouped and sorted conversations
  const groupedConversations = useMemo(() => {
    if (!conversations || conversations.length === 0) return {};

    const conversationsWithDates: ConversationWithDate[] = conversations
      .map(conv => ({
        conversation: conv,
        lastMessageDate: conversationDates.get(conv.id) || new Date(0) // Default to epoch if no date
      }))
      .filter(item => item.lastMessageDate.getTime() > 0); // Filter out conversations without dates

    // Group by date
    const grouped: GroupedConversations = {};

    conversationsWithDates.forEach(item => {
      const dateKey = formatDateKey(item.lastMessageDate);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(item);
    });

    // Sort conversations within each group by date (newest first)
    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].sort((a, b) => b.lastMessageDate.getTime() - a.lastMessageDate.getTime());
    });

    return grouped;
  }, [conversations, conversationDates]);

  // Memoized sorted date keys
  const sortedDateKeys = useMemo(() => {
    return Object.keys(groupedConversations).sort((a, b) => {
      const dateA = parseDateKey(a);
      const dateB = parseDateKey(b);
      return dateB.getTime() - dateA.getTime(); // Newest first
    });
  }, [groupedConversations]);

  console.log(sortedDateKeys, groupedConversations);
  return (
    <Sidebar>
      <SidebarHeader className='max-md:pb-8'>XMTP Agents</SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {(validSubscriptions && validSubscriptions.length > 0) &&
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/chat">
                      <PenIcon />
                      <span>New Chat</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              }

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/my-agents">
                    <ProfileIcon />
                    <span>My Agents</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/">
                    <ExploreIcon />
                    <span>Explore</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link target="_blank" href="https://www.npmjs.com/package/@agenthub/xmtp-based-client">
                    <PackageIcon />
                    <span>Based Client</span>
                    <ExternalIcon />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Order Messages Components */}
        {conversations && conversations.map(conversation => (
          <OrderMessages
            key={conversation.id}
            conversation={conversation}
            handleConversationOrder={handleConversationOrder}
          />
        ))}

        {isInitializing && (
          <div className="flex flex-col items-center justify-center h-full">
            <LoadingIcon className="w-10 h-10" />
          </div>
        )}

        {isInitializing ? null : client ? (
          <SidebarGroup>
            <SidebarGroupContent className="flex flex-col gap-2 flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <LoadingIcon />
                </div>
              ) : (
                sortedDateKeys.map((dateKey) => (
                  <div className='flex flex-col gap-2' key={dateKey}>
                    <SidebarGroupLabel>{dateKey}</SidebarGroupLabel>
                    {groupedConversations[dateKey].map(({ conversation }) => (
                      <ChatCard key={conversation.id} conversation={conversation} />
                    ))}
                  </div>
                ))
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <Button onClick={() => connect()}>Connect to XMTP</Button>
        )}
      </SidebarContent>
    </Sidebar>
  );
}

export interface OrderMessagesProps {
  conversation: Conversation;
  handleConversationOrder: (conversation: Conversation, lastMessageDate: Date) => void;
}

const OrderMessages: React.FC<OrderMessagesProps> = React.memo(({
  conversation,
  handleConversationOrder,
}) => {
  const { address } = useAccount();

  const { members } = useMembers(conversation);
  const agentMember = useMemo(() => {
    if (!members) return;

    return members.find(
      (member) =>
        member.accountIdentifiers[0].identifier.toLowerCase() !==
        address?.toLowerCase()
    );
  }, [address, members]);
  const { addressSubnames } = useAddressSubnames({
    address: agentMember?.accountIdentifiers[0].identifier,
    chainId: 1,
    enabled: !!agentMember?.accountIdentifiers[0].identifier,
    isClaimed: true
  });
  const subname = useMemo(() => {
    if (!addressSubnames) return;
    return addressSubnames.find((subname) =>
      subname.ens.endsWith(clientEnv.xmtpAgentEnsDomain)
    );
  }, [addressSubnames]);

  const { latestStringMessage } = useConversation(subname ? conversation : undefined)

  useEffect(() => {
    if (latestStringMessage) {
      const lastMessageDate = new Date(Number(latestStringMessage.sentAtNs) / 1_000_000);
      handleConversationOrder(conversation, lastMessageDate);
    }
  }, [latestStringMessage, conversation.id, handleConversationOrder]); // Use conversation.id instead of conversation object

  return null;
});

OrderMessages.displayName = 'OrderMessages';

// Helper functions
function formatDateKey(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) {
    return 'Today';
  } else if (isYesterday) {
    return 'Yesterday';
  } else {
    // Format as "3rd June", "4th June", etc.
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'long' });
    const suffix = getOrdinalSuffix(day);
    return `${day}${suffix} ${month}`;
  }
}

function parseDateKey(dateKey: string): Date {
  if (dateKey === 'Today') {
    return new Date();
  } else if (dateKey === 'Yesterday') {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  } else {
    // Parse "3rd June" format
    const parts = dateKey.split(' ');
    const dayStr = parts[0].replace(/\D/g, ''); // Remove non-digits
    const monthStr = parts[1];
    const day = parseInt(dayStr, 10);
    const month = new Date(Date.parse(monthStr + " 1, 2000")).getMonth();
    const year = new Date().getFullYear();
    return new Date(year, month, day);
  }
}

function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}
