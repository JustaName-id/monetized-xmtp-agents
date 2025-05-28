import { z } from 'zod';

const CLIENT_ENV = {
  xmtpAgentEnsDomain: process.env.NEXT_PUBLIC_XMTP_AGENT_ENS_DOMAIN,
  onchainClientApiKey: process.env.NEXT_PUBLIC_ONCHAINKIT_CLIENT_API_KEY,
  onchainProjectName: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
  onchainWalletConfig: process.env.NEXT_PUBLIC_ONCHAINKIT_WALLET_CONFIG,
  userEnsDomain: process.env.NEXT_PUBLIC_USER_ENS_DOMAIN,
};

export const clientEnvSchema = z.object({
  xmtpAgentEnsDomain: z.string(),
  onchainClientApiKey: z.string(),
  onchainProjectName: z.string(),
  onchainWalletConfig: z.enum(['smartWalletOnly', 'all']),
  userEnsDomain: z.string(),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

export const clientEnv: ClientEnv = clientEnvSchema.parse(CLIENT_ENV);
