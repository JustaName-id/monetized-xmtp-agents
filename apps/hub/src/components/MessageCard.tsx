'use client';

import { DecodedMessage } from '@xmtp/browser-sdk';
import ReactMarkdown from 'react-markdown';
import { Components } from 'react-markdown';
import { ReactNode } from 'react';
import {
  ContentTypeTransactionReference,
  TransactionReferenceCodec,
} from '@xmtp/content-type-transaction-reference';
import { EncodedContent } from '@xmtp/content-type-primitives';
import { ContentTypeText } from '@xmtp/content-type-text';
import { ContentTypeGroupUpdated } from '@xmtp/content-type-group-updated';
import Link from 'next/link';
import {clientEnv} from "@/utils/config/clientEnv";

export interface MessageCardProps {
  message: DecodedMessage;
  isSender: boolean;
}

// Custom markdown components for consistent styling
const createMarkdownComponents = (isSender: boolean): Components => ({
  p: ({ children }: { children?: ReactNode }) => (
    <p className="mb-2 last:mb-0">{children}</p>
  ),
  h1: ({ children }: { children?: ReactNode }) => (
    <h1 className="text-lg font-bold mb-2">{children}</h1>
  ),
  h2: ({ children }: { children?: ReactNode }) => (
    <h2 className="text-base font-bold mb-2">{children}</h2>
  ),
  h3: ({ children }: { children?: ReactNode }) => (
    <h3 className="text-sm font-bold mb-1">{children}</h3>
  ),
  strong: ({ children }: { children?: ReactNode }) => (
    <strong className="font-bold">{children}</strong>
  ),
  em: ({ children }: { children?: ReactNode }) => (
    <em className="italic">{children}</em>
  ),
  code: ({ children }: { children?: ReactNode }) => (
    <code className={`px-1 py-0.5 rounded text-xs font-mono ${
      isSender
        ? 'bg-primary-foreground/20 text-primary-foreground'
        : 'bg-secondary-foreground/20'
    }`}>
      {children}
    </code>
  ),
  pre: ({ children }: { children?: ReactNode }) => (
    <pre className={`p-2 rounded text-xs font-mono overflow-x-auto ${
      isSender
        ? 'bg-primary-foreground/20 text-primary-foreground'
        : 'bg-secondary-foreground/20'
    }`}>
      {children}
    </pre>
  ),
  ul: ({ children }: { children?: ReactNode }) => (
    <ul className="list-disc list-inside mb-2 pl-2">{children}</ul>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol className="list-decimal list-inside mb-2 pl-2">{children}</ol>
  ),
  li: ({ children }: { children?: ReactNode }) => (
    <li className="mb-1">{children}</li>
  ),
  blockquote: ({ children }: { children?: ReactNode }) => (
    <blockquote className={`border-l-2 pl-3 italic ${
      isSender ? 'border-primary-foreground/50' : 'border-secondary-foreground/50'
    }`}>
      {children}
    </blockquote>
  ),
  a: ({ href, children }: { href?: string; children?: ReactNode }) => (
    <a
      href={href}
      className={`underline underline-offset-2 hover:no-underline ${
        isSender ? 'text-primary-foreground' : 'text-blue-600'
      }`}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
});

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
          className={`flex px-3 py-3 rounded-md max-w-[80%] min-w-0 ${
            isSender
              ? 'bg-primary rounded-br-none'
              : 'bg-secondary rounded-bl-none'
          }`}
        >
          <div
            className={`text-sm w-full break-words overflow-wrap-anywhere ${
              isSender ? 'text-primary-foreground' : 'text-base-foreground'
            }`}
          >
            <ReactMarkdown components={createMarkdownComponents(isSender)}>
              {message.content as string}
            </ReactMarkdown>
          </div>
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
        href={`${clientEnv.baseNetwork}https://sepolia.basescan.org/tx/${tx.reference}`}
      >
        <div
          className={`flex flex-row w-full ${
            isSender ? 'justify-end' : 'justify-start'
          }`}
        >
          <div className={`flex px-2 py-1 rounded-lg bg-blue-500 max-w-[80%] min-w-0`}>
            <span
              className={`text-sm break-words ${
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
    return null
  }

  if (typeof message.fallback === 'string') {
    return (
      <div
        className={`flex flex-row w-full ${
          isSender ? 'justify-end' : 'justify-start'
        }`}
      >
        <div
          className={`flex px-3 py-3 rounded-md max-w-[80%] min-w-0 ${
            isSender
              ? 'bg-primary rounded-br-none'
              : 'bg-secondary rounded-bl-none'
          }`}
        >
          <div
            className={`text-sm w-full break-words overflow-wrap-anywhere ${
              isSender ? 'text-primary-foreground' : 'text-base-foreground'
            }`}
          >
            <ReactMarkdown components={createMarkdownComponents(isSender)}>
              {message.fallback}
            </ReactMarkdown>
          </div>
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
        className={`flex px-3 py-3 rounded-md max-w-[80%] min-w-0 ${
          isSender
            ? 'bg-primary rounded-br-none'
            : 'bg-secondary rounded-bl-none'
        }`}
      >
        <pre
          className={`text-sm w-full break-words whitespace-pre-wrap overflow-wrap-anywhere ${
            isSender ? 'text-primary-foreground' : 'text-base-foreground'
          }`}
        >
          {JSON.stringify(message.content ?? message.fallback, null, 2)}
        </pre>
      </div>
    </div>
  );
};
