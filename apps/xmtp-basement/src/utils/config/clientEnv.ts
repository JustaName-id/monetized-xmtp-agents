import { z } from 'zod';

const CLIENT_ENV = {

  ensDomain: process.env.NEXT_PUBLIC_ENS_DOMAIN,
  onchainClientApiKey: process.env.NEXT_PUBLIC_ONCHAINKIT_CLIENT_API_KEY,
  onchainProjectName: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
  onchainWalletConfig: process.env.NEXT_PUBLIC_ONCHAINKIT_WALLET_CONFIG,
};

export const clientEnvSchema = z.object({
  ensDomain: z.string(),
  onchainClientApiKey: z.string(),
  onchainProjectName: z.string(),
  onchainWalletConfig: z.enum(["smartWalletOnly","all"]),
})

export type ClientEnv = z.infer<typeof clientEnvSchema>;

export const clientEnv: ClientEnv = clientEnvSchema.parse(CLIENT_ENV);
