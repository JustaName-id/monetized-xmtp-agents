'use client'

import { SendIcon, UsdcIcon } from "@/lib/icons";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui";

export interface MessageTextFieldProps {
    onNewMessage?: (message: string) => void;
    amountSpent: number;
}

export const MessageTextField: React.FC<MessageTextFieldProps> = ({ onNewMessage, amountSpent }) => {
    return (
        <div className="flex flex-col gap-2 w-full">
            <div className="flex flex-row gap-[5px]">
                <UsdcIcon width={14} height={14} />
                <p className="text-blue font-bold text-xs leading-[133%]">{`${amountSpent} USDC Spent`}</p>
            </div>
            <div className="flex flex-row gap-2 items-center">
                <Textarea
                    placeholder="Type a message..."
                    className="w-full"
                    onChange={(e) => { }}
                />
                <Button variant="default" className="px-3" onClick={() => onNewMessage?.("")}>
                    <SendIcon />
                </Button>
            </div>
        </div>
    )
}
