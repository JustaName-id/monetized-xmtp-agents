import { useXMTP } from "@/context/XMTPContext";
import { Button } from "../ui";

export const ConnectXmtp = () => {
    const { connect } = useXMTP();
    return (
        <div className="flex flex-row p-4 gap-2.5 rounded-sm bg-primary-foreground items-center">
            <div className="flex flex-col gap-2.5">
                <p className="text-muted-foreground font-normal text-xl leading-[100%]">Connect to XMTP</p>
                <p className="text-muted-foreground font-normal text-base leading-[150%]">Lorem ipsum dolor sit amet consectetur. Nisi nisl at volutpat maecenas ornare feugiat pharetra. Sed odio tellus maecenas porta elementum. </p>
            </div>
            <Button variant="default" onClick={connect}>Connect To XMTP</Button>
        </div>
    )
}
