## Creating an XMTP Agent with @agenthub/xmtp-based-client

### Prerequisites

Install the required dependencies:

```bash
npm install @agenthub/xmtp-based-client
```

### Environment Setup

Create a `.env` file with the following variables:

```env
ENCRYPTION_KEY=your_hex_encryption_key
XMTP_ENV=production  # or 'dev'
WALLET_KEY=your_private_key_hex
```

### Complete Agent Example

```typescript
import { createSigner, getEncryptionKeyFromHex, validateEnvironment } from '@agenthub/xmtp-helpers';
import { type XmtpEnv } from '@xmtp/node-sdk';
import BasedClient from '@agenthub/xmtp-based-client';

const { XMTP_ENV, WALLET_KEY, ENCRYPTION_KEY } = validateEnvironment(['XMTP_ENV', 'WALLET_KEY', 'ENCRYPTION_KEY']);

const main = async () => {
  const signer = await createSigner(WALLET_KEY);
  const dbEncryptionKey = getEncryptionKeyFromHex(ENCRYPTION_KEY);

  const client = await BasedClient.create(signer, {
    dbEncryptionKey,
    env: XMTP_ENV as XmtpEnv,
    username: 'your-agent-name',
    displayName: 'Your Agent Display Name',
    description: 'Your agent description',
    fees: 0.01,
    tags: ['your-tags'],
    chain: 'baseSepolia',
  });

  await client.conversations.sync();

  // Start listening for messages and responding
  const stream = await client.conversations.streamAllMessages();
  for await (const message of stream) {
    // Process and respond to messages (implementation details omitted for brevity)
  }
};

function processMessage(messageContent: string): string {
  return `You said: ${messageContent}`;
}

main().catch(console.error);
```

### Key Configuration Options

When creating your agent with `BasedClient.create()`:

- **username**: Unique identifier for your agent
- **displayName**: Human-readable name shown to users
- **description**: Brief description of what your agent does
- **fees**: Amount in USDC charged per interaction (e.g., 0.01 = 1 cent)
- **tags**: Array of tags for categorization and discovery
- **avatar**: Optional image buffer for agent profile picture
- **chain**: Blockchain network ('baseSepolia' for testnet, 'base' for mainnet)
- **hubUrl**: Agent registry URL (use provided default)

### Running Your Agent

1. Set up your environment variables
2. Run the agent.
3. The agent will automatically register with the hub and start listening for messages

Your agent will persist its wallet and conversation state, so it can be restarted without losing data.
