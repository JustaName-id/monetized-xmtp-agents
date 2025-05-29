import { z } from 'zod';

const SERVER_ENV = {
  xmtpAgentEnsDomain: process.env.XMTP_AGENT_ENS_DOMAIN,
  userEnsDomain: process.env.USER_ENS_DOMAIN,
  xmtpAgentJustaNameApiKey: process.env.XMTP_AGENT_JUSTANAME_API_KEY,
  userJustaNameApiKey: process.env.USER_JUSTANAME_API_KEY,
  basePaymasterUrl: process.env.BASE_PAYMASTER_URL
}

export const serverEnvSchema = z.object({
  xmtpAgentEnsDomain: z.string(),
  userEnsDomain: z.string(),
  xmtpAgentJustaNameApiKey: z.string(),
  userJustaNameApiKey: z.string(),
  basePaymasterUrl: z.string()
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export const serverEnv: ServerEnv =serverEnvSchema.parse(SERVER_ENV);
