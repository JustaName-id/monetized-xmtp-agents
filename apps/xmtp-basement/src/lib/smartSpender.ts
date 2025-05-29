import { createPublicClient, Hex, http } from "viem";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import {
  createBundlerClient,
  createPaymasterClient,
  toCoinbaseSmartAccount,
} from "viem/account-abstraction";

import { type BundlerClient } from "viem/account-abstraction";
import {serverEnv} from "@/utils/config/serverEnv";

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

export const paymasterClient = createPaymasterClient({
  transport: http(serverEnv.basePaymasterUrl),
});

export async function getSpenderBundlerClient(): Promise<BundlerClient> {

  const spenderAccountOwner = privateKeyToAccount(
    process.env.SPENDER_PRIVATE_KEY! as Hex
  );

  const spenderAccount = await toCoinbaseSmartAccount({
    client: publicClient,
    owners: [spenderAccountOwner],
  });



  const spenderBundlerClient = createBundlerClient({
    account: spenderAccount,
    client: publicClient,
    paymaster: paymasterClient,
    transport: http(serverEnv.basePaymasterUrl),
  });

  return spenderBundlerClient;
}
