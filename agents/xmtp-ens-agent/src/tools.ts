import { z } from 'zod';
import {JustaName} from "@justaname.id/sdk";
import { tool } from 'ai';
import {getFollowers, getFollowing, getFollowState, getStats} from "./utils/efp.js";

export const efpFollowers = tool({
  description: 'Get EFP followers response',
  parameters: z.object({
    addressOrEns: z.string(),
    limit: z.number().default(10),
    offset: z.number().default(0),
  }),
  execute: async ({addressOrEns, limit, offset}) => {
    return await getFollowers(addressOrEns, limit, offset);
  },
})
export const efpFollowing = tool({
  description: 'Get EFP following response',
  parameters: z.object({
    addressOrEns: z.string(),
    limit: z.number().default(10),
    offset: z.number().default(0),
  }),
  execute: async ({addressOrEns, limit, offset}) => {
    return await getFollowing(addressOrEns, limit, offset);
  },
})
export const efpStats = tool({
  description: 'Get EFP stats response',
  parameters: z.object({
    addressOrEns: z.string(),
  }),
  execute: async ({addressOrEns}) => {
    return await getStats(addressOrEns);
  },
})
export const efpFollowState = tool({
  description: 'Get EFP follow state response',
  parameters: z.object({
    addressOrEns1: z.string(),
    addressOrEns2: z.string(),
  }),
  execute: async ({addressOrEns1, addressOrEns2}) => {
    return await getFollowState(addressOrEns1, addressOrEns2);
  },
})

export   const ensRecordTool = tool({
  description: 'Fetch ENS records',
  parameters: z.object({
    ens: z.string(),
  }),
  execute: async ({ens}) => {
    return await JustaName.init(
      {
        networks: [
          {
            chainId:1,
            providerUrl: 'https://eth.drpc.org'
          }
        ]
      }).subnames.getRecords({ens, chainId: 1});
  },
})

export const tools = {
  efpFollowers,
  efpFollowing,
  efpStats,
  efpFollowState,
  ensRecordTool,
}
