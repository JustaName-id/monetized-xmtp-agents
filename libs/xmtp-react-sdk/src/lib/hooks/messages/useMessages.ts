import { useInfiniteQuery } from '@tanstack/react-query';
import { SafeListMessagesOptions } from '@xmtp/browser-sdk';
import {UseMessagesResult} from "../../types";
import {useXmtp} from "../useXmtp";
import {useConversation} from "../conversations/useConversation";
import {xmtpKeys} from "../../utils/queryKeys";
import {ensureConnected, ensureConversation} from "../../utils/helpers";

/**
 * Default page size for messages
 */
const DEFAULT_PAGE_SIZE = BigInt(20);

/**
 * Hook to fetch messages with infinite scroll support
 * @param conversationId The conversation ID
 * @param options Optional filters for listing messages
 * @returns Messages with infinite scroll support
 * @example
 * ```tsx
 * const {
 *   messages,
 *   hasNextPage,
 *   loadMore,
 *   isLoading
 * } = useMessages('conversation-id');
 *
 * return (
 *   <InfiniteScroll
 *     dataLength={messages.length}
 *     next={loadMore}
 *     hasMore={hasNextPage}
 *     loader={<Spinner />}
 *   >
 *     {messages.map(message => (
 *       <Message key={message.id} message={message} />
 *     ))}
 *   </InfiniteScroll>
 * );
 * ```
 */
export const useMessages = (
  conversationId: string,
  options?: SafeListMessagesOptions
): UseMessagesResult => {
  const { client } = useXmtp();
  const { conversation } = useConversation(conversationId);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: xmtpKeys.messages(conversationId),
    queryFn: async ({ pageParam }) => {
      ensureConnected(client);
      ensureConversation(conversation);

      // Prepare options for this page
      const pageOptions = {
        ...options,
        limit: options?.limit || DEFAULT_PAGE_SIZE,
        // If we have a cursor, use it
        cursor: pageParam,
      };

      // Fetch messages for this page
      const messages = await conversation.messages(pageOptions);

      // Return the messages and the cursor for the next page
      return {
        messages,
        nextCursor: BigInt(messages.length) === pageOptions.limit
          ? messages[messages.length - 1].id
          : undefined,
      };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!client && !!conversation,
  });

  // Flatten the pages of messages into a single array
  const messages = data?.pages.flatMap(page => page.messages) || [];

  return {
    messages,
    hasNextPage: !!hasNextPage,
    isLoading,
    isFetchingNextPage,
    error: error as Error | null,
    loadMore: () => fetchNextPage(),
    refetch,
  };
};
