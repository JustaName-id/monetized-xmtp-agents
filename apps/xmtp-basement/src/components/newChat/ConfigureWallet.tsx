
import { UsdcIcon } from "@/lib/icons"
import { Button } from "../ui"
import React from "react";
import { useWriteContracts} from 'wagmi/experimental';
import { useAccount } from 'wagmi'
import {coinbaseSmartWalletAbi} from "@/lib/abi/CoinbaseSmartWallet";
import {spendPermissionManagerAddress} from "@xmtpbasement/spend-permission";

export const ConfigureWallet: React.FC = () => {


  const { address } = useAccount()
  const { writeContractsAsync } = useWriteContracts()
  if(!address) return (
    <div>
      Connect Wallet
    </div>
  )

  return (
    <div className="flex flex-row p-4 gap-2.5 rounded-sm bg-primary-foreground items-center">
      <div className="flex flex-col gap-2.5">
        <p className="text-muted-foreground font-normal text-xl leading-[100%]">Claim your Identity</p>
        <p className="text-muted-foreground font-normal text-base leading-[150%]">Lorem ipsum dolor sit amet consectetur. Nisi nisl at volutpat maecenas ornare feugiat pharetra. Sed odio tellus maecenas porta elementum. </p>
      </div>
      <div className="flex flex-col gap-1.5 items-end">
        <Button variant="default" className={"w-full"} onClick={() => {
          writeContractsAsync({
            contracts:[{
              abi: coinbaseSmartWalletAbi,
              address: address,
              functionName: 'addOwnerAddress',
              args: [
                spendPermissionManagerAddress
              ],

            }],
            capabilities: {
              paymasterService: {
                url: '/api/paymaster'
              }
            }
          })

        }}>Configure Wallet</Button>
        <div className="flex flex-row gap-[5px] items-center">
          <UsdcIcon width={14} height={14} />
          <p className="text-base-blue-600 font-bold text-xs leading-[133%] whitespace-nowrap">{`${0.04} USDC/MSG`}</p>
        </div>
      </div>
    </div>
  )
}
