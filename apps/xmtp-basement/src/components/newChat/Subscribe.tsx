import { UsdcIcon } from "@/lib/icons"
import { Button } from "../ui"
import {useSubscription} from "@/query/subscription";
import React from "react";
import {Address} from "viem";

export interface SubscribeProps {
  spender: string;
  fees: string
}

export const Subscribe: React.FC<SubscribeProps> = ({
  spender,
  fees
                                                    }) => {

    const { mutateAsync } = useSubscription()
    return (
        <div className="flex flex-row p-4 gap-2.5 rounded-sm bg-primary-foreground items-center">
            <div className="flex flex-col gap-2.5">
                <p className="text-muted font-normal text-xl leading-[100%]">Claim your Identity</p>
                <p className="text-muted font-normal text-base leading-[150%]">Lorem ipsum dolor sit amet consectetur. Nisi nisl at volutpat maecenas ornare feugiat pharetra. Sed odio tellus maecenas porta elementum. </p>
            </div>
            <div className="flex flex-col gap-1.5 items-end">
                <Button variant="default" onClick={() => {
                  mutateAsync({
                    spenderAddress: spender as Address,
                    fees: fees
                  })

                }}>Subscribe</Button>
                <div className="flex flex-row gap-[5px] items-center">
                    <UsdcIcon width={14} height={14} />
                    <p className="text-blue font-bold text-xs leading-[133%]">{`${0.04} USDC/MSG`}</p>
                </div>
            </div>
        </div>
    )
}
