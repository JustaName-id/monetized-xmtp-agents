import fs from 'fs';
import { Coinbase, Wallet, type WalletData } from '@coinbase/coinbase-sdk';
import {
  createSigner,
  getEncryptionKeyFromHex,
  logAgentDetails,
  validateEnvironment,
} from '@agenthub/xmtp-helpers';
import { type XmtpEnv } from '@xmtp/node-sdk';
import BasedClient from '@agenthub/xmtp-extended-client';
import { HoroscopeProcessor } from './horoscope-processor.js';

const WALLET_PATH = 'wallet-horoscope.json';

/* Get the wallet key associated to the public key of
 * the agent and the encryption key for the local db
 * that stores your agent's messages */
const {
  XMTP_ENV,
  ENCRYPTION_KEY,
  NETWORK_ID,
  CDP_API_KEY_NAME,
  CDP_API_KEY_PRIVATE_KEY,
} = validateEnvironment([
  'XMTP_ENV',
  'ENCRYPTION_KEY',
  'NETWORK_ID',
  'CDP_API_KEY_NAME',
  'CDP_API_KEY_PRIVATE_KEY',
]);

const main = async () => {
  const walletData = await initializeWallet(WALLET_PATH);
  /* Create the signer using viem and parse the encryption key for the local db */
  const signer = await createSigner(walletData.seed);

  const dbEncryptionKey = getEncryptionKeyFromHex(ENCRYPTION_KEY);
  const avatar = fs.readFileSync(
    process.cwd() + '/agents/xmtp-horoscope-agent/src/horoscope.jpg'
  );
  const client = await BasedClient.create(signer, {
    dbEncryptionKey,
    env: XMTP_ENV as XmtpEnv,
    username: 'horoscope',
    avatar,
    displayName: 'The horoscope Agent',
    description:
      "Your personal astrology companion on XMTP! Get authentic daily horoscope readings powered by professional astrologers. Simply tell the agent your zodiac sign or birthday, and receive personalized cosmic insights including your mood, lucky numbers, colors, and compatibility. Ask for today's reading, peek into tomorrow, or check yesterday's stars. Works with all 12 zodiac signs and delivers real-time astrological guidance straight to your XMTP messages.",
    fees: 0.01, // 0.01 USDC
    tags: ['astrology'],
    hubUrl: 'http://localhost:3000/api',
    chain: 'baseSepolia',
    walletPath: WALLET_PATH, // Pass the wallet path here
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

/**
 * Generates a random Smart Contract Wallet
 * @param networkId - The network ID (e.g., 'base-sepolia', 'base-mainnet')
 * @returns WalletData object containing all necessary wallet information
 */

async function initializeWallet(walletPath: string): Promise<WalletData> {
  try {
    let walletData: WalletData | null = null;
    if (fs.existsSync(walletPath)) {
      const data = fs.readFileSync(walletPath, 'utf8');
      walletData = JSON.parse(data) as WalletData;
      return walletData;
    } else {
      console.log(`Creating wallet on network: ${NETWORK_ID}`);
      Coinbase.configure({
        apiKeyName: CDP_API_KEY_NAME,
        privateKey: CDP_API_KEY_PRIVATE_KEY,
      });
      const wallet = await Wallet.create({
        networkId: NETWORK_ID,
      });

      console.log('Wallet created successfully, exporting data...');
      const data = wallet.export();
      console.log('Getting default address...');
      const walletInfo: WalletData = {
        seed: data.seed || '',
        walletId: wallet.getId() || '',
        networkId: wallet.getNetworkId(),
      };

      fs.writeFileSync(walletPath, JSON.stringify(walletInfo, null, 2));
      console.log(`Wallet data saved to ${walletPath}`);
      return walletInfo;
    }
  } catch (error) {
    console.error('Error creating wallet:', error);
    throw error;
  }
}

main().catch(console.error);
