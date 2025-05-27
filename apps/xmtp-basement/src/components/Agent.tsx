import { UsdcIcon } from "@/lib/icons";
import { Avatar } from "./ui/avatar";
import { Badge } from "./ui/badge";

export interface AgentProps {
  subname: string;

}

export const Agent: React.FC<AgentProps> = ({ subname }) => {

  const description = "Lorem ipsum dolor sit amet consectetur. Nisi nisl at volutpat maecenas ornare feugiat pharetra. Sed odio tellus maecenas porta elementum"
  const tags = ["Defi", "Trading", "Swap"]
  return (
    <div className="p-5 rounded-lg bg-bg border-border border-[1px] gap-5 flex flex-row items-center">
      <Avatar className="w-16 h-16 rounded-full" />
      <div className="flex flex-col gap-1.5 justify-between">
        <div className="flex flex-row justify-between items-center">
          <h3 className="text-base font-semibold text-primary leading-[100%]">{subname}</h3>
          <div className="flex flex-row gap-[5px] items-center ">
            <UsdcIcon />
            <p className="text-xs font-bold text-blue leading-[150%]">{`${0.04}USDC/MSG`}</p>
          </div>
        </div>
        <p className="text-xs text-muted font-normal leading-[133%] line-clamp-2">
          {description}
        </p>
        <div className="flex flex-row gap-1.5 items-center">
          {tags.map((tag) => (
            <Badge variant="default">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}
