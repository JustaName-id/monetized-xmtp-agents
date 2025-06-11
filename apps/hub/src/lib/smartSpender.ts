import { serverEnv } from '@/utils/config/serverEnv';
import { createPublicClient, Hex, http } from 'viem';
import type { BundlerClient } from 'viem/account-abstraction';
import {
  createBundlerClient,
  createPaymasterClient,
  toCoinbaseSmartAccount,
} from 'viem/account-abstraction';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'wagmi/chains';

export const publicClient = createPublicClient({
  chain: serverEnv.serverBaseNetwork,
  transport: http(
    serverEnv.serverBaseNetwork === base
      ? 'https://base.drpc.org'
      : 'https://base-sepolia.drpc.org'
  ),
});

export const paymasterClient = createPaymasterClient({
  transport: http(serverEnv.basePaymasterUrl),
});

export async function getSpenderBundlerClient(): Promise<BundlerClient> {
  const spenderAccountOwner = privateKeyToAccount(serverEnv.spenderKey! as Hex);

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
