import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  GroupPermissions,
  MetadataField,
  PermissionPolicy,
  PermissionUpdateType
} from '@xmtp/browser-sdk';
import {UseGroupPermissionsResult} from "../../types";
import {useXmtp} from "../useXmtp";
import {useConversation} from "../conversations/useConversation";
import {xmtpKeys} from "../../utils/queryKeys";
import {ensureConnected, ensureConversation, isGroup} from "../../utils/helpers";
/**
 * Hook to manage group permissions
 * @param conversationId The group conversation ID
 * @returns Group permissions and functions to update them
 * @example
 * ```tsx
 * const {
 *   permissions,
 *   updatePermission,
 *   isLoading,
 *   isUpdating
 * } = useGroupPermissions('group-id');
 *
 * // Update a permission
 * const handleUpdatePermission = async () => {
 *   // Allow anyone to add members
 *   await updatePermission(
 *     'AddMembers',
 *     'Anyone'
 *   );
 *
 *   // Only admins can update the group name
 *   await updatePermission(
 *     'UpdateMetadata',
 *     'Admins',
 *     'Name'
 *   );
 * };
 * ```
 */
export const useGroupPermissions = (
  conversationId: string
): UseGroupPermissionsResult => {
  const { client } = useXmtp();
  const { conversation } = useConversation(conversationId);
  const queryClient = useQueryClient();

  // Query for group permissions
  const {
    data: permissions,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: xmtpKeys.permissions(conversationId),
    queryFn: async () => {
      ensureConnected(client);
      ensureConversation(conversation);

      if (!isGroup(conversation)) {
        throw new Error('Conversation is not a group');
      }

      // Get the permissions
      return conversation.permissions();
    },
    enabled: !!client && !!conversation && isGroup(conversation),
  });

  // Mutation for updating permissions
  const updatePermissionMutation = useMutation({
    mutationFn: async ({
      type,
      policy,
      metadataField
    }: {
      type: PermissionUpdateType;
      policy: PermissionPolicy;
      metadataField?: MetadataField
    }) => {
      ensureConnected(client);
      ensureConversation(conversation);

      if (!isGroup(conversation)) {
        throw new Error('Conversation is not a group');
      }

      // Update the permission
      await conversation.updatePermission(type, policy, metadataField);
    },
    onSuccess: () => {
      // Invalidate the permissions query
      queryClient.invalidateQueries({
        queryKey: xmtpKeys.permissions(conversationId)
      });

      // Invalidate the messages query to include the permission change message
      queryClient.invalidateQueries({
        queryKey: xmtpKeys.messages(conversationId)
      });
    },
  });

  // Function to update a permission
  const updatePermission = async (
    type: PermissionUpdateType,
    policy: PermissionPolicy,
    metadataField?: MetadataField
  ): Promise<void> => {
    await updatePermissionMutation.mutateAsync({ type, policy, metadataField });
  };

  return {
    permissions: permissions as unknown as GroupPermissions,
    isLoading,
    error: (queryError || updatePermissionMutation.error) as Error | null,
    updatePermission,
    isUpdating: updatePermissionMutation.isPending,
  };
};
