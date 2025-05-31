// Provider
export { XmtpProvider } from './lib/providers/XmtpProvider';

// Core hooks
export { useXmtp } from './lib/hooks/useXmtp';

// Conversation hooks
export { useConversations } from './lib/hooks/conversations/useConversations';
export { useConversation } from './lib/hooks/conversations/useConversation';
export { useCreateConversation } from './lib/hooks/conversations/useCreateConversation';

// Message hooks
export { useMessages } from './lib/hooks/messages/useMessages';
export { useSendMessage } from './lib/hooks/messages/useSendMessage';

// Member management hooks
export { useGroupMembers } from './lib/hooks/members/useGroupMembers';

// Group management hooks
export { useGroupMetadata } from './lib/hooks/groups/useGroupMetadata';
export { useGroupPermissions } from './lib/hooks/groups/useGroupPermissions';

// User & network hooks
export { useCanMessage } from './lib/hooks/user/useCanMessage';
export { useInboxState } from './lib/hooks/user/useInboxState';

// Stream hooks
export { useStreamConversations } from './lib/hooks/streams/useStreamConversations';
export { useStreamMessages } from './lib/hooks/streams/useStreamMessages';
export { useStreamAllMessages } from './lib/hooks/streams/useStreamAllMessages';

// Utility hooks
export { useSyncAll } from './lib/hooks/utility/useSyncAll';
export { useDisappearingMessages } from './lib/hooks/utility/useDisappearingMessages';

export { xmtpKeys } from './lib/utils/queryKeys';
export { isGroup, isDm } from './lib/utils/helpers';

// Types
export type {
  XmtpProviderProps,
  UseXmtpResult,
  UseConversationsResult,
  UseConversationResult,
  UseCreateConversationResult,
  UseMessagesResult,
  UseSendMessageResult,
  UseGroupMembersResult,
  UseGroupMetadataResult,
  UseGroupPermissionsResult,
  UseConsentResult,
  ConsentRecord,
  UseCanMessageResult,
  UseInboxStateResult,
  StreamOptions,
  StreamResult,
  UseSyncAllResult,
  UseDisappearingMessagesResult,
} from './lib/types';

// Re-export types from browser-sdk that are commonly used
export type {
  Client,
  Conversation,
  Dm,
  Group,
  DecodedMessage,
  GroupMember,
  GroupPermissions,
  MessageDisappearingSettings,
  Identifier,
  ConsentEntityType,
  ConsentState,
  ContentTypeId,
  MetadataField,
  PermissionPolicy,
  PermissionUpdateType,
  Signer,
  SafeListConversationsOptions,
  SafeListMessagesOptions,
  SafeCreateGroupOptions,
  SafeCreateDmOptions,
} from '@xmtp/browser-sdk';
