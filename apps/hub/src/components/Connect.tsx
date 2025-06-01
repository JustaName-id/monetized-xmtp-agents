"use client";

import { CreditCardIcon, CursorInputIcon, LogoutIcon, WalletIcon } from "@/lib/icons";
import { clientEnv } from "@/utils/config/clientEnv";
import { formatAddress } from "@/utils/helpers/formatAddress";
import { useAccountSubnames } from '@justaname.id/react';
import Link from "next/link";
import { useMemo, useState } from "react";
import { useAccount, useConnect, useDisconnect } from 'wagmi';
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
import {useChatBased} from "@/providers/ChatBasedProvider";


export default function Connect() {
  const account = useAccount();
  const { connectors, connect: connectWallet } = useConnect();
  const { disconnect } = useDisconnect();
  const { handleOpenClaim } = useChatBased()
  const { accountSubnames } = useAccountSubnames();
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [tooltipText, setTooltipText] = useState("Copy");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);


  const claimedSubname = useMemo(() =>
    accountSubnames.find(subname => subname.ens.endsWith(clientEnv.userEnsDomain))
    , [accountSubnames]);

  return (
    <div className="flex flex-col bg-background font-sans">
      <div className="flex justify-end h-full">
          {account?.address ?
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
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
                    <DropdownMenuItem
                      className="cursor-pointer hover:bg-secondary"
                      onSelect={(event) => {
                        event.preventDefault();
                        setIsDropdownOpen(false);
                        handleOpenClaim(true);
                      }}
                    >
                      <div className="flex flex-row cursor-pointer items-center gap-2" >
                        <CursorInputIcon width={16} height={16} />
                        <p className="text-popover-foreground font-normal text-base">Claim Subname</p>
                      </div>
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
            <Button variant={"default"} onClick={() => connectWallet({
              connector: connectors[0]
            })} className={"h-full"}>
              Connect Wallet
            </Button>
          }
      </div>
    </div>
  );
}
