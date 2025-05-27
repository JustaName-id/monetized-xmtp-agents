
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
import { ExploreIcon, PenIcon, ProfileIcon } from "@/lib/icons"

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
                        {[1, 2, 3].map((item) => (
                            <ChatCard key={item} id={`${item}`} subname={`Agent ${item}`} description={`Agent ${item} description`} avatar={`https://i.pravatar.cc/300?img=${item}`} />
                        ))}
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}
