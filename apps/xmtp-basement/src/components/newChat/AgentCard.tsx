import { Avatar, AvatarImage, Badge } from "../ui"

export interface AgentCardProps {
    name: string;
    avatar: string;
    description: string;
    tags: string[];
}

export const AgentCard = ({ name, avatar, description, tags }: AgentCardProps) => {

    return (
        <div className="flex flex-row p-5 gap-5 rounded-lg bg-bg border-border border-[1px]">
            <Avatar className="w-16 h-16 rounded-full">
                <AvatarImage src={avatar} />
            </Avatar>
            <div className="flex flex-col gap-1.5 flex-1">
                <h3 className="text-base font-semibold text-primary leading-[100%]">{name}</h3>
                <p className="text-sm text-muted leading-[100%]">{description}</p>
                <div className="flex flex-row gap-2">
                    {tags.map((tag) => (
                        <Badge key={tag} variant="default">{tag}</Badge>
                    ))}
                </div>
            </div>
        </div>
    )
}
