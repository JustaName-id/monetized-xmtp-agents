'use client'
import { UsdcIcon } from "@/lib/icons";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Button } from "./ui";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import {useAddressSubnames} from "@justaname.id/react";
import {useMemo} from "react";
import {clientEnv} from "@/utils/config/clientEnv";
import {useAgentDetails} from "@/hooks/use-agent-details";

export interface AgentProps {
  address: string;
    // subname: string;
    // avatar: string;
    // price: number;
    // description: string;
    // tags: string[];
    // consumption: number;

}

export const MyAgentCard: React.FC<AgentProps> = ({ address }) => {

    const { addressSubnames} = useAddressSubnames({
      address,
      chainId:1
    })
    const agentSubname = useMemo(()=> {
      return addressSubnames.find(({ens})=>ens.endsWith(clientEnv.xmtpAgentEnsDomain))
    },[addressSubnames])
    const {
        avatar,
        description,
        tags,
        fees
    } = useAgentDetails(
        agentSubname
    )
    const onUnsubscribe = () => {
    }
    return (
        <Accordion type="single" collapsible className="p-5 rounded-lg bg-background border-border border-[1px] ">
            <AccordionItem value="item-1" >
                <AccordionTrigger className="gap-5 flex flex-row items-center justify-between">
                    <div className="flex flex-row gap-5 items-center flex-1">

                        <Avatar className="w-16 h-16 rounded-full" >
                            <AvatarImage src={avatar} />
                        </Avatar>
                        <div className="flex flex-col gap-1.5 justify-between w-full">
                            <div className="flex flex-row justify-between items-center">
                                <h3 className="text-base font-semibold text-primary leading-[100%]">{agentSubname?.ens}</h3>
                                <div className="flex flex-row gap-[5px] items-center ">
                                    <UsdcIcon />
                                    <p className="text-xs font-bold text-base-blue leading-[150%]">{`${fees} USDC/MSG`}</p>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground font-normal leading-[133%] line-clamp-2">
                                {description}
                            </p>
                            <div className="flex flex-row gap-1.5 items-center">
                                {tags.map((tag) => (
                                    <Badge key={tag} variant="default">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="flex flex-row w-full justify-between">
                    {/*<div className="flex flex-row gap-[5px] items-center">*/}
                    {/*    <UsdcIcon width={24} height={24} />*/}
                    {/*    <div className="flex flex-col gap-0.5">*/}
                    {/*        <p className="text-xs font-bold text-base-blue leading-[100%]">{`${consumption} USDC`}</p>*/}
                    {/*        <p className="text-xs font-bold text-base-blue leading-[100%]">SPENT</p>*/}
                    {/*    </div>*/}
                    {/*</div>*/}
                    <Button variant="destructive" onClick={onUnsubscribe}>Unsubscribe</Button>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    )
}
