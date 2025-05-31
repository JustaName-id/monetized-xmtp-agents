import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UseGroupMembersResult } from '../../types';
import { useXmtp } from '../useXmtp';
import { useConversation } from '../conversations/useConversation';
import { xmtpKeys } from '../../utils/queryKeys';
import {ensureConnected, ensureConversation, isGroup} from "../../utils/helpers";
import {GroupMember} from "@xmtp/browser-sdk";

/**
 * Hook to manage group membership
 * @param conversationId The group conversation ID
 * @returns Group members and functions to manage them
 * @example
 * ```tsx
 * const {
 *   members,
 *   admins,
 *   superAdmins,
 *   addMembers,
 *   removeMembers,
 *   addAdmin,
 *   removeAdmin,
 *   isLoading,
 *   isUpdating
 * } = useGroupMembers('group-id');
 *
 * // Add members
 * const handleAddMembers = async (inboxIds) => {
 *   await addMembers(inboxIds);
 * };
 *
 * // Remove a member
 * const handleRemoveMember = async (inboxId) => {
 *   await removeMembers([inboxId]);
 * };
 *
 * // Add an admin
 * const handleAddAdmin = async (inboxId) => {
 *   await addAdmin(inboxId);
 * };
 * ```
 */
export const useGroupMembers = (
  conversationId: string
): UseGroupMembersResult => {
  const { client } = useXmtp();
  const { conversation } = useConversation(conversationId);
  const queryClient = useQueryClient();

  // Query for members
  const {
    data: members = [],
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: xmtpKeys.members(conversationId),
    queryFn: async () => {
      ensureConnected(client);
      ensureConversation(conversation);

      if (!isGroup(conversation)) {
        throw new Error('Conversation is not a group');
      }

      // Get the members
      return conversation.members();
    },
    enabled: !!client && !!conversation && isGroup(conversation),
  });

  // Query for admins
  const {
    data: admins = [],
  } = useQuery({
    queryKey: xmtpKeys.admins(conversationId),
    queryFn: async () => {
      ensureConnected(client);
      ensureConversation(conversation);

      if (!isGroup(conversation)) {
        throw new Error('Conversation is not a group');
      }

      // Get the admins
      return conversation.listAdmins();
    },
    enabled: !!client && !!conversation && isGroup(conversation),
  });

  // Query for super admins
  const {
    data: superAdmins = [],
  } = useQuery({
    queryKey: xmtpKeys.superAdmins(conversationId),
    queryFn: async () => {
      ensureConnected(client);
      ensureConversation(conversation);

      if (!isGroup(conversation)) {
        throw new Error('Conversation is not a group');
      }

      // Get the super admins
      return conversation.listSuperAdmins();
    },
    enabled: !!client && !!conversation && isGroup(conversation),
  });

  // Mutation for adding members
  const addMembersMutation = useMutation({
    mutationFn: async (inboxIds: string[]) => {
      ensureConnected(client);
      ensureConversation(conversation);

      if (!isGroup(conversation)) {
        throw new Error('Conversation is not a group');
      }

      // Add the members
      await conversation.addMembers(inboxIds);
    },
    onSuccess: () => {
      // Invalidate the members query
      queryClient.invalidateQueries({
        queryKey: xmtpKeys.members(conversationId)
      });

      // Invalidate the messages query to include the membership change message
      queryClient.invalidateQueries({
        queryKey: xmtpKeys.messages(conversationId)
      });
    },
  });

  // Mutation for removing members
  const removeMembersMutation = useMutation({
    mutationFn: async (inboxIds: string[]) => {
      ensureConnected(client);
      ensureConversation(conversation);

      if (!isGroup(conversation)) {
        throw new Error('Conversation is not a group');
      }

      // Remove the members
      await conversation.removeMembers(inboxIds);
    },
    onSuccess: () => {
      // Invalidate the members query
      queryClient.invalidateQueries({
        queryKey: xmtpKeys.members(conversationId)
      });

      // Invalidate the messages query to include the membership change message
      queryClient.invalidateQueries({
        queryKey: xmtpKeys.messages(conversationId)
      });
    },
  });

  // Mutation for adding an admin
  const addAdminMutation = useMutation({
    mutationFn: async (inboxId: string) => {
      ensureConnected(client);
      ensureConversation(conversation);

      if (!isGroup(conversation)) {
        throw new Error('Conversation is not a group');
      }

      // Add the admin
      await conversation.addAdmin(inboxId);
    },
    onSuccess: () => {
      // Invalidate the admins query
      queryClient.invalidateQueries({
        queryKey: xmtpKeys.admins(conversationId)
      });

      // Invalidate the messages query to include the membership change message
      queryClient.invalidateQueries({
        queryKey: xmtpKeys.messages(conversationId)
      });
    },
  });

  // Mutation for removing an admin
  const removeAdminMutation = useMutation({
    mutationFn: async (inboxId: string) => {
      ensureConnected(client);
      ensureConversation(conversation);

      if (!isGroup(conversation)) {
        throw new Error('Conversation is not a group');
      }

      // Remove the admin
      await conversation.removeAdmin(inboxId);
    },
    onSuccess: () => {
      // Invalidate the admins query
      queryClient.invalidateQueries({
        queryKey: xmtpKeys.admins(conversationId)
      });

      // Invalidate the messages query to include the membership change message
      queryClient.invalidateQueries({
        queryKey: xmtpKeys.messages(conversationId)
      });
    },
  });

  // Determine if any mutation is in progress
  const isUpdating =
    addMembersMutation.isPending ||
    removeMembersMutation.isPending ||
    addAdminMutation.isPending ||
    removeAdminMutation.isPending;

  // Combine errors from all mutations
  const mutationError =
    addMembersMutation.error ||
    removeMembersMutation.error ||
    addAdminMutation.error ||
    removeAdminMutation.error;

  const error = queryError || mutationError || null;

  return {
    members: members as unknown as GroupMember[],
    admins,
    superAdmins,
    isLoading,
    error: error as Error | null,
    addMembers: (inboxIds: string[]) => addMembersMutation.mutateAsync(inboxIds),
    removeMembers: (inboxIds: string[]) => removeMembersMutation.mutateAsync(inboxIds),
    addAdmin: (inboxId: string) => addAdminMutation.mutateAsync(inboxId),
    removeAdmin: (inboxId: string) => removeAdminMutation.mutateAsync(inboxId),
    isUpdating,
  };
};
