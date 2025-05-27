"use client";

import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownLink,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import {
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance,
} from "@coinbase/onchainkit/identity";
import { useAccount, useConnect } from 'wagmi';
import { Button } from "./ui";
import { WalletIcon } from "@/lib/icons";

export default function Connect() {
  const account = useAccount();
  const { connectors, connect } = useConnect();
  return (
    <div className="flex flex-col bg-background font-sans">
      <div className="flex justify-end">
        <div className="wallet-container">
          {account?.address ? (
            <Wallet>
              <ConnectWallet className="py-2 px-4 bg-secondary hover:bg-secondary/50 active:bg-secondary/50">
                <WalletIcon />
                <Name className="text-muted" />
              </ConnectWallet>
              <WalletDropdown>
                <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                  <Avatar />
                  <Name />
                  <Address />
                  <EthBalance />
                </Identity>
                <WalletDropdownLink
                  icon="wallet"
                  href="https://keys.coinbase.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Wallet
                </WalletDropdownLink>
                <WalletDropdownDisconnect />
              </WalletDropdown>
            </Wallet>)
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
