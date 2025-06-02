import { UsdcIcon } from "@/lib/icons";
import { useSubscription } from "@/query/subscription";
import { Address } from "viem";
import { useState } from "react";
import { Avatar, AvatarImage, Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input } from "./ui";

interface SubscribeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    agentName: string;
    avatar: string;
    fees: string;
    spender: string;
}

export const SubscribeDialog = ({ open, onOpenChange, agentName, avatar, fees, spender }: SubscribeDialogProps) => {
    const [allowance, setAllowance] = useState(0);
    const [displayValueForInput, setDisplayValueForInput] = useState<string>("");

    const { subscribe, isSubscribingPending } = useSubscription()

    const handleSubscribe = async () => {
        const result = await subscribe({
            spenderAddress: spender as Address,
            allowance: allowance.toString()
        })
        if (result.status === "success") {
            onOpenChange(false)
        }
    }

    const handleAllowanceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;

        if (rawValue !== "" && !/^\d*\.?\d*$/.test(rawValue)) {
            return;
        }

        let displayForInput = rawValue;
        let numericAmount: number;

        if (rawValue === "") {
            numericAmount = 0;
        } else if (rawValue === ".") {
            numericAmount = 0;
        } else if (rawValue.startsWith("0") && rawValue.length > 1 && rawValue[1] !== '.') {
            const stripped = rawValue.replace(/^0+/, '');
            displayForInput = stripped === "" ? "0" : stripped;
            numericAmount = parseFloat(displayForInput);
        } else {
            numericAmount = parseFloat(rawValue);
        }

        if (isNaN(numericAmount)) {
            numericAmount = 0;
        }

        setDisplayValueForInput(displayForInput);
        setAllowance(numericAmount);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent >
                <DialogHeader>
                    <DialogTitle>Subscribe to</DialogTitle>

                    <div className="flex flex-row justify-between items-center w-full">
                        <div className="flex flex-row items-center gap-1.5">
                            <Avatar>
                                <AvatarImage src={avatar} />
                            </Avatar>
                            <p className="text-base font-semibold text-primary">{agentName}</p>
                        </div>
                        <div className="flex flex-row items-center gap-[5px]">
                            <UsdcIcon width={14} height={14} />
                            <p className="text-base-blue font-bold text-xs leading-[133%] ">{`${fees} USDC/MSG`}</p>
                        </div>

                    </div>
                </DialogHeader>
                <DialogFooter className="flex sm:flex-col flex-col gap-4">
                    <Input
                        leftElement={<UsdcIcon width={14} height={14} />}
                        placeholder="Allowance"
                        type="text"
                        value={displayValueForInput}
                        onChange={handleAllowanceInputChange}
                        rightElement={<p className="text-sm text-primary font-bold">{"/Month"}</p>}
                    />
                    <div className="flex flex-row justify-end">
                        <Button variant={"default"} className={"w-fit ml-auto"} onClick={handleSubscribe} disabled={isSubscribingPending}>{isSubscribingPending ? "Subscribing..." : "Subscribe"}</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
