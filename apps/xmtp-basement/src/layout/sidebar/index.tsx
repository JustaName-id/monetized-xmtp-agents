'use client'
import { ChatCard } from "@/components/sidebar/ChatCard"
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem
} from "@/components/ui/sidebar"
import { useConversations } from "@/hooks/xmtp/useConversations";
import { ExploreIcon, LoadingIcon, PenIcon, ProfileIcon } from "@/lib/icons"
import {useEffect} from "react";
import {useXMTP} from "@/context/XMTPContext";

const items = [
    {
        title: "New Chat",
        url: "/chat/new",
        icon: PenIcon,
    },
    {
        title: "My Agents",
        url: "/my-agents",
        icon: ProfileIcon,
    },
    {
        title: "Explore Agents",
        url: "/",
        icon: ExploreIcon,
    },
]

export function AppSidebar() {
    const { agentConversations, loading, list } = useConversations();
  const { client } = useXMTP();

  useEffect(() => {
    async function listConv(){
      if(!client){
        const conversation = await list()
        console.log("conversation",conversation)
      }
    }

    listConv()
  }, [client, list]);

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
                <SidebarGroup>
                    <SidebarGroupLabel>Today</SidebarGroupLabel>
                    <SidebarGroupContent className="flex flex-col gap-2">
                        {loading ? (
                            <div className="flex justify-center items-center h-full">
                                <LoadingIcon />
                            </div>
                        ) : (
                            agentConversations.map((conversation) => (
                                <ChatCard key={conversation.id} conversation={conversation} />
                            ))
                        )}
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}
