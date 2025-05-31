import { useAgentDetails } from '@/hooks/use-agent-details';
import { useAddressSubnames } from '@justaname.id/react';
import Link from 'next/link';
import { Avatar, AvatarImage } from '../ui/avatar';
import { Conversation } from '@xmtp/browser-sdk';
import { useMembers } from '@/hooks/xmtp/useMembers';
import {useEffect, useMemo} from 'react';
import { useAccount } from 'wagmi';
import { clientEnv } from '@/utils/config/clientEnv';
import {useConversation} from "@/hooks/xmtp";

export interface ChatCardProps {
  conversation: Conversation;
}

export const ChatCard: React.FC<ChatCardProps> = ({ conversation }) => {
  const { address } = useAccount();
  const { members } = useMembers({
    conversation,
  });
  const agentMember = useMemo(() => {
    if (!members) return;

    return members.find(
      (member) =>
        member.accountIdentifiers[0].identifier.toLowerCase() !==
        address?.toLowerCase()
    );
  }, [address, members]);
  const { addressSubnames } = useAddressSubnames({
    address: agentMember?.accountIdentifiers[0].identifier,
    chainId: 1,
    enabled: !!agentMember?.accountIdentifiers[0].identifier,
  });
  const subname = useMemo(() => {
    if (!addressSubnames) return;
    return addressSubnames.find((subname) =>
      subname.ens.endsWith(clientEnv.xmtpAgentEnsDomain)
    );
  }, [addressSubnames]);
  const { avatar } = useAgentDetails(subname);
  const { getMessages, isLoaded, latestStringMessage } = useConversation(subname ? conversation : undefined)

  useEffect(() => {
    if(!subname && isLoaded) return
      getMessages()
  }, [getMessages, isLoaded, subname]);
  if(!subname) {
    return null
  }

  return (
    <Link
      href={`/chat/${conversation.id}`}
      className="p-2.5 flex flex-col gap-0.5 rounded-default bg-background cursor-pointer"
    >
      <div className="flex flex-row gap-2 items-center">
        <Avatar className="w-[14px] h-[14px] rounded-full">
          <AvatarImage src={avatar} />
        </Avatar>
        <p className="text-xs font-semibold text-base-sidebar-foreground leading-[100%]">
          {subname?.ens}
        </p>
      </div>
      <p className="text-xs text-base-sidebar-foreground font-normal line-clamp-1 leading-[133%]">
        {
          latestStringMessage?.content ?
          latestStringMessage?.content?.length
            > 20 ? `${latestStringMessage?.content?.slice(0, 20)}...` : latestStringMessage?.content
            : "Can't read message"
        }
      </p>
    </Link>
  );
};
