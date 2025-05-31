import {
  Client,
  ConsentEntityType,
  ConsentState,
  CreateDMOptions as SafeCreateDmOptions,
  CreateGroupOptions as SafeCreateGroupOptions,
  DecodedMessage,
  Dm,
  Group,
  GroupMember,
  GroupPermissions,
  InboxState,
  MessageDisappearingSettings,
  MetadataField,
  PermissionPolicy,
  PermissionUpdateType,
  Signer,
} from '@xmtp/browser-sdk';
import { QueryClient } from '@tanstack/react-query';
import { ContentTypeId } from '@xmtp/content-type-primitives';

/**
 * Props for the XmtpProvider component
 */
export interface XmtpProviderProps {
  /** Children components */
  children: React.ReactNode;
  /** Optional custom QueryClient */
  queryClient?: QueryClient;
}

/**
 * Return type for the useXmtp hook
 */
export interface UseXmtpResult {
  /** The XMTP client */
  client: Client | null;
  /** Whether the client is loading */
  isLoading: boolean;
  /** Any error that occurred */
  error: Error | null;
  /** Whether the client is connected */
  isConnected: boolean;
  /** Connect to XMTP */
  connect: (signer: Signer, options?: any) => Promise<void>;
  /** Disconnect from XMTP */
  disconnect: () => void;
}

/**
 * Return type for the useConversations hook
 */
export interface UseConversationsResult {
  /** List of conversations */
  conversations: (Group | Dm)[];
  /** Whether the conversations are loading */
  isLoading: boolean;
  /** Any error that occurred */
  error: Error | null;
  /** Refetch the conversations */
  refetch: () => void;
}

/**
 * Return type for the useConversation hook
 */
export interface UseConversationResult {
  /** The conversation */
  conversation: Group | Dm | null;
  /** Whether the conversation is loading */
  isLoading: boolean;
  /** Any error that occurred */
  error: Error | null;
  /** Refetch the conversation */
  refetch: () => void;
}

/**
 * Return type for the useCreateConversation hook
 */
export interface UseCreateConversationResult {
  /** Create a new group */
  createGroup: (members: string[], options?: SafeCreateGroupOptions) => Promise<Group | undefined>;
  /** Create a new DM */
  createDm: (peerInboxId: string, options?: SafeCreateDmOptions) => Promise<Dm | undefined>;
  /** Whether a conversation is being created */
  isCreating: boolean;
  /** Any error that occurred */
  error: Error | null;
}

/**
 * Return type for the useMessages hook
 */
export interface UseMessagesResult {
  /** List of messages */
  messages: DecodedMessage[];
  /** Whether there are more messages to load */
  hasNextPage: boolean;
  /** Whether the messages are loading */
  isLoading: boolean;
  /** Whether the next page of messages is being fetched */
  isFetchingNextPage: boolean;
  /** Any error that occurred */
  error: Error | null;
  /** Load more messages */
  loadMore: () => void;
  /** Refetch the messages */
  refetch: () => void;
}

/**
 * Return type for the useSendMessage hook
 */
export interface UseSendMessageResult {
  /** Send a message */
  sendMessage: (content: any, contentType?: ContentTypeId) => Promise<string>;
  /** Send a message optimistically */
  sendOptimistic: (content: any, contentType?: ContentTypeId) => Promise<string>;
  /** Whether a message is being sent */
  isSending: boolean;
  /** Any error that occurred */
  error: Error | null;
}

/**
 * Return type for the useGroupMembers hook
 */
export interface UseGroupMembersResult {
  /** List of members */
  members: GroupMember[];
  /** List of admin inbox IDs */
  admins: string[];
  /** List of super admin inbox IDs */
  superAdmins: string[];
  /** Whether the members are loading */
  isLoading: boolean;
  /** Any error that occurred */
  error: Error | null;
  /** Add members to the group */
  addMembers: (inboxIds: string[]) => Promise<void>;
  /** Remove members from the group */
  removeMembers: (inboxIds: string[]) => Promise<void>;
  /** Add an admin to the group */
  addAdmin: (inboxId: string) => Promise<void>;
  /** Remove an admin from the group */
  removeAdmin: (inboxId: string) => Promise<void>;
  /** Whether the members are being updated */
  isUpdating: boolean;
}

/**
 * Return type for the useGroupMetadata hook
 */
export interface UseGroupMetadataResult {
  /** The group name */
  name: string;
  /** The group description */
  description: string;
  /** The group image URL */
  imageUrl: string;
  /** Whether the metadata is loading */
  isLoading: boolean;
  /** Any error that occurred */
  error: Error | null;
  /** Update the group name */
  updateName: (name: string) => Promise<void>;
  /** Update the group description */
  updateDescription: (description: string) => Promise<void>;
  /** Update the group image URL */
  updateImageUrl: (url: string) => Promise<void>;
  /** Whether the metadata is being updated */
  isUpdating: boolean;
}

/**
 * Return type for the useGroupPermissions hook
 */
export interface UseGroupPermissionsResult {
  /** The group permissions */
  permissions: GroupPermissions;
  /** Whether the permissions are loading */
  isLoading: boolean;
  /** Any error that occurred */
  error: Error | null;
  /** Update a permission */
  updatePermission: (
    type: PermissionUpdateType,
    policy: PermissionPolicy,
    metadataField?: MetadataField
  ) => Promise<void>;
  /** Whether the permissions are being updated */
  isUpdating: boolean;
}

/**
 * Return type for the useConsent hook
 */
export interface UseConsentResult {
  /** Get the consent state for an entity */
  getConsentState: (entityType: ConsentEntityType, entity: string) => ConsentState;
  /** Set consent states */
  setConsentStates: (records: ConsentRecord[]) => Promise<void>;
  /** Allow a group */
  allowGroup: (groupId: string) => Promise<void>;
  /** Deny a group */
  denyGroup: (groupId: string) => Promise<void>;
  /** Allow an inbox */
  allowInbox: (inboxId: string) => Promise<void>;
  /** Deny an inbox */
  denyInbox: (inboxId: string) => Promise<void>;
  /** Whether the consent states are being updated */
  isUpdating: boolean;
  /** Any error that occurred */
  error: Error | null;
}

/**
 * Consent record for updating consent states
 */
export interface ConsentRecord {
  /** The entity type */
  entityType: ConsentEntityType;
  /** The entity ID */
  entity: string;
  /** The consent state */
  state: ConsentState;
}

/**
 * Return type for the useCanMessage hook
 */
export interface UseCanMessageResult {
  /** Map of identifiers to whether they can be messaged */
  canMessage: Map<string, boolean>;
  /** Whether the check is loading */
  isLoading: boolean;
  /** Any error that occurred */
  error: Error | null;
}

/**
 * Return type for the useInboxState hook
 */
export interface UseInboxStateResult {
  /** The inbox state */
  inboxState: InboxState | null;
  /** Whether the inbox state is loading */
  isLoading: boolean;
  /** Any error that occurred */
  error: Error | null;
  /** Refetch the inbox state */
  refetch: () => void;
}

/**
 * Options for stream hooks
 */
export interface StreamOptions<T> {
  /** Callback for new items */
  onItem?: (item: T) => void;
  /** Whether the stream is enabled */
  enabled?: boolean;
}

/**
 * Return type for stream hooks
 */
export interface StreamResult {
  /** Whether the stream is active */
  isStreaming: boolean;
  /** Any error that occurred */
  error: Error | null;
}

/**
 * Return type for the useSyncAll hook
 */
export interface UseSyncAllResult {
  /** Sync all conversations and messages */
  syncAll: (consentStates?: ConsentState[]) => Promise<void>;
  /** Whether syncing is in progress */
  isSyncing: boolean;
  /** Any error that occurred */
  error: Error | null;
}

/**
 * Return type for the useDisappearingMessages hook
 */
export interface UseDisappearingMessagesResult {
  /** The message disappearing settings */
  settings: MessageDisappearingSettings | null;
  /** Whether disappearing messages are enabled */
  isEnabled: boolean | null;
  /** Whether the settings are loading */
  isLoading: boolean;
  /** Any error that occurred */
  error: Error | null;
  /** Update the settings */
  updateSettings: (fromNs: bigint, inNs: bigint) => Promise<void>;
  /** Remove the settings */
  removeSettings: () => Promise<void>;
  /** Whether the settings are being updated */
  isUpdating: boolean;
  /** Whether the enabled flag is loading **/
  isEnabledLoading: boolean;
  /** Any error that occurred */
  queryEnabledError: Error | null;
}
