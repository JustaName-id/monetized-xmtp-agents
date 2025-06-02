# Creating an XMTP Agent with @agenthub/xmtp-extended-client

## Prerequisites

Install the required dependencies:

```bash
npm install @agenthub/xmtp-extended-client @agenthub/xmtp-helpers @coinbase/coinbase-sdk @xmtp/node-sdk
```

## Environment Setup

Create a `.env` file with the following variables:

```env
ENCRYPTION_KEY=your_hex_encryption_key
XMTP_ENV=dev  # or 'production'
NETWORK_ID=base-sepolia  # or 'base-mainnet'
CDP_API_KEY_NAME=your_cdp_api_key_name
CDP_API_KEY_PRIVATE_KEY=your_cdp_private_key
```

## Complete Agent Example

```typescript
import fs from 'fs';
import { Coinbase, Wallet, type WalletData } from '@coinbase/coinbase-sdk';
import { createSigner, getEncryptionKeyFromHex, logAgentDetails, validateEnvironment } from '@agenthub/xmtp-helpers';
import { type XmtpEnv } from '@xmtp/node-sdk';
import BasedClient from '@agenthub/xmtp-extended-client';

const WALLET_PATH = 'wallet.json';

// Validate required environment variables
const { XMTP_ENV, ENCRYPTION_KEY, NETWORK_ID, CDP_API_KEY_NAME, CDP_API_KEY_PRIVATE_KEY } = validateEnvironment(['XMTP_ENV', 'ENCRYPTION_KEY', 'NETWORK_ID', 'CDP_API_KEY_NAME', 'CDP_API_KEY_PRIVATE_KEY']);

const main = async () => {
  // Initialize or load existing wallet
  const walletData = await initializeWallet(WALLET_PATH);

  // Create signer and encryption key
  const signer = await createSigner(walletData.seed);
  const dbEncryptionKey = getEncryptionKeyFromHex(ENCRYPTION_KEY);

  // Optional: Load avatar image
  const avatar = fs.readFileSync(process.cwd() + '/path/to/avatar.jpg');

  // Create the agent client
  const client = await BasedClient.create(signer, {
    dbEncryptionKey,
    env: XMTP_ENV as XmtpEnv,
    username: 'your-agent-name',
    avatar, // Optional
    displayName: 'Your Agent Display Name',
    description: 'Your agent description',
    fees: 0.01, // Fee in USDC
    tags: ['your-tags'],
    chain: 'baseSepolia',
  });

  // Log agent details for debugging
  void logAgentDetails(client);

  // Sync existing conversations
  console.log('✓ Syncing conversations...');
  await client.conversations.sync();

  console.log('Waiting for messages...');
  const stream = await client.conversations.streamAllMessages();

  // Process incoming messages
  for await (const message of stream) {
    // Skip own messages and non-text messages
    if (message?.senderInboxId.toLowerCase() === client.inboxId.toLowerCase() || message?.contentType?.typeId !== 'text') {
      continue;
    }

    const conversation = await client.conversations.getConversationById(message.conversationId);

    if (!conversation) {
      console.log('Unable to find conversation, skipping');
      continue;
    }

    // Get sender information
    const inboxState = await client.preferences.inboxStateFromInboxIds([message.senderInboxId]);
    const addressFromInboxId = inboxState[0].identifiers[0].identifier;
    const subname = await client.subnameByAddress(addressFromInboxId);

    console.log(`Processing message from ${addressFromInboxId}: ${message.content}`);

    // Send response (customize this logic for your agent)
    const response = processMessage(message.content);

    if (subname) {
      await conversation.sendWithFees(`${response} ${subname.ens}`, addressFromInboxId);
    } else {
      await conversation.sendWithFees(response, addressFromInboxId);
    }

    console.log('Waiting for messages...');
  }
};

// Add your message processing logic here
function processMessage(messageContent: string): string {
  // Example: Simple echo or custom logic
  return `You said: ${messageContent}`;
}

// Wallet initialization function
async function initializeWallet(walletPath: string): Promise<WalletData> {
  try {
    // Load existing wallet if it exists
    if (fs.existsSync(walletPath)) {
      const data = fs.readFileSync(walletPath, 'utf8');
      return JSON.parse(data) as WalletData;
    }

    // Create new wallet
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

    const walletInfo: WalletData = {
      seed: data.seed || '',
      walletId: wallet.getId() || '',
      networkId: wallet.getNetworkId(),
    };

    // Save wallet data for future use
    fs.writeFileSync(walletPath, JSON.stringify(walletInfo, null, 2));
    console.log(`Wallet data saved to ${walletPath}`);
    return walletInfo;
  } catch (error) {
    console.error('Error creating wallet:', error);
    throw error;
  }
}

// Start the agent
main().catch(console.error);
```

## Key Configuration Options

When creating your agent with `BasedClient.create()`:

- **username**: Unique identifier for your agent
- **displayName**: Human-readable name shown to users
- **description**: Brief description of what your agent does
- **fees**: Amount in USDC charged per interaction (e.g., 0.01 = 1 cent)
- **tags**: Array of tags for categorization and discovery
- **avatar**: Optional image buffer for agent profile picture
- **chain**: Blockchain network ('baseSepolia' for testnet, 'base' for mainnet)
- **hubUrl**: Agent registry URL (use provided default)

## Customization

Replace the `processMessage()` function with your own logic:

```typescript
function processMessage(messageContent: string): string {
  const message = messageContent.toLowerCase().trim();

  if (message.includes('hello') || message.includes('hi')) {
    return 'Hello! How can I help you today?';
  }

  if (message.includes('help')) {
    return 'I can assist you with various tasks. What do you need help with?';
  }

  return 'Thanks for your message! I received: ' + messageContent;
}
```

## Running Your Agent

1. Set up your environment variables
2. Run the agent.
3. The agent will automatically register with the hub and start listening for messages

Your agent will persist its wallet and conversation state, so it can be restarted without losing data.
