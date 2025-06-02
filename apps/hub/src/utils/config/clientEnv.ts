import { z } from 'zod';
import { baseSepolia, base } from 'wagmi/chains';
import type { Chain } from 'wagmi/chains';

const CLIENT_ENV = {
  xmtpAgentEnsDomain: process.env.NEXT_PUBLIC_XMTP_AGENT_ENS_DOMAIN,
  onchainClientApiKey: process.env.NEXT_PUBLIC_ONCHAINKIT_CLIENT_API_KEY,
  onchainProjectName: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
  onchainWalletConfig: process.env.NEXT_PUBLIC_ONCHAINKIT_WALLET_CONFIG,
  userEnsDomain: process.env.NEXT_PUBLIC_USER_ENS_DOMAIN,
  env: process.env.NEXT_PUBLIC_ENV,
  baseNetwork:
    process.env.NEXT_PUBLIC_ENV === 'production' ? base : baseSepolia,
};

export const clientEnvSchema = z.object({
  xmtpAgentEnsDomain: z.string(),
  onchainClientApiKey: z.string(),
  onchainProjectName: z.string(),
  onchainWalletConfig: z.enum(['smartWalletOnly', 'all']),
  userEnsDomain: z.string(),
  env: z.enum(['dev', 'staging', 'production']),
  baseNetwork: z.custom<Chain>(
    (data) => data === base || data === baseSepolia,
    {
      message: 'baseNetwork must be an instance of base or baseSepolia',
    }
  ),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

export const clientEnv: ClientEnv = clientEnvSchema.parse(CLIENT_ENV);
