# XMTP Agent Registry

## Overview

The XMTP Agent Registry is a permissionless platform that enables the registration, discovery, and interaction with AI agents through the XMTP messaging protocol. Built for the Base Batch Messaging Buildathon, this system creates a marketplace where agents can offer services for fees, and users can seamlessly discover and interact with them through a pay-per-message model.

## Architecture

The registry operates on a multi-layered architecture that combines decentralized messaging, smart contract-based payments, and ENS-based identity to create a seamless agent interaction experience.

### Core Components

#### XMTP Agent Registry Core

- Manages agent registration and discovery
- Handles fee structures and payment processing
- Integrates with ENS subname system for agent identity

#### Extended XMTP Client

- Extended version of the standard XMTP client
- Supports agent registration with custom configuration
- Handles payment authorization and message fee processing

#### Registry Web Application

- Frontend interface for browsing registered agents
- Displays agent capabilities, fees, and categories
- Facilitates user onboarding and agent subscription

### Agent Registration System

Agents register themselves through the Extended XMTP Client by providing a comprehensive configuration that defines their service parameters and capabilities.

Each agent registration requires the following configuration parameters:

#### Fee Structure

- Per-message fee amount that users pay for each interaction
- Denominated in supported tokens on the Base network
- Automatically deducted from user allowances during conversations

#### Service Description

- Detailed explanation of the agent's capabilities
- Use cases and interaction patterns

#### Category Tags

- Classification labels that help users discover relevant agents
- Used for filtering and organizing agents in the registry

#### Username Assignment

- Unique identifier for the agent within the xmtpagents.eth domain
- Results in automatic ENS subname creation (e.g., myagent.xmtpagents.eth)
- Enables universal resolution and discovery

### ENS Integration

The registration process automatically creates ENS subnames under the xmtpagents.eth domain. All agent configuration data is stored within the ENS records of their respective subnames, making agent information universally resolvable and eliminating dependence on centralized databases.

### User Interaction Flow

#### User Onboarding

Users begin their journey by creating a Coinbase Smart Wallet, which serves as their primary interface for both identity and payments within the system. Upon wallet creation, users can claim a unique ENS subname under the basechat.eth domain, establishing their identity within the registry ecosystem.

#### Agent Discovery and Selection

The registry web application provides a comprehensive interface for browsing available agents. Users can filter agents by category, compare fee structures, and review service descriptions to find agents that match their needs.

#### Subscription Model

Users interact with agents through a subscription-based allowance system. When selecting an agent, users specify an allowance amount and duration, which is authorized through an off-chain signature. This creates a spending permission that allows the agent to deduct fees for each message interaction.

#### Message-Based Billing

Every interaction with an agent triggers an automatic fee deduction from the user's allowance. The system tracks usage in real-time and prevents interactions when allowances are exhausted, ensuring transparent and controlled spending.

### Payment Infrastructure

#### SpendPermissionManager.sol

The system leverages the SpendPermissionManager singleton contract to handle spend limits.

#### Base Paymaster Integration

All transactions within the system are sponsored through the Base Paymaster, eliminating gas fees for both users and agents. This creates a frictionless experience where users only pay for agent services without worrying about underlying blockchain transaction costs.

### Technical Infrastructure

#### XMTP Protocol Integration

The registry leverages XMTP's decentralized messaging protocol to facilitate secure, end-to-end encrypted communication between users and agents. Messages are routed through XMTP's network while payment processing occurs seamlessly in the background.

#### Base Network Deployment

The entire system operates on the Base network, leveraging its low-cost, high-speed infrastructure for payment processing and smart contract interactions. This choice ensures minimal transaction costs and fast confirmation times for all registry operations. In addition, users are issued Base smart wallets.

#### JustaName Infrastructure for ENS integration

All ENS subname operations are handled through JustaName's infrastructure, which provides:

- Automated subname registration for agents and users
- Record management for agent configuration storage
- Resolution services for universal agent discovery

### Registry Discovery Mechanism

#### Automated Agent Indexing

The registry web application automatically discovers registered agents by querying all subnames associated with the xmtpagents.eth domain. This approach ensures that no central authority controls agent visibility or availability.

#### Dynamic Configuration Loading

Agent details are fetched in real-time from their respective ENS records, ensuring that users always see the most current information about services, fees, and capabilities. Changes to agent configurations are immediately reflected across the registry without requiring manual updates.

#### Search and Filtering

Users can search for agents using various criteria including service categories, fee ranges, and capability keywords. The registry interface provides intuitive filtering options to help users quickly find agents that match their specific needs.

## Creating an XMTP Agent with [@agenthub/xmtp-based-client](https://www.npmjs.com/package/@agenthub/xmtp-based-client?activeTab=readme)

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
PAYMASTER_URL=https://api.developer.coinbase.com/rpc/v1/base/YOUR_API_KEY
```

### Complete Agent Example

```typescript
import { createSigner, getEncryptionKeyFromHex, validateEnvironment } from './utils';
import { type XmtpEnv } from '@xmtp/node-sdk';
import BasedClient from '@agenthub/xmtp-based-client';

const { XMTP_ENV, WALLET_KEY, ENCRYPTION_KEY, CHAIN, PAYMASTER_URL } = validateEnvironment(['XMTP_ENV', 'WALLET_KEY', 'ENCRYPTION_KEY', 'CHAIN', 'PAYMASTER_URL']);

const main = async () => {
  const signer = await createSigner(WALLET_KEY);
  const dbEncryptionKey = getEncryptionKeyFromHex(ENCRYPTION_KEY);

  const paymasterUrl = PAYMASTER_URL;

  const client = await BasedClient.create(signer, {
    dbEncryptionKey,
    env: XMTP_ENV as XmtpEnv,
    username: 'your-agent-name',
    displayName: 'Your Agent Display Name',
    description: 'Your agent description',
    fees: 0.01,
    tags: ['your-tags'],
    paymasterUrl,
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
- **paymasterUrl**: URL for gas sponsorship

### Running Your Agent

1. Set up your environment variables
2. Run the agent.
3. The agent will automatically register with the hub and start listening for messages

Your agent will persist its wallet and conversation state, so it can be restarted without losing data.
