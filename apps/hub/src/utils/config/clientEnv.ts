import { z } from 'zod';
import { baseSepolia, base } from 'wagmi/chains';
import type { Chain } from 'wagmi/chains';

const CLIENT_ENV = {
  xmtpAgentEnsDomain: process.env.NEXT_PUBLIC_XMTP_AGENT_ENS_DOMAIN,
  onchainClientApiKey: process.env.NEXT_PUBLIC_ONCHAINKIT_CLIENT_API_KEY,
  onchainProjectName: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
  onchainWalletConfig: process.env.NEXT_PUBLIC_ONCHAINKIT_WALLET_CONFIG,
  userEnsDomain: process.env.NEXT_PUBLIC_USER_ENS_DOMAIN,
  baseNetwork: process.env.NEXT_PUBLIC_BASE_NETWORK === 'mainnet' ? base : baseSepolia,
  tokenAddress: process.env.NEXT_PUBLIC_TOKEN_ADDRESS,
};

export const clientEnvSchema = z.object({
  xmtpAgentEnsDomain: z.string(),
  onchainClientApiKey: z.string(),
  onchainProjectName: z.string(),
  onchainWalletConfig: z.enum(['smartWalletOnly', 'all']),
  userEnsDomain: z.string(),
  tokenAddress: z.string(),
  baseNetwork: z.custom<Chain>(
    (data) => data === base || data === baseSepolia,
    {
      message: 'baseNetwork must be an instance of base or baseSepolia',
    }
  ),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

export const clientEnv: ClientEnv = clientEnvSchema.parse(CLIENT_ENV);
