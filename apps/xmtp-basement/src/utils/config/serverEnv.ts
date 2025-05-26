import { z } from 'zod';

const SERVER_ENV = {
  chainId: process.env.JUSTANAME_CHAIN_ID,
  poapApiKey: process.env.POAP_API_KEY,
  sepoliaProviderUrl: process.env.SEPOLIA_PROVIDER_URL,
  mainnetProviderUrl: process.env.MAINNET_PROVIDER_URL,
  dev: process.env.DEV === 'true',
  talentProtocolApiKey: process.env.TALENT_PROTOCOL_API_KEY,
  sessionSecret: process.env.SESSION_SECRET,
  nodeEnv: process.env.NODE_ENV,
}

export const serverEnvSchema = z.object({
  chainId: z.preprocess(
    (val) => {
      if (typeof val === 'string' && val !== '') return parseInt(val, 10);
      return val;
    },
    z.union([z.literal(1), z.literal(11155111)])
  ).default(11155111),
  poapApiKey: z.string(),
  sepoliaProviderUrl: z.string(),
  mainnetProviderUrl: z.string(),
  dev: z.boolean().default(false),
  talentProtocolApiKey: z.string(),
  sessionSecret: z.string(),
  nodeEnv: z.enum(['development', 'production', 'test']),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export const serverEnv: ServerEnv =serverEnvSchema.parse(SERVER_ENV);
