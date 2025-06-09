import fs from 'fs';
// import { Coinbase, Wallet, type WalletData } from '@coinbase/coinbase-sdk';
import {
  createSigner,
  getEncryptionKeyFromHex,
  logAgentDetails,
  validateEnvironment,
} from '@agenthub/xmtp-helpers';
import { type XmtpEnv } from '@xmtp/node-sdk';
import BasedClient from '@agenthub/xmtp-extended-client';
import {
  ContentTypeTyping,
  TypingCodec,
  type Typing,
} from '@agenthub/xmtp-content-type-typing';

/* Get the wallet key associated to the public key of
 * the agent and the encryption key for the local db
 * that stores your agent's messages */
const { XMTP_ENV, WALLET_KEY, ENCRYPTION_KEY, CHAIN } = validateEnvironment([
  'XMTP_ENV',
  'WALLET_KEY',
  'ENCRYPTION_KEY',
  'CHAIN',
]);

const main = async () => {
  // const walletData = await initializeWallet(WALLET_PATH);
  /* Create the signer using viem and parse the encryption key for the local db */
  const signer = await createSigner(WALLET_KEY);

  const dbEncryptionKey = getEncryptionKeyFromHex(ENCRYPTION_KEY);
  const avatar = fs.readFileSync(
    process.cwd() + '/agents/xmtp-gm-agent/src/gm.gif'
  );
  const client = await BasedClient.create(signer, {
    dbEncryptionKey,
    env: XMTP_ENV as XmtpEnv,
    username: 'test',
    avatar,
    displayName: 'The GM Agent',
    description: 'Gm Agent',
    fees: 0.05,
    codecs: [new TypingCodec()],
    tags: ['gm'],
    chain: CHAIN === 'mainnet' ? 'base' : 'baseSepolia',
  });

  void logAgentDetails(client);

  /* Sync the conversations from the network to update the local db */
  console.log('✓ Syncing conversations...');
  await client.conversations.sync();

  console.log('Waiting for messages...');
  const stream = await client.conversations.streamAllMessages();

  for await (const message of stream) {
    if (!message) {
      continue;
    }
    if (message.senderInboxId.toLowerCase() === client.inboxId.toLowerCase()) {
      continue; // Ignore messages from self
    }

    // Check if the message content type is the typing indicator
    if (
      message.contentType?.authorityId === ContentTypeTyping.authorityId &&
      message.contentType?.typeId === ContentTypeTyping.typeId
    ) {
      console.log(
        `Ignoring typing indicator message from ${message.senderInboxId}`
      );
      continue; // Ignore typing indicator messages
    }

    // Ensure we only process text messages for replies
    if (message.contentType?.typeId !== 'text') {
      console.log(
        `Ignoring non-text message of type: ${
          message.contentType?.toString() ?? 'unknown type'
        } from ${message.senderInboxId}`
      );
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
    // Send typing indicator first
    try {
      const typingContent: Typing = { isTyping: true };
      await conversation.send(typingContent, ContentTypeTyping);
      console.log(`Sent typing indicator to ${addressFromInboxId}`);
    } catch (e) {
      console.error(
        `Error sending typing indicator to ${addressFromInboxId}:`,
        e
      );
    }

    if (subname) {
      await conversation.sendWithFees(`gm ${subname.ens}`, addressFromInboxId);
    } else {
      await conversation.sendWithFees('gm', addressFromInboxId);
    }

    console.log('Waiting for messages...');
  }
};

/**
 * Generates a random Smart Contract Wallet
 * @param networkId - The network ID (e.g., 'base-sepolia', 'base-mainnet')
 * @returns WalletData object containing all necessary wallet information
 */

// async function initializeWallet(walletPath: string): Promise<WalletData> {
//   try {
//     let walletData: WalletData | null = null;
//     if (fs.existsSync(walletPath)) {
//       const data = fs.readFileSync(walletPath, "utf8");
//       walletData = JSON.parse(data) as WalletData;
//       return walletData;
//     } else {
//       console.log(`Creating wallet on network: ${NETWORK_ID}`);
//       Coinbase.configure({
//         apiKeyName: CDP_API_KEY_NAME,
//         privateKey: CDP_API_KEY_PRIVATE_KEY,
//       });
//       const wallet = await Wallet.create({
//         networkId: NETWORK_ID,
//       });
//
//       console.log("Wallet created successfully, exporting data...");
//       const data = wallet.export();
//       console.log("Getting default address...");
//       const walletInfo: WalletData = {
//         seed: data.seed || "",
//         walletId: wallet.getId() || "",
//         networkId: wallet.getNetworkId(),
//       };
//
//       fs.writeFileSync(walletPath, JSON.stringify(walletInfo, null, 2));
//       console.log(`Wallet data saved to ${walletPath}`);
//       return walletInfo;
//     }
//   } catch (error) {
//     console.error("Error creating wallet:", error);
//     throw error;
//   }
// }

main().catch(console.error);
