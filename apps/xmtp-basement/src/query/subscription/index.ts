import {
  useAccount,
  useChainId,
  useConnect,
  useConnectors,
  useSignTypedData,
} from "wagmi";
import { Address, Hex, parseUnits } from "viem";
import { useMutation } from "@tanstack/react-query";
import { spendPermissionManagerAddress } from "@/lib/abi/SpendPermissionManager";

interface SpendPermission {
  account: Address;
  spender: Address;
  token: Address;
  allowance: bigint;
  period: number;
  start: number;
  end: number;
  salt: bigint;
  extraData: Hex;
}

interface SubscriptionResult {
  signature: Hex;
  spendPermission: SpendPermission;
}

export function useSubscription() {
  const { signTypedDataAsync } = useSignTypedData();
  const account = useAccount();
  const chainId = useChainId();
  const { connectAsync } = useConnect();
  const connectors = useConnectors();

  return useMutation({
    mutationFn: async (spenderAddress: Address): Promise<SubscriptionResult> => {
      let accountAddress = account?.address;

      if (!accountAddress) {
        const requestAccounts = await connectAsync({
          connector: connectors[0],
        });
        accountAddress = requestAccounts.accounts[0];
      }

      const spendPermission: SpendPermission = {
        account: accountAddress,
        spender: spenderAddress,
        token: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as Address, // ETH
        allowance: parseUnits("0.01", 18),
        period: 86400, // seconds in a day
        start: Math.ceil(Date.now() / 1000), // unix timestamp
        end: Math.ceil(Date.now() / 1000) + 7 * 86400, // 7 days from now
        salt: BigInt(0),
        extraData: "0x" as Hex,
      };

      const signature = await signTypedDataAsync({
        domain: {
          name: "Spend Permission Manager",
          version: "1",
          chainId: chainId,
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

      return { signature, spendPermission };
    },
  });
}
