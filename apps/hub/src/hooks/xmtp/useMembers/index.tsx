import {useQuery} from "@tanstack/react-query";
import {Conversation} from "@xmtp/browser-sdk";


export const useMembers = (conversation?: Conversation) => {
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ['members', conversation?.id],
    queryFn: async () => {
      return conversation?.members();
    },
    enabled: !!conversation
  })

  return {
    members: data,
    isMembersLoading: isLoading
  }
}
