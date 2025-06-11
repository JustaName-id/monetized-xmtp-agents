import fs from 'fs';
import {
  createSigner,
  getEncryptionKeyFromHex,
  logAgentDetails,
  validateEnvironment,
} from '@agenthub/xmtp-helpers';
import { type XmtpEnv } from '@xmtp/node-sdk';
import BasedClient from '@agenthub/xmtp-based-client';
import { HoroscopeProcessor } from './horoscope-processor.js';
import {
  ContentTypeTyping,
  TypingCodec,
  type Typing,
} from '@agenthub/xmtp-content-type-typing';

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
    process.cwd() + '/agents/xmtp-horoscope-agent/src/horoscope.jpg'
  );

  const paymasterUrl = PAYMASTER_URL;

  const client = await BasedClient.create(signer, {
    dbEncryptionKey,
    env: XMTP_ENV as XmtpEnv,
    username: 'horoscope',
    avatar,
    displayName: 'The horoscope Agent',
    description:
      "Your personal astrology companion on XMTP! Get authentic daily horoscope readings powered by professional astrologers. Simply tell the agent your zodiac sign or birthday, and receive personalized cosmic insights including your mood, lucky numbers, colors, and compatibility. Ask for today's reading, peek into tomorrow, or check yesterday's stars. Works with all 12 zodiac signs and delivers real-time astrological guidance straight to your XMTP messages.",
    fees: 0.01, // 0.01 USDC
    codecs: [new TypingCodec()],
    tags: ['astrology'],
    paymasterUrl,
    chain: CHAIN === 'mainnet' ? 'base' : 'baseSepolia',
  });

  void logAgentDetails(client);

  /* Sync the conversations from the network to update the local db */
  console.log('✓ Syncing conversations...');
  await client.conversations.sync();

  console.log('Waiting for messages...');
  const stream = await client.conversations.streamAllMessages();

  const horoscopeProcessor = new HoroscopeProcessor();

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

    console.log(
      `📨 Received message from ${addressFromInboxId}: ${message.content}`
    );

    // Send typing indicator first
    try {
      const typingContent: Typing = { isTyping: true };
      await conversation.send(typingContent, ContentTypeTyping);
    } catch (e) {
      console.error(
        `Error sending typing indicator to ${message.senderInboxId}:`,
        e
      );
    }

    try {
      // Ensure message content is a string
      const messageContent =
        typeof message.content === 'string'
          ? message.content
          : String(message.content);

      // Process the message with horoscope logic
      const response = await horoscopeProcessor.processMessage(
        messageContent,
        addressFromInboxId
      );

      // Send the horoscope response
      if (subname) {
        await conversation.sendWithFees(`${response}`, addressFromInboxId);
        console.log(`📤 Sent horoscope response to ${subname.ens}`);
      } else {
        await conversation.sendWithFees(response, addressFromInboxId);
        console.log(`📤 Sent horoscope response to ${addressFromInboxId}`);
      }
    } catch (error) {
      console.error('Error processing horoscope message:', error);
      await conversation.sendWithFees(
        'Sorry, I encountered an error reading the stars. Please try again! 🌟',
        addressFromInboxId
      );
    }

    console.log('Waiting for messages...');
  }
};

main().catch(console.error);
