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
                      <a href={"/chat"}>
                        <PenIcon />
                        <span>New Chat</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                }

                <SidebarMenuItem >
                  <SidebarMenuButton asChild>
                    <a href={'/my-agents'}>
                      <ProfileIcon />
                      <span>My Agents</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href={"/"}>
                      <ExploreIcon />
                      <span>Explore</span>
                    </a>
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
