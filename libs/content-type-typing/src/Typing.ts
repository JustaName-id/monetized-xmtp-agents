import {
  ContentTypeId,
  type ContentCodec,
  type EncodedContent,
} from '@xmtp/content-type-primitives';

// Unique identifier for the custom typing content type
export const ContentTypeTyping = new ContentTypeId({
  authorityId: 'agenthub.dev', // Using a custom authority ID for your application
  typeId: 'typing',
  versionMajor: 1,
  versionMinor: 0,
});

/**
 * Represents the payload for the typing status.
 * `isTyping: true` means the user has started typing.
 * `isTyping: false` could represent the user has stopped typing (though often, the absence of typing messages implies stopped).
 */
export type Typing = {
  isTyping: boolean;
};

/**
 * Parameters for the typing content type.
 * Currently, none are needed.
 */
export type TypingParameters = Record<string, never>;

/**
 * Codec for encoding and decoding the typing status.
 */
export class TypingCodec implements ContentCodec<Typing, TypingParameters> {
  get contentType(): ContentTypeId {
    return ContentTypeTyping;
  }

  /**
   * Encodes the typing status into a Uint8Array.
   * `1` for true (isTyping), `0` for false.
   */
  encode(content: Typing): EncodedContent<TypingParameters> {
    return {
      type: ContentTypeTyping,
      parameters: {},
      content: new Uint8Array(content.isTyping ? [1] : [0]),
    };
  }

  /**
   * Decodes the Uint8Array back into a Typing object.
   */
  decode(encodedContent: EncodedContent<TypingParameters>): Typing {
    if (encodedContent.content && encodedContent.content.length > 0) {
      return { isTyping: encodedContent.content[0] === 1 };
    }
    // Default to false if content is missing or empty, though encode should always provide a byte.
    return { isTyping: false };
  }

  /**
   * Fallback text if the receiving client doesn't support this content type.
   */
  fallback(content: Typing): string | undefined {
    return content.isTyping ? '[User is typing]' : undefined;
  }

  /**
   * Typing indicators should generally not trigger push notifications.
   */
  shouldPush(): boolean {
    return false;
  }
}
