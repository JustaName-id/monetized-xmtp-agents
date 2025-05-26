"use client";

import {
  ConnectWallet,
  ConnectWalletText,
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

export default function Connect() {
  const account = useAccount();
  const { connectors, connect } = useConnect();
  return (
    <div className="flex flex-col bg-background font-sans">
      <header className="absolute top-4 right-4">
        <div className="flex justify-end">
          <div className="wallet-container">
            {account?.address ? (
              <Wallet>
                <ConnectWallet>
                  <ConnectWalletText>Sign up / log in</ConnectWalletText>
                  <Avatar className="h-6 w-6" />
                  <Name className="text-white" />
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
              <button onClick={() => connect({
                connector: connectors[0]
              })}>
                Sign up / Login
              </button>
            }
          </div>
        </div>
      </header>
    </div>
  );
}
