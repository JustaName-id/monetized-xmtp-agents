'use client';

import { DecodedMessage } from '@xmtp/browser-sdk';

import {
  ContentTypeTransactionReference,
  TransactionReferenceCodec,
} from '@xmtp/content-type-transaction-reference';
import { EncodedContent } from '@xmtp/content-type-primitives';
import { ContentTypeText } from '@xmtp/content-type-text';
import { ContentTypeGroupUpdated } from '@xmtp/content-type-group-updated';
import Link from 'next/link';
import { clientEnv } from '@/utils/config/clientEnv';

export interface MessageCardProps {
  message: DecodedMessage;
  isSender: boolean;
}

export const MessageCard: React.FC<MessageCardProps> = ({
  message,
  isSender,
}) => {
  if (message.contentType.sameAs(ContentTypeText)) {
    return (
      <div
        className={`flex flex-row w-full ${
          isSender ? 'justify-end' : 'justify-start'
        }`}
      >
        <div
          className={`flex px-3 py-3 rounded-md ${
            isSender
              ? 'bg-primary rounded-br-none'
              : 'bg-secondary rounded-bl-none'
          }`}
        >
          <p
            className={`text-sm ${
              isSender ? 'text-primary-foreground' : 'text-base-foreground'
            }`}
          >
            {message.content as string}
          </p>
        </div>
      </div>
    );
  }

  if (message.contentType.sameAs(ContentTypeTransactionReference)) {
    const transactionReference = new TransactionReferenceCodec();
    const tx = transactionReference.decode(
      message.encodedContent as EncodedContent
    );
    return (
      <Link
        className={'underline underline-offset-2 text-white'}
        target={'_blank'}
        href={`${clientEnv.baseNetwork.blockExplorers?.default.url}/tx/${tx.reference}`}
      >
        <div
          className={`flex flex-row w-full ${
            isSender ? 'justify-end' : 'justify-start'
          }`}
        >
          <div className={`flex px-2 py-1 rounded-lg bg-blue-500`}>
            <span
              className={`text-sm ${
                isSender ? 'text-primary-foreground' : 'text-base-foreground'
              }`}
            >
              You can find your tx here
            </span>
          </div>
        </div>
      </Link>
    );
  }

  if (message.contentType.sameAs(ContentTypeGroupUpdated)) {
    return null;
  }

  if (typeof message.fallback === 'string') {
    return (
      <div
        className={`flex flex-row w-full ${
          isSender ? 'justify-end' : 'justify-start'
        }`}
      >
        <div
          className={`flex px-3 py-3 rounded-md ${
            isSender
              ? 'bg-primary rounded-br-none'
              : 'bg-secondary rounded-bl-none'
          }`}
        >
          <p
            className={`text-sm ${
              isSender ? 'text-primary-foreground' : 'text-base-foreground'
            }`}
          >
            {message.fallback}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-row w-full ${
        isSender ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`flex px-3 py-3 rounded-md ${
          isSender
            ? 'bg-primary rounded-br-none'
            : 'bg-secondary rounded-bl-none'
        }`}
      >
        <p
          className={`text-sm ${
            isSender ? 'text-primary-foreground' : 'text-base-foreground'
          }`}
        >
          {JSON.stringify(message.content ?? message.fallback, null, 2)}
        </p>
      </div>
    </div>
  );
};
