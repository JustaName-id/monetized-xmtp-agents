import {
  useAccount,
  useConnect,
  useConnectors,
  useSignTypedData,
  useSwitchChain,
} from "wagmi";
import { Address, Hex, parseUnits } from "viem";
import { useMutation, useQuery } from "@tanstack/react-query";
import {spendPermissionManagerAddress, SubscriptionsResponse} from "@agenthub/spend-permission";
import axios from 'axios'
import {SpendPermission} from "@/types";
import {baseSepolia} from "wagmi/chains";
import {useMemo} from "react";

interface SubscriptionResult {
  status: "success" | "failure";
  transactionHash: string;
  transactionUrl: string;
}

const buildSubscriptionKey = (address: Address | undefined) => {
  return ['subscription', address] as const;
};

export function useSubscription() {
  const { signTypedDataAsync } = useSignTypedData();
  const { switchChain } = useSwitchChain();

  const account = useAccount();
  const { connectAsync } = useConnect();
  const connectors = useConnectors();

  const { data: subscriptions, refetch, isPending: isSubscriptionsPending, isLoading: isSubscriptionsLoading } = useQuery({
    queryKey: buildSubscriptionKey(account.address),
    queryFn: async () => {
      return axios.get<SubscriptionsResponse>("/api/subscriptions?account=" + account.address).then(res => res.data);
    },
    enabled: !!account.address,
  })

  const validSubscriptions = useMemo(() => {
    return subscriptions?.subscriptions.filter(subscription => subscription.isValid);
  }, [subscriptions])

  const { mutateAsync: subscribe, isPending: isSubscribingPending} = useMutation({
    mutationFn: async (variables: { spenderAddress: Address; allowance: string }): Promise<SubscriptionResult> => {
      const { spenderAddress, allowance } = variables;
      let accountAddress = account?.address;

      if (!accountAddress) {
        const requestAccounts = await connectAsync({
          connector: connectors[0],
        });
        accountAddress = requestAccounts.accounts[0];
      }

      switchChain({ chainId: baseSepolia.id });
      const spendPermission: SpendPermission = {
        account: accountAddress,
        spender: spenderAddress,
        token: "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as Address, // ETH
        allowance: parseUnits(allowance, 6),
        period: 86400*30,
        start: Math.ceil(Date.now() / 1000),
        end: Math.ceil(Date.now() / 1000) + 7 * 86400,
        salt: BigInt(0),
        extraData: "0x" as Hex,
      };

      const signature = await signTypedDataAsync({
        domain: {
          name: "Spend Permission Manager",
          version: "1",
          chainId: baseSepolia.id,
          verifyingContract: spendPermissionManagerAddress,
        },
        types: {
          SpendPermission: [
            { name: "account", type: "address" },
            { name: "spender", type: "address" },
            { name: "token", type: "address" },
            { name: "allowance", type: "uint160" },
            { name: "period", type: "uint48" },
            { name: "start", type: "uint48" },
            { name: "end", type: "uint48" },
            { name: "salt", type: "uint256" },
            { name: "extraData", type: "bytes" },
          ],
        },
        primaryType: "SpendPermission",
        message: spendPermission,
      });


      const replacer = (key: string, value: any) => {
        if (typeof value === "bigint") {
          return value.toString();
        }
        return value;
      };

      const spendPermissionSanitized = JSON.parse(
        JSON.stringify(spendPermission, replacer)
      );

      const response = await axios.post<SubscriptionResult>("/api/subscriptions/create", { spendPermission: spendPermissionSanitized, signature });
      refetch();
      return response.data
    },
  });

  return {
    subscribe,
    subscriptions,
    validSubscriptions,
    isSubscribingPending,
    isSubscriptionsPending,
    isSubscriptionsLoading,
  }
}
