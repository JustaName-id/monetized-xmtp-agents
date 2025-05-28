"use client";

import { useXMTP } from "@/context/XMTPContext";
import { CursorInputIcon, WalletIcon } from "@/lib/icons";
import {
  Address,
  Avatar,
  EthBalance,
  Identity,
  Name,
} from "@coinbase/onchainkit/identity";
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
  WalletDropdownLink,
} from "@coinbase/onchainkit/wallet";
import { useEffect } from "react";
import { hexToUint8Array } from "uint8array-extras";
import { useAccount, useConnect, useSignMessage } from 'wagmi';
import { ClaimDialog } from "./ClaimDialog";
import { Button } from "./ui";
import { createEOASigner } from "@/utils/helpers/createSigner";
import { useLocalVariables } from "@/hooks/use-local";


export default function Connect() {
  const account = useAccount();
  const { connectors, connect } = useConnect();
  const { initialize } = useXMTP();
  const { signMessageAsync } = useSignMessage();

  const {
    encryptionKey,
  } = useLocalVariables();

  useEffect(() => {
    if (!account.address) {
      return;
    }
    void initialize({
      dbEncryptionKey: encryptionKey
        ? hexToUint8Array(encryptionKey)
        : undefined,
      env: "dev",
      loggingLevel: "debug",
      signer: createEOASigner(account.address, (message: string) =>
        signMessageAsync({ message }),
      ),
    });
  }, [account.address, signMessageAsync]);
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
                <ClaimDialog
                  trigger={
                    <div className="flex flex-row cursor-pointer bg-bg hover:bg-secondary items-center gap-2 px-4 py-3">
                      <CursorInputIcon width={16} height={16} />
                      <p className="text-primary font-normal">Claim Subname</p>
                    </div>
                  } />
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
