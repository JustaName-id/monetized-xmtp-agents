"use client"
import {AgentCard} from "@/components/newChat/AgentCard";
import {ConnectWallet} from "@/components/newChat/ConnectWallet";
import {ClaimIdentity} from "@/components/newChat/ClaimIdentity";
import {Subscribe} from "@/components/newChat/Subscribe";
import {MessageTextField} from "@/components/MessageTextField";
import {useAccount} from "wagmi";
import {useAccountSubnames} from "@justaname.id/react";
import {useAgent} from "@/query/agents";
import {useMemo} from "react";
import {useAgentDetails} from "@/hooks/use-agent-details";

export interface NewChatProps {
  agentName: string
}

export const NewChat: React.FC<NewChatProps> = ({
  agentName
                                                }) => {
  const account = useAccount();
  const { accountSubnames } = useAccountSubnames();
  const { subname } = useAgent(agentName)
  const { description, tags, avatar, spender, fees } = useAgentDetails(subname);
  const isWalletConnected = useMemo(() => account.isConnected, [account.isConnected]);
  const isSubnameClaimed = useMemo(() => accountSubnames.length > 0, [accountSubnames]);

  const isSubscribed = useMemo(() => {
      return false;
  }, []);

  return (
    <div className="wrapper h-full">
      <div className="container flex flex-col h-full justify-between">
        <AgentCard description={description} tags={tags} avatar={avatar} name={agentName} />
        {
          !isWalletConnected ? <ConnectWallet /> :
            isSubnameClaimed ? <ClaimIdentity /> :
              !isSubscribed ?  <Subscribe spender={spender} fees={fees}/> :
                <MessageTextField amountSpent={12.46} />
        }
      </div>
    </div>
  );
}
