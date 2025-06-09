import fs from 'fs';
// import { Coinbase, Wallet, type WalletData } from '@coinbase/coinbase-sdk';
import {
  createSigner,
  getEncryptionKeyFromHex,
  logAgentDetails,
  validateEnvironment,
} from '@agenthub/xmtp-helpers';
import { type XmtpEnv } from '@xmtp/node-sdk';
import BasedClient from '@agenthub/xmtp-based-client';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { systemPrompt } from './systemPrompt.js';
import { ContentTypeText } from '@xmtp/content-type-text';
import { tools } from './tools.js';
/* Get the wallet key associated to the public key of
 * the agent and the encryption key for the local db
 * that stores your agent's messages */
const { XMTP_ENV, WALLET_KEY, ENCRYPTION_KEY, CHAIN, PAYMASTER_URL } =
  validateEnvironment([
    'XMTP_ENV',
    'WALLET_KEY',
    'ENCRYPTION_KEY',
    'CHAIN',
    'PAYMASTER_URL',
  ]);

const main = async () => {
  /* Create the signer using viem and parse the encryption key for the local db */
  const signer = await createSigner(WALLET_KEY);

  const dbEncryptionKey = getEncryptionKeyFromHex(ENCRYPTION_KEY);
  const avatar = fs.readFileSync(
    process.cwd() + '/agents/xmtp-ens-agent/src/ens-logo.png'
  );

  const paymasterUrl = PAYMASTER_URL;

  const client = await BasedClient.create(signer, {
    dbEncryptionKey,
    env: XMTP_ENV as XmtpEnv,
    username: 'ens',
    avatar,
    displayName: 'The ENS Agent',
    description:
      'Your personal ENS agent on XMTP! I will help you resolve ENS Names, get records, and more!',
    fees: 0.001,
    tags: ['ens'],
    paymasterUrl,
    chain: CHAIN === 'mainnet' ? 'base' : 'baseSepolia',
  });

  void logAgentDetails(client);

  /* Sync the conversations from the network to update the local db */
  console.log('✓ Syncing conversations...');
  await client.conversations.sync();

  console.log('Waiting for messages...');
  const stream = await client.conversations.streamAllMessages();

  for await (const message of stream) {
    if (
      message?.senderInboxId.toLowerCase() === client.inboxId.toLowerCase() ||
      message?.contentType?.typeId !== 'text'
    ) {
      continue;
    }

    const conversation = await client.conversations.getConversationById(
      message.conversationId
    );

    if (!conversation) {
      console.log('Unable to find conversation, skipping');
      continue;
    }

    const inboxState = await client.preferences.inboxStateFromInboxIds([
      message.senderInboxId,
    ]);
    const addressFromInboxId = inboxState[0].identifiers[0].identifier;
    const subname = await client.subnameByAddress(addressFromInboxId);

    if (!subname) {
      await conversation.send(
        "I don't know who you are, claim your free subname!"
      );
      return;
    }

    const messages = await conversation.messages();
    const parsedMessages = [] as {
      role: 'user' | 'assistant';
      content: string;
    }[];
    for (const _message of messages) {
      parsedMessages.push({
        role:
          _message.senderInboxId === message.senderInboxId
            ? 'user'
            : 'assistant',
        content: _message.contentType?.sameAs(ContentTypeText)
          ? (_message.content as string)
          : _message.fallback || '',
      });
    }

    const text = await generateText({
      model: openai('gpt-4o'),
      system: systemPrompt(subname),
      messages: [...parsedMessages],
      tools: tools,
      maxSteps: 5,
    });

    await conversation.sendWithFees(text.text, addressFromInboxId);

    console.log('Waiting for messages...');
  }
};

main().catch(console.error);
