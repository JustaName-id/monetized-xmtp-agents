'use client';
import { ChatCard } from '@/components/sidebar/ChatCard';
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
import { useConversations } from '@/hooks/xmtp/useConversations';
import { ExploreIcon, LoadingIcon, PenIcon, ProfileIcon } from '@/lib/icons';
import React, { useEffect } from 'react';
import { useXMTP } from '@/context/XMTPContext';
import { Button } from '@/components/ui';

const items = [
  {
    title: 'New Chat',
    url: '/chat/new',
    icon: PenIcon,
  },
  {
    title: 'My Agents',
    url: '/my-agents',
    icon: ProfileIcon,
  },
  {
    title: 'Explore Agents',
    url: '/',
    icon: ExploreIcon,
  },
];

export function AppSidebar() {
  const { conversations, isLoaded, isLoading, list } = useConversations();
  const { client, initializing } = useXMTP();

  useEffect(() => {
    async function listConv() {
      if (client && !isLoaded ) {
        await list();
      }
    }

    listConv();
  }, [client, isLoaded, list]);

  return (
    <Sidebar>
      <SidebarHeader>XMTP Agents</SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {/* Chats */}
        {initializing && (
          <div className="flex flex-col items-center justify-center h-full">
            <LoadingIcon className="w-10 h-10" />
          </div>
        )}
        {initializing ? null : client ? (
          <SidebarGroup>
            <SidebarGroupLabel>Today</SidebarGroupLabel>
            <SidebarGroupContent className="flex flex-col gap-2">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <LoadingIcon />
                </div>
              ) : (
                conversations.map((conversation) => (
                  <ChatCard key={conversation.id} conversation={conversation} />
                ))
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <Button>Connect to XMTP</Button>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
