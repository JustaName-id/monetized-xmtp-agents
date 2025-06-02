import { LoadingIcon } from "@/lib/icons";
import { clientEnv } from "@/utils/config/clientEnv";
import { useAddSubname, useEnsSignIn, useIsSubnameAvailable } from "@justaname.id/react";
import { useJustWeb3 } from "@justweb3/widget";
import { useState } from "react";
import { useSwitchChain } from "wagmi";
import { mainnet } from "wagmi/chains";
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input } from "./ui";

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
    const { refreshEnsAuth } = useJustWeb3();
    const { switchChainAsync, isPending: isSwitchChainPending } = useSwitchChain();
    const { signIn } = useEnsSignIn();

    const handleClaim = async () => {
        await switchChainAsync({ chainId: mainnet.id })
        await addSubname({
            username: subname,
            ensDomain: clientEnv.userEnsDomain,
            chainId: mainnet.id,
        });
        onOpenChange(false);
        refreshEnsAuth();
        signIn({
            ens: subname,
            chainId: mainnet.id,
        });
    }

    const isClaiming = isAddSubnamePending || isSwitchChainPending;
    const canClaim = isSubnameAvailable?.isAvailable && !isSubnameAvailablePending && !isClaiming;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent >
                <DialogHeader>
                    <DialogTitle>Claim a Name!</DialogTitle>
                    {/*<DialogDescription>*/}
                    {/*    Anyone who has this link will be able to view this.*/}
                    {/*</DialogDescription>*/}
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
