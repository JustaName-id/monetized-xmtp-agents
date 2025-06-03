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
import { useGroupedChats } from '@/query/xmtp/useGroupedChats';
import { ExploreIcon, LoadingIcon, PenIcon, ProfileIcon } from '@/lib/icons';
import { useSubscription } from "@/query/subscription";
import Link from 'next/link';

export function AppSidebar() {
  // const { conversations, isLoading } = useConversations();
  const { groupedChats, isLoading } = useGroupedChats();
  const { client, isInitializing, connect } = useXMTP();
  const { validSubscriptions } = useSubscription();

  console.log(groupedChats)
  return (
    <Sidebar>
      <SidebarHeader className='max-md:pb-8'>XMTP Agents</SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {(validSubscriptions && validSubscriptions.length > 0) &&
                <SidebarMenuItem >
                  <SidebarMenuButton asChild>
                    <Link href="/chat">
                      <PenIcon />
                      <span>New Chat</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              }

              <SidebarMenuItem >
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {/* Chats */}
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
                groupedChats.map((group) => (
                  <div className='flex flex-col gap-2' key={group.date}>
                    <SidebarGroupLabel>{group.date}</SidebarGroupLabel>
                    {group.chats.map((chat) => (
                      <ChatCard key={chat.id} conversation={chat} />
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
