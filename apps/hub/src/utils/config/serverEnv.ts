import { z } from 'zod';
import { baseSepolia, base } from 'wagmi/chains';
import type { Chain } from 'wagmi/chains';

const SERVER_ENV = {
  xmtpAgentEnsDomain: process.env.XMTP_AGENT_ENS_DOMAIN,
  userEnsDomain: process.env.USER_ENS_DOMAIN,
  xmtpAgentJustaNameApiKey: process.env.XMTP_AGENT_JUSTANAME_API_KEY,
  userJustaNameApiKey: process.env.USER_JUSTANAME_API_KEY,
  basePaymasterUrl: process.env.BASE_PAYMASTER_URL,
  serverBaseNetwork: process.env.BASE_NETWORK === 'mainnet' ? base : baseSepolia,
};

export const serverEnvSchema = z.object({
  xmtpAgentEnsDomain: z.string(),
  userEnsDomain: z.string(),
  xmtpAgentJustaNameApiKey: z.string(),
  userJustaNameApiKey: z.string(),
  basePaymasterUrl: z.string(),
  serverBaseNetwork: z.custom<Chain>(
    (data) => data === base || data === baseSepolia,
    {
      message: 'serverBaseNetwork must be an instance of base or baseSepolia',
    }
  ),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export const serverEnv: ServerEnv = serverEnvSchema.parse(SERVER_ENV);
