import { createPublicClient, Hex, http } from "viem";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import {
  createBundlerClient,
  createPaymasterClient,
  toCoinbaseSmartAccount,
} from "viem/account-abstraction";

import { type BundlerClient } from "viem/account-abstraction";

export async function getSpenderBundlerClient(): Promise<BundlerClient> {
  const client = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  const spenderAccountOwner = privateKeyToAccount(
    process.env.SPENDER_PRIVATE_KEY! as Hex
  );

  const spenderAccount = await toCoinbaseSmartAccount({
    client,
    owners: [spenderAccountOwner],
  });

  const paymasterClient = createPaymasterClient({
    transport: http(process.env.BASE_SEPOLIA_PAYMASTER_URL),
  });

  const spenderBundlerClient = createBundlerClient({
    account: spenderAccount,
    client,
    paymaster: paymasterClient,
    transport: http(process.env.BASE_SEPOLIA_PAYMASTER_URL),
  });

  return spenderBundlerClient;
}
