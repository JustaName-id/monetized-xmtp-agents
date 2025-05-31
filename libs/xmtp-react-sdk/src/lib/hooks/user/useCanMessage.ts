import { useQuery } from '@tanstack/react-query';
import { Identifier } from '@xmtp/browser-sdk';
import {UseCanMessageResult} from "../../types";
import {useXmtp} from "../useXmtp";
import {xmtpKeys} from "../../utils/queryKeys";
import {ensureConnected} from "../../utils/helpers";

/**
 * Hook to check if users can be messaged on XMTP
 * @param identifiers Array of identifiers to check
 * @returns Map of identifiers to whether they can be messaged
 * @example
 * ```tsx
 * const { canMessage, isLoading } = useCanMessage([
 *   { identifier: '0x123...', identifierKind: 'Ethereum' },
 *   { identifier: '0x456...', identifierKind: 'Ethereum' }
 * ]);
 *
 * if (isLoading) return <Spinner />;
 *
 * return (
 *   <div>
 *     {identifiers.map(id => (
 *       <div key={id.identifier}>
 *         {id.identifier}: {canMessage.get(id.identifier) ? 'Can message' : 'Cannot message'}
 *       </div>
 *     ))}
 *   </div>
 * );
 * ```
 */
export const useCanMessage = (
  identifiers: Identifier[]
): UseCanMessageResult => {
  const { client } = useXmtp();

  const {
    data: canMessage = new Map(),
    isLoading,
    error,
  } = useQuery({
    queryKey: [...xmtpKeys.canMessage(), identifiers],
    queryFn: async () => {
      ensureConnected(client);

      // Check if the identifiers can be messaged
      const results = await client.canMessage(identifiers);

      return results;
    },
    enabled: !!client && identifiers.length > 0,
  });

  return {
    canMessage,
    isLoading,
    error: error as Error | null,
  };
};
