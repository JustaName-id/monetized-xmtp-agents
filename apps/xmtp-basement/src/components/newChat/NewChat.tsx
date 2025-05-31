"use client"
import { AgentCard } from "@/components/newChat/AgentCard";
import { ConnectWallet } from "@/components/newChat/ConnectWallet";
import { ClaimIdentity } from "@/components/newChat/ClaimIdentity";
import { Subscribe } from "@/components/newChat/Subscribe";
import { MessageTextField } from "@/components/MessageTextField";
import { useAccount } from "wagmi";
import { useAccountSubnames } from "@justaname.id/react";
import { useAgent } from "@/query/agents";
import { useMemo } from "react";
import { useAgentDetails } from "@/hooks/use-agent-details";
import { ConnectXmtp } from "@/components/newChat/ConnectXmtp";
import { useXMTP } from "@/context/XMTPContext";
import { clientEnv } from "@/utils/config/clientEnv";
import { useConversations } from "@/hooks/xmtp";
import { useRouter } from "next/navigation";
import {useSubscription} from "@/query/subscription";

export interface NewChatProps {
  agentName: string
}

export const NewChat: React.FC<NewChatProps> = ({
  agentName
}) => {
  const { subname } = useAgent(agentName)
  const { description, tags, avatar, spender, fees } = useAgentDetails(subname);
  const account = useAccount();
  const { accountSubnames } = useAccountSubnames();
  const { client } = useXMTP();
  const router = useRouter();

  const isWalletConnected = useMemo(() => account.isConnected, [account.isConnected]);
  const isSubnameClaimed = useMemo(() => !!accountSubnames.find(
    subname => subname.ens.endsWith(clientEnv.userEnsDomain)
  ), [accountSubnames]);
  const isXmtpConnected = useMemo(() => !!client, [client]);
  const { validSubscriptions } = useSubscription()
  const isSubscribed = useMemo(() => {
    return validSubscriptions?.some(subscription => subscription.spendPermission.spender.toLowerCase() === spender.toLowerCase())
  }, [spender, validSubscriptions]);

  const { newGroupWithIdentifiers, loading, syncAll } = useConversations()

  const handleNewMessage = async (message: string) => {
    if (loading) {
      return;
    }
    console.log(message, {
      identifier: subname?.sanitizedRecords.ethAddress.value ?? '',
    })
    const group = await newGroupWithIdentifiers?.([{
      identifier: subname?.sanitizedRecords.ethAddress.value ?? '',
      identifierKind: "Ethereum"
    }]);
    await group?.send(message);
    await syncAll?.();
    router.push(`/chat/${group?.id}`);
  }

  return (
    <div className="wrapper h-full">
      <div className="container flex flex-col h-full justify-between">
        <AgentCard description={description} tags={tags} avatar={avatar} name={agentName} />
        {
          !isWalletConnected ?
            <ConnectWallet /> :
            !isSubnameClaimed ?
              <ClaimIdentity /> :
                !isXmtpConnected ?
                  <ConnectXmtp /> :
                  !isSubscribed ?
                    <Subscribe spender={spender} fees={fees} agentName={agentName} avatar={avatar} /> :
                      <MessageTextField onNewMessage={handleNewMessage} />
        }
      </div>
    </div>
  );
}

