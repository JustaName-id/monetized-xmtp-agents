'use client'
import { MessageCard } from "@/components/MessageCard";
import { MessageTextField } from "@/components/MessageTextField";
import { AgentCard } from "@/components/newChat/AgentCard";
import { ClaimIdentity } from "@/components/newChat/ClaimIdentity";
import { ConnectWallet } from "@/components/newChat/ConnectWallet";
import { Subscribe } from "@/components/newChat/Subscribe";
import { useAccountSubnames } from '@justaname.id/react';
import { useMemo } from "react";
import { useAccount } from 'wagmi';

const dummyAgent = {
    name: "Agent 1",
    avatar: "https://i.pravatar.cc/300?img=1",
    description: "This is a description",
    tags: ["Tag 1", "Tag 2", "Tag 3"]
}

export default function Index() {
    const account = useAccount();
    const { accountSubnames } = useAccountSubnames();

    const isWalletConnected = useMemo(() => account.isConnected, [account.isConnected]);
    const isSubnameClaimed = useMemo(() => accountSubnames.length > 0, [accountSubnames]);

    const isSubscribed = useMemo(() => {
        return true;
    }, []);

    return (
        <div className="wrapper h-full">
            <div className="container flex flex-col h-full justify-between gap-5">
                <AgentCard {...dummyAgent} />
                <div className="flex flex-col gap-4 flex-1">
                    <MessageCard message="Hi, how can I help you today?" isSender={false} />
                    <MessageCard message="Hey, I'm having trouble with my account." isSender={true} />
                    <MessageCard message="What seems to be the problem?" isSender={false} />
                    <MessageCard message="I'm not able to log in to my account." isSender={true} />
                </div>
                {!isWalletConnected ? <ConnectWallet /> : isSubnameClaimed ? <ClaimIdentity /> : isSubscribed ? <MessageTextField amountSpent={12.46} /> : <Subscribe />}
            </div>
        </div>
    );
}
