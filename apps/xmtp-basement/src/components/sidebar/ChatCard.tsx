import { useAgentDetails } from "@/hooks/use-agent-details";
import { AgentConversation } from "@/hooks/xmtp";
import { useSubname } from "@justaname.id/react";
import Link from "next/link";
import { Avatar, AvatarImage } from "../ui/avatar";

export interface ChatCardProps {
    conversation: AgentConversation;

}

export const ChatCard: React.FC<ChatCardProps> = ({ conversation }) => {
    const { subname } = useSubname({
        subname: conversation.primaryName ?? '',
        enabled: !!conversation.primaryName,
        chainId: 1,
    });
    const { avatar, description } = useAgentDetails(subname);
    return (
        <Link href={`/chat/${conversation.id}`} className="p-2.5 flex flex-col gap-0.5 rounded-default bg-background cursor-pointer">
            <div className="flex flex-row gap-2 items-center">
                <Avatar className="w-[14px] h-[14px] rounded-full" >
                    <AvatarImage src={avatar} />
                </Avatar>
                <p className="text-xs font-semibold text-base-sidebar-foreground leading-[100%]">{conversation.primaryName}</p>
            </div>
            <p className="text-xs text-base-sidebar-foreground font-normal line-clamp-1 leading-[133%]">{description}</p>

        </Link>
    )
}
