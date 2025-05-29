"use client";

import { useXMTP } from "@/context/XMTPContext";
import { useLocalVariables } from "@/hooks/use-local";
import { CreditCardIcon, CursorInputIcon, LogoutIcon, WalletIcon } from "@/lib/icons";
import { clientEnv } from "@/utils/config/clientEnv";
import { createSCWSigner } from "@/utils/helpers/createSigner";
import { formatAddress } from "@/utils/helpers/formatAddress";
import { useAccountSubnames } from '@justaname.id/react';
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { hexToUint8Array } from "uint8array-extras";
import { useAccount, useConnect, useDisconnect, useSignMessage, useSwitchChain } from 'wagmi';
import { mainnet } from "wagmi/chains";
import { ClaimDialog } from "./ClaimDialog";
import {
  Avatar,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui";


export default function Connect() {
  const account = useAccount();
  const { connectors, connect, } = useConnect();
  const { disconnect } = useDisconnect();
  const { initialize } = useXMTP();
  const { signMessageAsync } = useSignMessage();
  const { accountSubnames } = useAccountSubnames();
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [tooltipText, setTooltipText] = useState("Copy");
  const { switchChainAsync } = useSwitchChain();


  const claimedSubname = useMemo(() =>
    accountSubnames.find(subname => subname.ens.endsWith(clientEnv.userEnsDomain))
    , [accountSubnames]);

  const {
    encryptionKey,
  } = useLocalVariables();

  useEffect(() => {
    if (!account.address) {
      return;
    }

    void switchChainAsync({ chainId: mainnet.id });
    void initialize({
      dbEncryptionKey: encryptionKey
        ? hexToUint8Array(encryptionKey)
        : undefined,
      env: "dev",
      loggingLevel: "debug",
      signer: createSCWSigner(account.address, (message: string) =>
        signMessageAsync({ message }),
      ),
    });
  }, [account.address, encryptionKey, initialize, signMessageAsync]);


  return (
    <div className="flex flex-col bg-background font-sans">
      <div className="flex justify-end">
        <div className="wallet-container">
          {account?.address ?
            <DropdownMenu>
              <DropdownMenuTrigger className="h-10 py-2 px-2 flex flex-row items-center gap-2 rounded-default bg-secondary">
                <WalletIcon />
                <p className="text-sm font-bold text-muted-foreground leading-[140%]">{claimedSubname?.ens ?? formatAddress(account.address)}</p>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <TooltipProvider delayDuration={200}>
                  <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
                    <TooltipTrigger
                      asChild
                      onClick={() => {
                        if (account.address) {
                          void navigator.clipboard.writeText(account.address);
                          setTooltipText("Copied!");
                          setTooltipOpen(true);
                          setTimeout(() => {
                            setTooltipText("Copy");
                            setTooltipOpen(false);
                          }, 2000);
                        }
                      }}
                    >
                      <div className="cursor-pointer py-1.5 px-2 gap-2 hover:bg-secondary flex flex-row items-center">
                        <Avatar className="w-10 h-10 rounded-full">
                          <AvatarImage src={claimedSubname?.sanitizedRecords.avatar} />
                        </Avatar>
                        <div className="flex flex-col gap-0.5">
                          <p className="text-popover-foreground font-semibold text-base">{claimedSubname?.ens ?? formatAddress(account.address)}</p>
                          {claimedSubname &&
                            <p className="text-muted-foreground font-normal text-sm">{formatAddress(account.address)}</p>
                          }
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent key={tooltipText} className="bg-muted-foreground p-1" side="bottom" align="center">
                      <p className="text-muted font-semibold text-xs">{tooltipText}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Separator />
                <DropdownMenuGroup>
                  <DropdownMenuItem className="cursor-pointer hover:bg-secondary">
                    <Link href="https://keys.coinbase.com" target="_blank" rel="noopener noreferrer" className="flex flex-row gap-2 items-center">
                      <CreditCardIcon />
                      <p className="text-popover-foreground font-normal text-base">Wallet</p>
                    </Link>
                  </DropdownMenuItem>
                  {!claimedSubname &&
                    <DropdownMenuItem className="cursor-pointer hover:bg-secondary">
                      <ClaimDialog
                        trigger={
                          <div className="flex flex-row cursor-pointer items-center gap-2 px-4 py-3">
                            <CursorInputIcon width={16} height={16} />
                            <p className="text-popover-foreground font-normal text-base">Claim Subname</p>
                          </div>
                        } />
                    </DropdownMenuItem>
                  }
                  <DropdownMenuItem className="cursor-pointer hover:bg-secondary" onClick={() => disconnect()}>
                    <LogoutIcon />
                    <p className="text-popover-foreground font-semibold text-base">Sign Out</p>
                  </DropdownMenuItem>

                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            :
            <Button variant={"default"} onClick={() => connect({
              connector: connectors[0]
            })}>
              Connect Wallet
            </Button>
          }
        </div>
      </div>
    </div>
  );
}
