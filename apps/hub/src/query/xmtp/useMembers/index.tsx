import { useQuery } from "@tanstack/react-query";
import { Conversation } from "@xmtp/browser-sdk";

interface MembersKeys {
  all: readonly ["members"];
  conversation: (id: string) => readonly ["members", "conversation", string];
}

const membersKeys: MembersKeys = {
  all: ['members'] as const,
  conversation: (id: string) => [...membersKeys.all, "conversation", id] as const,
};

export const useMembers = (conversation?: Conversation) => {
  const {
    data,
    isLoading,
    refetch
  } = useQuery({
    queryKey: membersKeys.conversation(conversation?.id || ""),
    queryFn: async () => {
      return conversation?.members();
    },
    enabled: !!conversation
  })

  return {
    members: data,
    isMembersLoading: isLoading,
    refetchMembers: refetch
  }
}
