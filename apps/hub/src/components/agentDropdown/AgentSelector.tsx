'use client'
import { useConversations } from "@/hooks/xmtp";
import { useSubscription } from "@/query/subscription";
import { useSubname } from "@justaname.id/react";
import { useParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { mainnet } from "wagmi/chains";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "../ui";
import { AgentItem } from "./AgentItem";

export const AgentSelector: React.FC = () => {
    const [selectedAgent, setSelectedAgent] = useState<string | undefined>(undefined)
    const { slug } = useParams()
    const { address } = useAccount()
    const [conversationId, agentName] = useMemo(() => {
        return slug ? slug?.toString()?.split('.').length > 2 ? [undefined, slug as string] : [slug as string, undefined] : [undefined, undefined]
    }, [slug])

    if (!conversationId && !agentName) {
        return null
    }
    const { subname } = useSubname({
        subname: agentName,
        chainId: mainnet.id,
        enabled: !!agentName,
    });
    const { validSubscriptions, isSubscriptionsPending } = useSubscription();
    const agentAddresses = useMemo(() => {
        if (!validSubscriptions) return [];
        return Array.from(
            new Set(
                validSubscriptions.map(
                    (subscription) => subscription.spendPermission.spender
                )
            )
        );
    }, [validSubscriptions]);
    const { conversations } = useConversations()

    useEffect(() => {
        if (!conversationId) return
        fetchAgentAddressFromConvo()
    }, [conversationId])

    const fetchAgentAddressFromConvo = async () => {
        if (!conversationId) return
        const convo = await conversations.find((conversation) => conversation.id === conversationId)
        if (!convo) return
        const members = await convo.members()
        const agentAddress = members.find((member) => member.accountIdentifiers[0].identifier !== address)?.accountIdentifiers[0].identifier
        setSelectedAgent(agentAddress)
    }

    const selectedAgentAddress = useMemo(() => {
        if (!subname?.sanitizedRecords.ethAddress) return selectedAgent
        return subname?.sanitizedRecords.ethAddress.value
    }, [subname?.sanitizedRecords.ethAddress, selectedAgent])

    if (isSubscriptionsPending) return null
    return (
        <DropdownMenu>
            <DropdownMenuTrigger showArrow className="h-8 p-2 flex flex-row items-center gap-2 rounded-default bg-background">
                {selectedAgentAddress ?
                    <React.Fragment>
                        <AgentItem address={selectedAgentAddress} small className="md:hidden" />
                        <AgentItem address={selectedAgentAddress} className="hidden md:flex" />
                    </React.Fragment>
                    :
                    <p className="text-xs font-semibold text-base-sidebar-foreground leading-[100%]">Select Agent</p>
                }
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-[250px]">
                <DropdownMenuGroup>
                    {agentAddresses.map((address) => (
                        <DropdownMenuItem key={address}>
                            <AgentItem address={address} selected={selectedAgentAddress?.toLocaleLowerCase() === address.toLocaleLowerCase()} />
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
