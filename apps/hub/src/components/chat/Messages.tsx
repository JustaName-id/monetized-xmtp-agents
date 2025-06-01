import {useConversation, useIdentity} from "@/hooks/xmtp";
import React from "react";
import {MessageCard} from "@/components/MessageCard";
import {Conversation} from "@xmtp/browser-sdk";

interface MessagesProps {
  conversation?: Conversation;
}

export const Messages: React.FC<MessagesProps> = ({
  conversation,
                         }) => {

  const { inboxId } = useIdentity()
  const { messages } = useConversation(conversation);

  return (
    <div className="flex flex-col gap-4 flex-1 overflow-y-scroll my-3">
      {
        messages.map((message) => (
          <React.Fragment key={message.id}>
            <MessageCard message={message} isSender={message.senderInboxId === inboxId} />
          </React.Fragment>
        ))
      }
    </div>
  )
}
