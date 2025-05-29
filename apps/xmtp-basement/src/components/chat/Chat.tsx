"use client"
import { MessageTextField } from "@/components/MessageTextField";
import { AgentCard } from "@/components/newChat/AgentCard";
import { ClaimIdentity } from "@/components/newChat/ClaimIdentity";
import { ConnectWallet } from "@/components/newChat/ConnectWallet";
import { ConnectXmtp } from "@/components/newChat/ConnectXmtp";
import { Subscribe } from "@/components/newChat/Subscribe";
import { useXMTP } from "@/context/XMTPContext";
import { useAgentDetails } from "@/hooks/use-agent-details";
import { useConversation, useConversations, useIdentity } from "@/hooks/xmtp";
import { LoadingIcon } from "@/lib/icons";
import { useAgent } from "@/query/agents";
import { clientEnv } from "@/utils/config/clientEnv";
import { useAccountSubnames, useAddressSubnames } from "@justaname.id/react";
import { Conversation } from "@xmtp/browser-sdk";
import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { mainnet } from "wagmi/chains";
import { MessageCard } from "../MessageCard";

export interface ChatProps {
    conversationId: string
}

export const Chat: React.FC<ChatProps> = ({
    conversationId
}) => {
    const [conversation, setConversation] = useState<Conversation | undefined>(undefined)
    const [agentAddress, setAgentAddress] = useState<string | null>(null)
    const { getConversationById } = useConversations()
    const { inboxId } = useIdentity()
    const { messages, streamMessages } = useConversation(conversation);
    const { addressSubnames } = useAddressSubnames({
        address: agentAddress ?? undefined,
        chainId: mainnet.id,
        isClaimed: true,
        enabled: !!agentAddress
    })


    const agentName = useMemo(() => addressSubnames[0]?.ens, [addressSubnames])
    const { subname } = useAgent(agentName)
    const { description, tags, avatar, spender, fees } = useAgentDetails(subname);
    const account = useAccount();
    const { accountSubnames } = useAccountSubnames();
    const { client } = useXMTP();

    const isWalletConnected = useMemo(() => account.isConnected, [account.isConnected]);
    const isSubnameClaimed = useMemo(() => !!accountSubnames.find(
        subname => subname.ens.endsWith(clientEnv.userEnsDomain)
    ), [accountSubnames]);
    const isXmtpConnected = useMemo(() => !!client, [client]);
    const isSubscribed = useMemo(() => {
        return false;
    }, []);


    useEffect(() => {
        const fetchConversation = async () => {
            const conversation = await getConversationById(conversationId)
            if (conversation) {
                setConversation(conversation)
                const members = await conversation.members()
                const agentAddress = members.find(member => member.accountIdentifiers[0].identifier !== account.address)?.accountIdentifiers[0].identifier
                if (agentAddress) {
                    setAgentAddress(agentAddress)
                }
            }
        }
        fetchConversation()
    }, [conversationId, getConversationById, account.address])

    useEffect(() => {
        if (conversation) {
            streamMessages()
        }
    }, [conversation, streamMessages])

    return (
        <div className="wrapper h-full">
            <div className="container flex flex-col h-full justify-between">
                <AgentCard description={description} tags={tags} avatar={avatar} name={agentName} />
                <div className="flex flex-col gap-4 flex-1">
                    {
                        messages.map((message) => (
                            <MessageCard message={message} isSender={message.senderInboxId === inboxId} />
                        ))
                    }
                </div>
                {
                    !isWalletConnected ?
                        <ConnectWallet /> :
                        !isSubnameClaimed ?
                            <ClaimIdentity /> :
                            !isSubscribed ?
                                <Subscribe spender={spender} fees={fees} /> :
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

