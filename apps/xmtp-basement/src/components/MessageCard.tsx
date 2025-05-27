'use client'


export interface MessageCardProps {
    message: string;
    isSender: boolean;
}

export const MessageCard: React.FC<MessageCardProps> = ({ message, isSender }) => {
    return (
        <div className={`flex flex-row w-full ${isSender ? "justify-end" : "justify-start"}`}>
            <div className={`flex px-3 py-3 rounded-md ${isSender ? "bg-primary rounded-br-none" : "bg-secondary rounded-bl-none"}`}>
                <p className={`text-sm ${isSender ? "text-primary-foreground" : "text-base-foreground"}`}>{message}</p>
            </div>

        </div>
    )
}
