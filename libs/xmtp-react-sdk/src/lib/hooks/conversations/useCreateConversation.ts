import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Client,
  Dm,
  Group,
  SafeCreateDmOptions,
  SafeCreateGroupOptions
} from '@xmtp/browser-sdk';
import {UseCreateConversationResult} from "../../types";
import {useXmtp} from "../useXmtp";
import {ensureConnected} from "../../utils/helpers";
import {xmtpKeys} from "../../utils/queryKeys";

/**
 * Hook to create new group chats or DMs with optimistic updates
 * @returns Functions to create groups and DMs, and loading state
 * @example
 * ```tsx
 * const { createGroup, createDm, isCreating } = useCreateConversation();
 *
 * // Create a group
 * const handleCreateGroup = async () => {
 *   const group = await createGroup(['inboxId1', 'inboxId2'], {
 *     name: 'My Group',
 *     description: 'A cool group',
 *     imageUrl: 'https://example.com/image.png'
 *   });
 *
 *   // Navigate to the new group
 *   navigate(`/conversations/${group.id()}`);
 * };
 *
 * // Create a DM
 * const handleCreateDm = async (peerInboxId) => {
 *   const dm = await createDm(peerInboxId);
 *   navigate(`/conversations/${dm.id()}`);
 * };
 * ```
 */
export const useCreateConversation = (): UseCreateConversationResult => {
  const { client } = useXmtp();
  const queryClient = useQueryClient();

  // Mutation for creating a group
  const groupMutation = useMutation({
    mutationFn: async ({
      members,
      options
    }: {
      members: string[];
      options?: SafeCreateGroupOptions
    }): Promise<Group | undefined> => {
      ensureConnected(client as Client | null);
      return client?.conversations.newGroup(members, options);
    },
    onSuccess: (newGroup) => {
      if(!newGroup) return;
      // Add the new group to the conversations cache
      queryClient.setQueryData(
        xmtpKeys.conversation(newGroup.id),
        newGroup
      );

      // Invalidate the conversations list to include the new group
      queryClient.invalidateQueries({
        queryKey: xmtpKeys.conversations()
      });
    },
  });

  // Mutation for creating a DM
  const dmMutation = useMutation({
    mutationFn: async ({
      peerInboxId,
      options
    }: {
      peerInboxId: string;
      options?: SafeCreateDmOptions
    }): Promise<Dm | undefined> => {
      ensureConnected(client as Client | null);
      return client?.conversations.newDm(peerInboxId, options);
    },
    onSuccess: (newDm) => {
      // Add the new DM to the conversations cache
      if(!newDm) return;
      queryClient.setQueryData(
        xmtpKeys.conversation(newDm.id),
        newDm
      );

      // Invalidate the conversations list to include the new DM
      queryClient.invalidateQueries({
        queryKey: xmtpKeys.conversations()
      });
    },
  });

  // Function to create a group
  const createGroup = async (
    members: string[],
    options?: SafeCreateGroupOptions
  ): Promise<Group | undefined> => {
    return await groupMutation.mutateAsync({ members, options });
  };

  // Function to create a DM
  const createDm = async (
    peerInboxId: string,
    options?: SafeCreateDmOptions
  ): Promise<Dm | undefined> => {
    return await dmMutation.mutateAsync({ peerInboxId, options });
  };

  // Determine if either mutation is in progress
  const isCreating = groupMutation.isPending || dmMutation.isPending;

  // Combine errors from both mutations
  const error = groupMutation.error || dmMutation.error || null;

  return {
    createGroup,
    createDm,
    isCreating,
    error: error as Error | null,
  };
};
