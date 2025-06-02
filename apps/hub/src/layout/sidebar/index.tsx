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
import React from 'react';
import { useXMTP } from '@/context/XMTPContext';
import { Button } from '@/components/ui';
import {useSubscription} from "@/query/subscription";
import Link from 'next/link';

export function AppSidebar() {
  const { conversations, isLoading } = useConversations();
  const { client, isInitializing, connect } = useXMTP();
  const { validSubscriptions } = useSubscription();

  return (
    <Sidebar>
      <SidebarHeader>XMTP Agents</SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
                { (validSubscriptions && validSubscriptions.length > 0) &&
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
            <SidebarGroupLabel>Today</SidebarGroupLabel>
            <SidebarGroupContent className="flex flex-col gap-2">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <LoadingIcon />
                </div>
              ) : (
                conversations.map((conversation) => (
                  <ChatCard key={conversation.id} conversationId={conversation.id} />
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
