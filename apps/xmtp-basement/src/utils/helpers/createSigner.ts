import { Signer } from '@xmtp/browser-sdk';
import { toBytes } from 'viem';

export const createEOASigner = (
  address: `0x${string}`,
  signMessage: (message: string) => Promise<string> | string
): Signer => {
  return {
    type: 'EOA',
    getIdentifier: () => ({
      identifier: address.toLowerCase(),
      identifierKind: 'Ethereum',
    }),
    signMessage: async (message: string) => {
      const signature = await signMessage(message);
      return toBytes(signature);
    },
  };
};
