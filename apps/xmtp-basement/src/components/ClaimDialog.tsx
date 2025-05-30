import { useState } from "react";
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input } from "./ui"
import { useAddSubname, useIsSubnameAvailable } from "@justaname.id/react";
import { clientEnv } from "@/utils/config/clientEnv";
import { LoadingIcon } from "@/lib/icons";
import { useSwitchChain } from "wagmi";
import { mainnet } from "wagmi/chains";

interface ClaimDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const ClaimDialog = ({ open, onOpenChange }: ClaimDialogProps) => {
    const [subname, setSubname] = useState("");
    const { addSubname, isAddSubnamePending } = useAddSubname();
    const { isSubnameAvailable, isSubnameAvailablePending } = useIsSubnameAvailable({
        username: subname,
        enabled: !!subname && subname.length > 2,
        ensDomain: clientEnv.userEnsDomain,
        chainId: mainnet.id,
    });

    const { switchChainAsync, isPending: isSwitchChainPending } = useSwitchChain();

    const handleClaim = async () => {
        await switchChainAsync({ chainId: mainnet.id })
        await addSubname({
            username: subname,
            ensDomain: clientEnv.userEnsDomain,
            chainId: mainnet.id,
        });
        onOpenChange(false);
    }

    const isClaiming = isAddSubnamePending || isSwitchChainPending;
    const canClaim = isSubnameAvailable?.isAvailable && !isSubnameAvailablePending && !isClaiming;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent >
                <DialogHeader>
                    <DialogTitle>Claim a Name!</DialogTitle>
                    <DialogDescription>
                        Anyone who has this link will be able to view this.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex sm:flex-col flex-col gap-1">
                    <div className="flex flex-row items-center justify-between gap-2 w-full">
                        <Input placeholder="Subname" value={subname} onChange={(e) => setSubname(e.target.value)} rightElement={<p className="text-sm text-primary font-bold">{`.${clientEnv.userEnsDomain}`}</p>} />
                        {isClaiming ? <LoadingIcon width={10} height={10} /> : <Button disabled={!canClaim} onClick={handleClaim} variant={"default"}>Claim</Button>}
                    </div>
                    {!isSubnameAvailable?.isAvailable && !isSubnameAvailablePending && subname.length > 2 && <p className="text-xs pl-0 !ml-0  text-red-500 font-bold">Subname already taken</p>}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
