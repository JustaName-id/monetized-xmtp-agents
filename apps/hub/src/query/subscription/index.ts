import { SpendPermission } from '@/types';
import { clientEnv } from '@/utils/config/clientEnv';
import {
  spendPermissionManagerAddress,
  SubscriptionsResponse,
} from '@agenthub/spend-permission';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useMemo } from 'react';
import { Address, Hex, parseUnits } from 'viem';
import {
  useAccount,
  useConnect,
  useConnectors,
  useSignTypedData,
  useSwitchChain,
} from 'wagmi';

interface SubscriptionResult {
  status: 'success' | 'failure';
  transactionHash: string;
  transactionUrl: string;
}

const buildSubscriptionKey = (address: Address | undefined) => {
  return ['subscription', address] as const;
};

export function useSubscription() {
  const { signTypedDataAsync } = useSignTypedData();
  const { switchChainAsync } = useSwitchChain();

  const account = useAccount();
  const { connectAsync } = useConnect();
  const connectors = useConnectors();

  const {
    data: subscriptions,
    refetch,
    isPending: isSubscriptionsPending,
    isLoading: isSubscriptionsLoading,
  } = useQuery({
    queryKey: buildSubscriptionKey(account.address),
    queryFn: async () => {
      return axios
        .get<SubscriptionsResponse>(
          '/api/subscriptions?account=' + account.address
        )
        .then((res) => res.data);
    },
    enabled: !!account.address,
  });

  const validSubscriptions = useMemo(() => {
    return subscriptions?.subscriptions.filter(
      (subscription) => subscription.isValid
    );
  }, [subscriptions]);

  const { mutateAsync: subscribe, isPending: isSubscribingPending } =
    useMutation({
      mutationFn: async (variables: {
        spenderAddress: Address;
        allowance: string;
      }): Promise<SubscriptionResult> => {
        const { spenderAddress, allowance } = variables;
        let accountAddress = account?.address;

        if (!accountAddress) {
          const requestAccounts = await connectAsync({
            connector: connectors[0],
          });
          accountAddress = requestAccounts.accounts[0];
        }

        await switchChainAsync({ chainId: clientEnv.baseNetwork.id as 1 | 8453 | 84532 });
        const spendPermission: SpendPermission = {
          account: accountAddress,
          spender: spenderAddress,
          token: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as Address, // ETH
          allowance: parseUnits(allowance, 6),
          period: 86400 * 30,
          start: Math.ceil(Date.now() / 1000),
          end: Math.ceil(Date.now() / 1000) + 7 * 86400,
          salt: BigInt(0),
          extraData: '0x' as Hex,
        };

        const signature = await signTypedDataAsync({
          domain: {
            name: 'Spend Permission Manager',
            version: '1',
            chainId: clientEnv.baseNetwork.id,
            verifyingContract: spendPermissionManagerAddress,
          },
          types: {
            SpendPermission: [
              { name: 'account', type: 'address' },
              { name: 'spender', type: 'address' },
              { name: 'token', type: 'address' },
              { name: 'allowance', type: 'uint160' },
              { name: 'period', type: 'uint48' },
              { name: 'start', type: 'uint48' },
              { name: 'end', type: 'uint48' },
              { name: 'salt', type: 'uint256' },
              { name: 'extraData', type: 'bytes' },
            ],
          },
          primaryType: 'SpendPermission',
          message: spendPermission,
        });

        await switchChainAsync({ chainId: 1 });
        const replacer = (key: string, value: any) => {
          if (typeof value === 'bigint') {
            return value.toString();
          }
          return value;
        };

        const spendPermissionSanitized = JSON.parse(
          JSON.stringify(spendPermission, replacer)
        );

        const response = await axios.post<SubscriptionResult>(
          '/api/subscriptions/create',
          { spendPermission: spendPermissionSanitized, signature }
        );
        refetch();
        return response.data;
      },
      onSuccess: () => {
        refetch();
      },
    });

  return {
    subscribe,
    refetch,
    subscriptions,
    validSubscriptions,
    isSubscribingPending,
    isSubscriptionsPending,
    isSubscriptionsLoading,
  };
}
