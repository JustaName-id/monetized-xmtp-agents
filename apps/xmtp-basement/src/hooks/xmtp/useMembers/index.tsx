import {useQuery} from "@tanstack/react-query";
import {Conversation} from "@xmtp/browser-sdk";

export interface UseMemberParams {
  conversation: Conversation
}


export const useMembers = (params: UseMemberParams) => {
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ['members', params.conversation.id],
    queryFn: async () => {
      return await params.conversation.members()
    }
  })

  return {
    members: data,
    isLoading
  }
}
