'use client'

import { SendIcon, UsdcIcon } from "@/lib/icons";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui";
import { Conversation } from "@xmtp/browser-sdk";
import { useState } from "react";
import { useConversation } from "@/hooks/xmtp";
export interface MessageTextFieldProps {
    onNewMessage?: (message: string) => void;
    amountSpent?: number;
    conversation?: Conversation;
}

export const MessageTextField: React.FC<MessageTextFieldProps> = ({ onNewMessage, amountSpent, conversation }) => {
    const [message, setMessage] = useState("");

    const { send, sending, sync } = useConversation(conversation);

    const handleSendMessage = async (message: string) => {
        if (conversation) {
            await send(message);
            setMessage("");
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
            <div className="flex flex-row gap-2 items-center">
                <Textarea
                    placeholder="Type a message..."
                    className="w-full"
                    onChange={(e) => setMessage(e.target.value)}
                />
                <Button variant="default" disabled={!message || sending} className="px-3" onClick={() => handleSendMessage(message)}>
                    <SendIcon />
                </Button>
            </div>
        </div>
    )
}
