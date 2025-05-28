import { ClaimDialog } from "../ClaimDialog"
import { Button } from "../ui"

export const ClaimIdentity = () => {
    return (
        <div className="flex flex-row p-4 gap-2.5 rounded-sm bg-primary-foreground items-center">
            <div className="flex flex-col gap-2.5">
                <p className="text-muted font-normal text-xl leading-[100%]">Claim your Identity</p>
                <p className="text-muted font-normal text-base leading-[150%]">Lorem ipsum dolor sit amet consectetur. Nisi nisl at volutpat maecenas ornare feugiat pharetra. Sed odio tellus maecenas porta elementum. </p>
            </div>
            <ClaimDialog
                trigger={
                    <Button variant="default" onClick={() => { }}>Claim Identity</Button>
                }
            />
        </div>
    )
}
