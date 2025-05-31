/**
 * Centralized cache key management for React Query
 * These keys are used to organize the cache and enable automatic invalidation
 */
export const xmtpKeys = {
  all: ['xmtp'] as const,

  // Client keys
  client: () => [...xmtpKeys.all, 'client'] as const,
  inboxState: () => [...xmtpKeys.client(), 'inboxState'] as const,

  // Conversation keys
  conversations: () => [...xmtpKeys.all, 'conversations'] as const,
  conversation: (id: string) => [...xmtpKeys.conversations(), id] as const,

  // Message keys
  messages: (conversationId: string) =>
    [...xmtpKeys.conversation(conversationId), 'messages'] as const,

  // Group keys
  members: (conversationId: string) =>
    [...xmtpKeys.conversation(conversationId), 'members'] as const,
  admins: (conversationId: string) =>
    [...xmtpKeys.conversation(conversationId), 'admins'] as const,
  superAdmins: (conversationId: string) =>
    [...xmtpKeys.conversation(conversationId), 'superAdmins'] as const,
  metadata: (conversationId: string) =>
    [...xmtpKeys.conversation(conversationId), 'metadata'] as const,
  permissions: (conversationId: string) =>
    [...xmtpKeys.conversation(conversationId), 'permissions'] as const,

  // Message settings keys
  messageDisappearingSettings: (conversationId: string) =>
    [...xmtpKeys.conversation(conversationId), 'messageDisappearingSettings'] as const,
  messageDisappearingSettingsState: (conversationId: string) =>
    [...xmtpKeys.messageDisappearingSettings(conversationId), 'state'] as const,
  // Consent keys
  consent: () => [...xmtpKeys.all, 'consent'] as const,
  consentState: (entityType: string, entity: string) =>
    [...xmtpKeys.consent(), entityType, entity] as const,

  // User keys
  canMessage: () => [...xmtpKeys.all, 'canMessage'] as const,
} as const;
