import { Button } from "../ui"
import {useChatBased} from "@/providers/ChatBasedProvider";

export const ClaimIdentity = () => {
    const { handleOpenClaim } = useChatBased()
    return (
        <div className="flex flex-row p-4 justify-between rounded-sm bg-primary-foreground items-center">
            <div className="flex flex-col gap-2.5">
                <p className="text-muted-foreground font-normal text-xl leading-[100%]">Claim your Identity</p>
                <p className="text-muted-foreground font-normal text-base leading-[150%]">Claim a free ENS name and let the agent know who you are!</p>
            </div>
            <Button variant="default" onClick={() => { handleOpenClaim(true)}}>Claim Identity</Button>
        </div>
    )
}
