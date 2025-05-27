'use client'
import { Avatar, AvatarImage, DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "./ui";

export const AgentSelector: React.FC = () => {

    return (
        <DropdownMenu>
            <DropdownMenuTrigger showArrow className="h-8 p-2 flex flex-row items-center gap-2 rounded-default bg-bg">
                <Avatar className="w-6 h-6 rounded-full">
                    <AvatarImage src={"https://i.pravatar.cc/300?img=1"} />
                </Avatar>
                <p className="text-xs font-semibold text-base-sidebar-foreground leading-[100%]">{"Agent.eth"}</p>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuGroup>
                    {[1, 2, 3].map((item) => (
                        <DropdownMenuItem key={item} className="flex flex-row items-center gap-2 py-2 px-2.5">
                            <Avatar className="w-6 h-6 rounded-full">
                                <AvatarImage src={"https://i.pravatar.cc/300?img=1"} />
                            </Avatar>
                            <p className="text-xs font-semibold text-base-sidebar-foreground leading-[100%]">{"Agent.eth"}</p>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
