'use client';
import { MessageTextField } from '@/components/MessageTextField';
import { AgentCard } from '@/components/chat/AgentCard';
import { ClaimIdentity } from '@/components/chat/ClaimIdentity';
import { ConnectWallet } from '@/components/chat/ConnectWallet';
import { ConnectXmtp } from '@/components/chat/ConnectXmtp';
import { Messages } from '@/components/chat/Messages';
import { Subscribe } from '@/components/chat/Subscribe';
import { useXMTP } from '@/context/XMTPContext';
import { useAgentDetails } from '@/hooks/use-agent-details';
import { LoadingIcon } from '@/lib/icons';
import { useSubscription } from '@/query/subscription';
import { useMembers } from '@/query/xmtp/useMembers';
import { clientEnv } from '@/utils/config/clientEnv';
import {
  useAccountSubnames,
  useAddressSubnames,
  useSubname,
} from '@justaname.id/react';
import { useRouter } from 'next/navigation';
import React, { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { useConversation, useConversations, useIdentity } from '../../query/xmtp';

export interface ChatProps {
  conversationId?: string;
  agentName?: string;
}

export const Chat: React.FC<ChatProps> = ({ conversationId, agentName }) => {
  const account = useAccount();
  const { conversation, isConversationPending } =
    useConversation(conversationId);
  const { members, isMembersLoading } = useMembers(conversation);
  const agentAddress = useMemo(() => {
    return members?.find(
      (member) =>
        member.accountIdentifiers[0].identifier.toLowerCase() !==
        account.address?.toLowerCase()
    )?.accountIdentifiers[0].identifier;
  }, [members, account.address]);
  const {
    addressSubnames,
    isAddressSubnamesPending,
    isAddressSubnamesFetching,
  } = useAddressSubnames({
    address: agentAddress ?? undefined,
    chainId: mainnet.id,
    isClaimed: true,
    enabled: !!agentAddress,
  });
  const { subname } = useSubname({
    subname: agentName,
    chainId: mainnet.id,
    enabled: !!agentName,
  });
  const agentSubname = useMemo(() => {
    return (
      addressSubnames.find((subname) =>
        subname.ens.endsWith(clientEnv.xmtpAgentEnsDomain)
      ) || subname
    );
  }, [subname, addressSubnames]);
  const { description, tags, avatar, spender, fees } =
    useAgentDetails(agentSubname);
  const { accountSubnames, isAccountSubnamesFetching } = useAccountSubnames();
  const { isConnected, isInitializing } = useXMTP();
  const { validSubscriptions, isSubscriptionsLoading } = useSubscription();

  const isSubscribed = useMemo(() => {
    return (
      validSubscriptions?.some(
        (subscription) =>
          subscription.spendPermission.spender.toLowerCase() ===
          spender.toLowerCase()
      ) || false
    );
  }, [spender, validSubscriptions]);
  const isWalletConnected = useMemo(
    () => account.isConnected,
    [account.isConnected]
  );
  const isSubnameClaimed = useMemo(
    () =>
      !!accountSubnames.find((subname) =>
        subname.ens.endsWith(clientEnv.userEnsDomain)
      ),
    [accountSubnames]
  );
  const { isSyncing } = useIdentity();
  const { newGroupWithIdentifiers, isLoading, syncAll } = useConversations();
  const router = useRouter();

  const handleNewMessage = async (message: string) => {
    if (isLoading) {
      return;
    }

    const group = await newGroupWithIdentifiers?.([
      {
        identifier: subname?.sanitizedRecords.ethAddress.value ?? '',
        identifierKind: 'Ethereum',
      },
    ]);

    await group?.send(message);
    await group?.sync();
    await syncAll();
    router.push(`/chat/${group?.id}`);
  };

  if (
    isConversationPending ||
    isMembersLoading ||
    (isAddressSubnamesPending && isAddressSubnamesFetching) ||
    isAccountSubnamesFetching ||
    isSubscriptionsLoading ||
    isSyncing ||
    isInitializing
  ) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <LoadingIcon className="w-10 h-10" />
      </div>
    );
  }

  if (!agentSubname) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-center text-primary">No agent found</p>
      </div>
    );
  }

  return (
    <div className="wrapper h-full max-h-[calc(100vh-60px)]">
      <div className="chat-container flex flex-col h-full justify-between">
        <AgentCard
          description={description}
          tags={tags}
          avatar={avatar}
          name={agentSubname?.ens}
        />
        <Messages conversation={conversation} />
        {!isWalletConnected ? (
          <ConnectWallet />
        ) : !isSubnameClaimed ? (
          <ClaimIdentity />
        ) : !isSubscribed ? (
          <Subscribe
            agentName={agentSubname?.ens}
            avatar={avatar}
            spender={spender}
            fees={fees}
          />
        ) : !isConnected ? (
          <ConnectXmtp />
        ) : conversationId ? (
          conversation ? (
            <MessageTextField conversation={conversation} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <LoadingIcon className="w-10 h-10" />
            </div>
          )
        ) : (
          <MessageTextField onNewMessage={handleNewMessage} />
        )}
      </div>
    </div>
  );
};
