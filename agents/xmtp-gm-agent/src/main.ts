import fs from 'fs';
import {
  createSigner,
  getEncryptionKeyFromHex,
  logAgentDetails,
  validateEnvironment,
} from '@agenthub/xmtp-helpers';
import { type XmtpEnv } from '@xmtp/node-sdk';
import BasedClient from '@agenthub/xmtp-based-client';

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
  // const walletData = await initializeWallet(WALLET_PATH);
  /* Create the signer using viem and parse the encryption key for the local db */
  const signer = await createSigner(WALLET_KEY);

  const dbEncryptionKey = getEncryptionKeyFromHex(ENCRYPTION_KEY);
  const avatar = fs.readFileSync(
    process.cwd() + '/agents/xmtp-gm-agent/src/gm.gif'
  );

  const paymasterUrl = PAYMASTER_URL;

  const client = await BasedClient.create(signer, {
    dbEncryptionKey,
    env: XMTP_ENV as XmtpEnv,
    username: 'gm',
    avatar,
    displayName: 'The GM Agent',
    description: 'Gm Agent',
    fees: 0.05,
    tags: ['gm'],
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

    console.log(`Sending "gm" response to ${addressFromInboxId}...`);
    if (subname) {
      await conversation.sendWithFees(`gm ${subname.ens}`, addressFromInboxId);
    } else {
      await conversation.sendWithFees('gm', addressFromInboxId);
    }

    console.log('Waiting for messages...');
  }
};

main().catch(console.error);
