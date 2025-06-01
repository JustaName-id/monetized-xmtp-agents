'use client';

import { MyAgentCard } from '@/components/MyAgentCard';
import { useSubscription } from '@/query/subscription';
import { useMemo } from 'react';
import {useAccount} from "wagmi";

export default function Index() {
  const { isConnected} = useAccount()
  const { subscriptions, isSubscriptionsPending } = useSubscription();
  const agentAddresses = useMemo(() => {
    if (!subscriptions) return [];
    return Array.from(
      new Set(
        subscriptions.subscriptions.map(
          (subscription) => subscription.spendPermission.spender
        )
      )
    );
  }, [subscriptions]);

  return (
    <div className="wrapper">
      <div className="chat-container flex flex-col gap-6">
        <h1 className="text-3xl font-normal text-primary leading-[100%]">
          Your Agents
        </h1>
        {!isConnected && <div>Please connect your wallet</div>}
        {isSubscriptionsPending ? (
          <div>Loading...</div>
        ) : agentAddresses.length === 0 ? (
          <div>No agents found</div>
        ) : (
          agentAddresses.map((address) => (
            <MyAgentCard key={address} address={address} />
          ))
        )}
      </div>
    </div>
  );
}
