import { MessageCard } from "@/components/MessageCard";
import { useConversation, useIdentity } from "../../query/xmtp";
import { Conversation } from "@xmtp/browser-sdk";
import React, { useEffect, useRef } from "react";

interface MessagesProps {
  conversation?: Conversation;
}

export const Messages: React.FC<MessagesProps> = ({
  conversation,
}) => {
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const { inboxId } = useIdentity()
  const { messages } = useConversation(conversation);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col gap-4 flex-1 overflow-y-scroll my-3">
      {
        messages.map((message) => (
          <React.Fragment key={message.id}>
            <MessageCard message={message} isSender={message.senderInboxId === inboxId} />
          </React.Fragment>
        ))
      }
      <div ref={messagesEndRef} />
    </div>
  )
}
