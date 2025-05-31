import { Client, Conversation, Dm, Group } from '@xmtp/browser-sdk';

/**
 * Type guard to check if a conversation is a Group
 * @param conversation The conversation to check
 * @returns True if the conversation is a Group
 */
export const isGroup = (conversation: Conversation): conversation is Group => {
  return conversation instanceof Group;
};

/**
 * Type guard to check if a conversation is a Dm
 * @param conversation The conversation to check
 * @returns True if the conversation is a Dm
 */
export const isDm = (conversation: Conversation): conversation is Dm => {
  return conversation instanceof Dm;
};

/**
 * Ensures a client is connected
 * @param client The XMTP client
 * @throws Error if the client is not connected
 */
export function ensureConnected (client: Client | null): asserts client is Client {
  if (!client) {
    throw new Error('XMTP client not connected. Call connect() first.');
  }
};

/**
 * Ensures a conversation exists
 * @param conversation The conversation
 * @throws Error if the conversation is null
 */
export function ensureConversation (conversation: Conversation | null): asserts conversation is Conversation {
  if (!conversation) {
    throw new Error('Conversation not found');
  }
};

/**
 * Handles errors in async functions
 * @param fn The async function to execute
 * @param errorHandler Optional custom error handler
 * @returns The result of the async function or undefined if an error occurred
 */
export const handleError = async <T>(
  fn: () => Promise<T>,
  errorHandler?: (error: unknown) => void
): Promise<T | undefined> => {
  try {
    return await fn();
  } catch (error) {
    if (errorHandler) {
      errorHandler(error);
    } else {
      console.error('XMTP Error:', error);
    }
    return undefined;
  }
};
