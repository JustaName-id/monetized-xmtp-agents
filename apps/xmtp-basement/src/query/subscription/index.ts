import {
  useAccount,
  useConnect,
  useConnectors,
  useSignTypedData, useSwitchChain,
} from "wagmi";
import { Address, Hex, parseUnits } from "viem";
import { useMutation } from "@tanstack/react-query";
import {spendPermissionManagerAddress} from "@xmtpbasement/spend-permission";
import axios from 'axios'
import {SpendPermission} from "@/types";
import {baseSepolia} from "wagmi/chains";



interface SubscriptionResult {
  status: "success" | "failure";
  transactionHash: string;
  transactionUrl: string;
}

export function useSubscription() {
  const { signTypedDataAsync } = useSignTypedData();
  const { switchChain } = useSwitchChain();

  const account = useAccount();
  const { connectAsync } = useConnect();
  const connectors = useConnectors();

  return useMutation({
    mutationFn: async (variables: { spenderAddress: Address; fees: string }): Promise<SubscriptionResult> => {
      const { spenderAddress, fees } = variables;
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
        allowance: parseUnits(fees, 6),
        period: 86400,
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
      return response.data
    },
  });
}
