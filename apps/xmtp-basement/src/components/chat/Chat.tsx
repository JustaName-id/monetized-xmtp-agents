"use client"
import { MessageTextField } from "@/components/MessageTextField";
import { AgentCard } from "@/components/newChat/AgentCard";
import { ClaimIdentity } from "@/components/newChat/ClaimIdentity";
import { ConnectWallet } from "@/components/newChat/ConnectWallet";
import { ConnectXmtp } from "@/components/newChat/ConnectXmtp";
import { Subscribe } from "@/components/newChat/Subscribe";
import { useXMTP } from "@/context/XMTPContext";
import { useAgentDetails } from "@/hooks/use-agent-details";
import { useConversation, useConversations } from "@/hooks/xmtp";
import { LoadingIcon } from "@/lib/icons";
import { useAgent } from "@/query/agents";
import { clientEnv } from "@/utils/config/clientEnv";
import { useAccountSubnames, useAddressSubnames } from "@justaname.id/react";
import { Conversation } from "@xmtp/browser-sdk";
import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { mainnet } from "wagmi/chains";
import React from 'react';
import {useSubscription} from "@/query/subscription";
import {Messages} from "@/components/chat/Messages";

export interface ChatProps {
    conversationId: string
}

export const Chat: React.FC<ChatProps> = ({
    conversationId
}) => {
    const [conversation, setConversation] = useState<Conversation | undefined>(undefined)
    const [agentAddress, setAgentAddress] = useState<string | null>(null)
    const { getConversationById } = useConversations()
    const { messages , streamMessages, sync } = useConversation(conversation);
    const { addressSubnames } = useAddressSubnames({
        address: agentAddress ?? undefined,
        chainId: mainnet.id,
        isClaimed: true,
        enabled: !!agentAddress
    })
    const agentName = useMemo(() =>
      addressSubnames.length > 0 ?
      addressSubnames[0]?.ens
      : ""
      , [addressSubnames])
    const { subname } = useAgent(agentName)
    const { description, tags, avatar, spender, fees } = useAgentDetails(subname);
    const account = useAccount();
    const { accountSubnames } = useAccountSubnames();
    const { client } = useXMTP();
    const { validSubscriptions } = useSubscription()
    const isSubscribed = useMemo(() => {
      return validSubscriptions?.some(subscription => subscription.spendPermission.spender.toLowerCase() === spender.toLowerCase())
    }, [spender, validSubscriptions]);
    const isWalletConnected = useMemo(() => account.isConnected, [account.isConnected]);
    const isSubnameClaimed = useMemo(() => !!accountSubnames.find(
        subname => subname.ens.endsWith(clientEnv.userEnsDomain)
    ), [accountSubnames]);
    const isXmtpConnected = useMemo(() => !!client, [client]);

    useEffect(() => {
        if(agentAddress) return
        if (!account.address) return
        const fetchConversation = async () => {
            const conversation = await getConversationById(conversationId)
            if (conversation) {
                setConversation(conversation)
                const members = await conversation.members()
                const agentAddress = members.find(member =>
                  member.accountIdentifiers[0].identifier.toLowerCase() !==
                  account.address?.toLowerCase())?.accountIdentifiers[0].identifier
                if (agentAddress) {
                    setAgentAddress(agentAddress)
                }
            }
        }
        fetchConversation()
    }, [conversationId, getConversationById, account.address, agentAddress])


    useEffect(() => {
        if (conversation) {
            sync()
            streamMessages()
        }
    }, [conversation, streamMessages, sync])

    return (
        <div className="wrapper h-full max-h-[calc(100vh-60px)]">
            <div className="container flex flex-col h-full justify-between">
                <AgentCard description={description} tags={tags} avatar={avatar} name={agentName} />
                <Messages conversation={conversation} />
                {
                    !isWalletConnected ?
                        <ConnectWallet /> :
                        !isSubnameClaimed ?
                            <ClaimIdentity /> :
                            !isSubscribed ?
                                <Subscribe agentName={agentName} avatar={avatar} spender={spender} fees={fees} /> :
                                !isXmtpConnected ?
                                    <ConnectXmtp /> :
                                      conversation ?
                                          <MessageTextField conversation={conversation} /> :
                                            <div className="flex flex-col items-center justify-center h-full">
                                                <LoadingIcon className="w-10 h-10" />
                                            </div>
                }
            </div>
        </div>
    );
}

