import { UsdcIcon } from "@/lib/icons";
import React, { useState } from "react";
import { SubscribeDialog } from "../SubscribeDialog";
import { Button } from "../ui";
import {clientEnv} from "@/utils/config/clientEnv";

export interface SubscribeProps {
  spender: string;
  fees: string;
  agentName: string;
  avatar: string;
}

export const Subscribe: React.FC<SubscribeProps> = ({
  spender,
  fees,
  agentName,
  avatar
}) => {

  const [isSubscribeDialogOpen, setIsSubscribeDialogOpen] = useState(false);
  return (
    <div className="flex flex-row p-4 justify-between rounded-sm bg-primary-foreground items-center">
      <div className="flex flex-col gap-2.5">
        <p className="text-muted-foreground font-normal text-xl leading-[100%]">Subscribe to {agentName.split("."+clientEnv.xmtpAgentEnsDomain)[0]}</p>
        <p className="text-muted-foreground font-normal text-base leading-[150%]">By Subscribing to this agent you will be able to talk to it from any XMTP Powered Chat!</p>
      </div>
      <div className="flex flex-col gap-1.5 items-end">
        <Button variant="default" className={"w-full"} onClick={() => setIsSubscribeDialogOpen(true)}>Subscribe</Button>
        <div className="flex flex-row gap-[5px] items-center">
          <UsdcIcon width={14} height={14} />
          <p className="text-base-blue-600 font-bold text-xs leading-[133%] whitespace-nowrap">{`${fees} USDC/MSG`}</p>
        </div>
      </div>
      <SubscribeDialog open={isSubscribeDialogOpen} onOpenChange={setIsSubscribeDialogOpen} agentName={agentName} avatar={avatar} fees={fees} spender={spender} />
    </div>
  )
}
