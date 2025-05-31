import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UseGroupMetadataResult } from '../../types';
import { useXmtp } from '../useXmtp';
import { useConversation } from '../conversations/useConversation';
import {xmtpKeys} from "../../utils/queryKeys";
import {ensureConnected, ensureConversation, isGroup} from "../../utils/helpers";
import {Client} from "@xmtp/browser-sdk";

/**
 * Hook to manage group metadata (name, description, image)
 * @param conversationId The group conversation ID
 * @returns Group metadata and functions to update it
 * @example
 * ```tsx
 * const {
 *   name,
 *   description,
 *   imageUrl,
 *   updateName,
 *   updateDescription,
 *   updateImageUrl,
 *   isLoading,
 *   isUpdating
 * } = useGroupMetadata('group-id');
 *
 * // Update the group name
 * const handleUpdateName = async (newName) => {
 *   await updateName(newName);
 * };
 *
 * // Update the group image
 * const handleUpdateImage = async (newImageUrl) => {
 *   await updateImageUrl(newImageUrl);
 * };
 * ```
 */
export const useGroupMetadata = (
  conversationId: string
): UseGroupMetadataResult => {
  const { client } = useXmtp();
  const { conversation } = useConversation(conversationId);
  const queryClient = useQueryClient();

  // Query for group metadata
  const {
    data: metadata = { name: '', description: '', imageUrl: '' },
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: xmtpKeys.metadata(conversationId),
    queryFn: async () => {
      ensureConnected(client as Client | null);
      ensureConversation(conversation);

      if (!isGroup(conversation)) {
        throw new Error('Conversation is not a group');
      }


      if(!conversation){
        return {
          name: '',
          description: '',
          imageUrl: '',
        };
      }

      return {
        name: conversation.name || '',
        description: conversation.description || '',
        imageUrl: conversation.imageUrl || '',
      };
    },
    enabled: !!client && !!conversation && isGroup(conversation),
  });

  // Mutation for updating the group name
  const updateNameMutation = useMutation({
    mutationFn: async (name: string) => {
      ensureConnected(client);
      ensureConversation(conversation);

      if (!isGroup(conversation)) {
        throw new Error('Conversation is not a group');
      }

      // Update the name
      await conversation.updateName(name);
    },
    onSuccess: () => {
      // Invalidate the metadata query
      queryClient.invalidateQueries({
        queryKey: xmtpKeys.metadata(conversationId)
      });

      // Invalidate the conversation query to update the name
      queryClient.invalidateQueries({
        queryKey: xmtpKeys.conversation(conversationId)
      });

      // Invalidate the messages query to include the metadata change message
      queryClient.invalidateQueries({
        queryKey: xmtpKeys.messages(conversationId)
      });
    },
  });

  // Mutation for updating the group description
  const updateDescriptionMutation = useMutation({
    mutationFn: async (description: string) => {
      ensureConnected(client);
      ensureConversation(conversation);

      if (!isGroup(conversation)) {
        throw new Error('Conversation is not a group');
      }

      // Update the description
      await conversation.updateDescription(description);
    },
    onSuccess: () => {
      // Invalidate the metadata query
      queryClient.invalidateQueries({
        queryKey: xmtpKeys.metadata(conversationId)
      });

      // Invalidate the conversation query to update the description
      queryClient.invalidateQueries({
        queryKey: xmtpKeys.conversation(conversationId)
      });

      // Invalidate the messages query to include the metadata change message
      queryClient.invalidateQueries({
        queryKey: xmtpKeys.messages(conversationId)
      });
    },
  });

  // Mutation for updating the group image URL
  const updateImageUrlMutation = useMutation({
    mutationFn: async (imageUrl: string) => {
      ensureConnected(client);
      ensureConversation(conversation);

      if (!isGroup(conversation)) {
        throw new Error('Conversation is not a group');
      }

      // Update the image URL
      await conversation.updateImageUrl(imageUrl);
    },
    onSuccess: () => {
      // Invalidate the metadata query
      queryClient.invalidateQueries({
        queryKey: xmtpKeys.metadata(conversationId)
      });

      // Invalidate the conversation query to update the image URL
      queryClient.invalidateQueries({
        queryKey: xmtpKeys.conversation(conversationId)
      });

      // Invalidate the messages query to include the metadata change message
      queryClient.invalidateQueries({
        queryKey: xmtpKeys.messages(conversationId)
      });
    },
  });

  // Determine if any mutation is in progress
  const isUpdating =
    updateNameMutation.isPending ||
    updateDescriptionMutation.isPending ||
    updateImageUrlMutation.isPending;

  // Combine errors from all mutations
  const mutationError =
    updateNameMutation.error ||
    updateDescriptionMutation.error ||
    updateImageUrlMutation.error;

  const error = queryError || mutationError || null;

  return {
    name: metadata.name,
    description: metadata.description,
    imageUrl: metadata.imageUrl,
    isLoading,
    error: error as Error | null,
    updateName: (name: string) => updateNameMutation.mutateAsync(name),
    updateDescription: (description: string) => updateDescriptionMutation.mutateAsync(description),
    updateImageUrl: (url: string) => updateImageUrlMutation.mutateAsync(url),
    isUpdating,
  };
};
