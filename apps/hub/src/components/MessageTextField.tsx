'use client'

import { SendIcon, UsdcIcon } from "@/lib/icons";
import { Conversation } from "@xmtp/browser-sdk";
import { useState } from "react";
import { useConversation } from "../query/xmtp";
import { Button } from "./ui";
import { Textarea } from "./ui/textarea";

export interface MessageTextFieldProps {
  onNewMessage?: (message: string) => void;
  amountSpent?: number;
  conversation?: Conversation;
}

export const MessageTextField: React.FC<MessageTextFieldProps> = ({ onNewMessage, amountSpent, conversation }) => {
  const [message, setMessage] = useState("");
  const { send, isSending, sync } = useConversation(conversation);

  const handleSendMessage = async (message: string) => {
    setMessage("");
    if (conversation) {
      await send(message);
      await sync();
    } else {
      onNewMessage?.(message);
    }
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      {amountSpent && (
        <div className="flex flex-row gap-[5px]">
          <UsdcIcon width={14} height={14} />
          <p className="text-base-blue font-bold text-xs leading-[133%]">{`${amountSpent} USDC Spent`}</p>
        </div>
      )}
      <div className="border rounded-lg bg-background">
        <Textarea
          placeholder="Type a message..."
          className="w-full border-0 resize-none text-primary focus-visible:ring-0 focus-visible:ring-offset-0"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (e.shiftKey) {
                // Shift+Enter creates a new line (default behavior)
                return;
              } else {
                e.preventDefault(); // Prevent new line
                if (message.trim()) {
                  handleSendMessage(message);
                }
              }
            }
          }}
        />
        <div className="flex justify-between items-center px-3 py-2 border-t">
          <div className="flex items-center gap-2">
            {/* <Button
              variant="secondary"
              size="icon"
              disabled={true}
            >
              <FileAttachmentIcon />
            </Button> */}
            {/* Add any additional controls here like file upload, etc. */}
          </div>
          <Button
            variant="default"
            size="icon"
            disabled={!message.trim() || isSending}
            onClick={() => handleSendMessage(message)}
          >
            <SendIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}
