import { UsdcIcon } from "@/lib/icons";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { SubnameResponse } from "@justaname.id/sdk";
import { useAgentDetails } from "@/hooks/use-agent-details";

export interface AgentProps {
  subname: SubnameResponse;
}

export const Agent: React.FC<AgentProps> = ({ subname }) => {

  const {
    description,
    fees,
    tags,
  } = useAgentDetails(subname)

  return (
    <div className="p-5 rounded-lg bg-bg border-border border-[1px] gap-5 flex flex-row items-center">
      <Avatar className="w-16 h-16 rounded-full" >
        <AvatarImage src={avatar} />
      </Avatar>
      <div className="flex flex-col gap-1.5 justify-between">
        <div className="flex flex-row justify-between items-center">
          <h3 className="text-base font-semibold text-primary leading-[100%]">{subname.ens}</h3>
          <div className="flex flex-row gap-[5px] items-center ">
            <UsdcIcon />
            <p className="text-xs font-bold text-blue leading-[150%]">{`${fees}USDC/MSG`}</p>
          </div>
        </div>
        <p className="text-xs text-muted font-normal leading-[133%] line-clamp-2">
          {description}
        </p>
        <div className="flex flex-row gap-1.5 items-center">
          {tags.map((tag) => (
            <Badge variant="default" key={tag + subname.ens}>
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}
