import { MessageCard } from "@/components/MessageCard";
import { useConversation, useIdentity } from "@/query/xmtp";
import { ContentTypeTyping, Typing } from "@agenthub/xmtp-content-type-typing";
import { Conversation } from "@xmtp/browser-sdk";
import React, { useEffect, useRef, useState } from "react";

interface MessagesProps {
  conversation?: Conversation;
}

export const Messages: React.FC<MessagesProps> = ({
  conversation,
}) => {
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const { inboxId } = useIdentity()
  const { messages } = useConversation(conversation);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    const lastMessage = messages[messages.length - 1];

    if (lastMessage && lastMessage.senderInboxId !== inboxId) {
      if (lastMessage.contentType.sameAs(ContentTypeTyping)) {
        const typingContent = lastMessage.content as Typing;
        if (typingContent.isTyping) {
          setIsAgentTyping(true);
          typingTimeoutRef.current = setTimeout(() => {
            setIsAgentTyping(false);
            typingTimeoutRef.current = null;
          }, 7000);
        } else {
          setIsAgentTyping(false);
        }
      } else {
        setIsAgentTyping(false);
      }
    } else if (lastMessage && lastMessage.senderInboxId === inboxId) {
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [messages, inboxId]);

  return (
    <div className="flex flex-col gap-4 flex-1 overflow-y-scroll my-3 pr-1">
      {
        messages.map((message) => (
          <React.Fragment key={message.id}>
            <MessageCard message={message} isSender={message.senderInboxId === inboxId} />
          </React.Fragment>
        ))
      }
      {isAgentTyping && (
        <div className="flex flex-row w-full justify-start">
          <div className="flex px-3 py-2 rounded-md bg-secondary rounded-bl-none">
            <p className="text-sm text-base-foreground">
              <span className="animate-pulse">●</span>
              <span className="animate-pulse delay-75">●</span>
              <span className="animate-pulse delay-150">●</span>
            </p>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  )
}
