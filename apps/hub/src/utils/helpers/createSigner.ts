import { Signer } from '@xmtp/browser-sdk';
import { toBytes } from 'viem';

export const createSCWSigner = (
  address: `0x${string}`,
  signMessage: (message: string) => Promise<string> | string,
  chainId = 1
): Signer => {
  return {
    type: 'SCW',
    getIdentifier: () => ({
      identifier: address.toLowerCase(),
      identifierKind: 'Ethereum',
    }),
    signMessage: async (message: string) => {
      const signature = await signMessage(message);
      const signatureBytes = toBytes(signature);
      return signatureBytes;
    },
    getChainId: () => BigInt(chainId),
  };
};
