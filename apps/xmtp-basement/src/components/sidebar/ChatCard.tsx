import Link from "next/link";
import { Avatar, AvatarImage } from "../ui/avatar";

export interface ChatCardProps {
    id: string;
    subname: string;
    description: string;
    avatar: string;

}

export const ChatCard: React.FC<ChatCardProps> = ({ id, subname, description, avatar }) => {

    return (
        <Link href={`/chat/${id}`} className="p-2.5 flex flex-col gap-0.5 rounded-default bg-bg cursor-pointer">
            <div className="flex flex-row gap-2 items-center">
                <Avatar className="w-[14px] h-[14px] rounded-full" >
                    <AvatarImage src={avatar} />
                </Avatar>
                <p className="text-xs font-semibold text-base-sidebar-foreground leading-[100%]">{subname}</p>
            </div>
            <p className="text-xs text-base-sidebar-foreground font-normal line-clamp-1 leading-[133%]">{description}</p>

        </Link>
    )
}
