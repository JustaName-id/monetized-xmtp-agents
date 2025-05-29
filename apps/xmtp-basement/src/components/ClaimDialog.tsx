import { useState } from "react";
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, Input } from "./ui"
import { useAddSubname, useIsSubnameAvailable } from "@justaname.id/react";
import { clientEnv } from "@/utils/config/clientEnv";
import { LoadingIcon } from "@/lib/icons";
import { useSwitchChain } from "wagmi";
import { mainnet} from "wagmi/chains";

interface ClaimDialogProps {
    trigger: React.ReactNode
}

export const ClaimDialog = ({ trigger }: ClaimDialogProps) => {
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
      await  addSubname({
        username: subname,
        ensDomain: clientEnv.userEnsDomain,
        chainId: mainnet.id,
      });

    }

    const isClaiming = isAddSubnamePending || isSwitchChainPending;
    const canClaim = isSubnameAvailable && !isSubnameAvailablePending && !isClaiming;

    return (
        <Dialog>
            <DialogTrigger>
                {trigger}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Claim a Name!</DialogTitle>
                    <DialogDescription>
                        Anyone who has this link will be able to view this.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex flex-row items-center justify-between gap-2">
                    <Input placeholder="Subname" value={subname} onChange={(e) => setSubname(e.target.value)} rightElement={<p className="text-sm text-primary font-bold">{clientEnv.userEnsDomain}</p>} />
                    {isClaiming ? <LoadingIcon width={10} height={10} /> : <Button disabled={!canClaim} onClick={handleClaim} variant={"default"}>Claim</Button>}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
