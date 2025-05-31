import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UseDisappearingMessagesResult } from '../../types';
import {useXmtp} from "../useXmtp";
import {useConversation} from "../conversations/useConversation";
import {xmtpKeys} from "../../utils/queryKeys";
import {ensureConnected, ensureConversation} from "../../utils/helpers";
import {MessageDisappearingSettings} from "@xmtp/browser-sdk";

/**
 * Hook to manage disappearing message settings
 * @param conversationId The conversation ID
 * @returns Disappearing message settings and functions to update them
 * @example
 * ```tsx
 * const {
 *   settings,
 *   isEnabled,
 *   updateSettings,
 *   removeSettings,
 *   isLoading,
 *   isUpdating
 * } = useDisappearingMessages('conversation-id');
 *
 * // Enable disappearing messages (messages disappear after 24 hours)
 * const handleEnableDisappearing = async () => {
 *   // fromNs: 0 (messages disappear from the beginning)
 *   // inNs: 24 hours in nanoseconds
 *   await updateSettings(BigInt(0), BigInt(24 * 60 * 60 * 1000 * 1000 * 1000));
 * };
 *
 * // Disable disappearing messages
 * const handleDisableDisappearing = async () => {
 *   await removeSettings();
 * };
 *
 * return (
 *   <div>
 *     <div>Disappearing messages: {isEnabled ? 'Enabled' : 'Disabled'}</div>
 *     <button onClick={handleEnableDisappearing} disabled={isUpdating}>
 *       Enable
 *     </button>
 *     <button onClick={handleDisableDisappearing} disabled={isUpdating}>
 *       Disable
 *     </button>
 *   </div>
 * );
 * ```
 */
export const useDisappearingMessages = (
  conversationId: string
): UseDisappearingMessagesResult => {
  const { client } = useXmtp();
  const { conversation } = useConversation(conversationId);
  const queryClient = useQueryClient();

  // Query for disappearing message settings
  const {
    data: settings = null,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: xmtpKeys.messageDisappearingSettings(conversationId),
    queryFn: async () => {
      ensureConnected(client);
      ensureConversation(conversation);

      // Get the disappearing message settings
      return await conversation.messageDisappearingSettings();
    },
    enabled: !!client && !!conversation,
  });

  const {
    data: isEnabled = null,
    isLoading: isEnabledLoading,
    error: queryEnabledError
  } = useQuery({
    queryKey: xmtpKeys.messageDisappearingSettingsState(conversationId),
    queryFn: async () => {
      ensureConnected(client);
      ensureConversation(conversation);

      return await conversation.isMessageDisappearingEnabled();
    },
    enabled: !!client && !!conversation && !!settings,
  })

  // Mutation for updating disappearing message settings
  const updateSettingsMutation = useMutation({
    mutationFn: async ({
      fromNs,
      inNs
    }: {
      fromNs: bigint;
      inNs: bigint
    }) => {
      ensureConnected(client);
      ensureConversation(conversation);

      // Update the disappearing message settings
      await conversation.updateMessageDisappearingSettings(fromNs, inNs);
    },
    onSuccess: () => {
      // Invalidate the disappearing message settings query
      queryClient.invalidateQueries({
        queryKey: xmtpKeys.messageDisappearingSettings(conversationId)
      });
    },
  });

  // Mutation for removing disappearing message settings
  const removeSettingsMutation = useMutation({
    mutationFn: async () => {
      ensureConnected(client);
      ensureConversation(conversation);

      // Remove the disappearing message settings
      await conversation.removeMessageDisappearingSettings();
    },
    onSuccess: () => {
      // Invalidate the disappearing message settings query
      queryClient.invalidateQueries({
        queryKey: xmtpKeys.messageDisappearingSettings(conversationId)
      });
    },
  });

  // Function to update disappearing message settings
  const updateSettings = async (fromNs: bigint, inNs: bigint): Promise<void> => {
    await updateSettingsMutation.mutateAsync({ fromNs, inNs });
  };

  // Function to remove disappearing message settings
  const removeSettings = async (): Promise<void> => {
    await removeSettingsMutation.mutateAsync();
  };
  // Determine if any mutation is in progress
  const isUpdating = updateSettingsMutation.isPending || removeSettingsMutation.isPending;

  // Combine errors from all mutations
  const mutationError = updateSettingsMutation.error || removeSettingsMutation.error;
  const error = queryError || mutationError || null;

  return {
    settings: settings as unknown as  MessageDisappearingSettings | null,
    isEnabled,
    isLoading,
    isEnabledLoading,
    queryEnabledError,
    error: error as Error | null,
    updateSettings,
    removeSettings,
    isUpdating,
  };
};
