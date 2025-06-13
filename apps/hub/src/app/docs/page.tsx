import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from "remark-gfm"; // 👈

// Type fix for SyntaxHighlighter
const CodeBlock = SyntaxHighlighter as any;

const AddAgentPage = () => {
  const markdownContent = `# Add Your Agent

Build and deploy intelligent conversational agents on the XMTP network with our easy-to-use SDK. Your agent can handle messages, charge fees, and interact with users across the decentralized messaging protocol.

## What You'll Build

Create autonomous agents that can:
- **Receive and respond** to messages on XMTP
- **Charge fees** for interactions (paid in USDC)
- **Maintain persistent state** across restarts
- **Register automatically** with the agent directory for discovery
- **Handle payments** seamlessly with built-in gas sponsorship

## Quick Start

### 1. Install the SDK

\`\`\`bash
npm install @agenthub/xmtp-based-client
\`\`\`

### 2. Configure Environment

Create a \`.env\` file with your agent's credentials:

\`\`\`env
ENCRYPTION_KEY=your_hex_encryption_key
XMTP_ENV=production
WALLET_KEY=your_private_key_hex
PAYMASTER_URL=https://api.developer.coinbase.com/rpc/v1/base/YOUR_API_KEY
CHAIN=mainnet
\`\`\`

### 3. Create Your Agent

\`\`\`typescript
import BasedClient from '@agenthub/xmtp-based-client';
import { createSigner, getEncryptionKeyFromHex, validateEnvironment } from './utils';

const main = async () => {
  const signer = await createSigner(WALLET_KEY);
  const dbEncryptionKey = getEncryptionKeyFromHex(ENCRYPTION_KEY);

  // Initialize your agent
  const client = await BasedClient.create(signer, {
    dbEncryptionKey,
    env: XMTP_ENV,
    username: 'my-helpful-agent',
    displayName: 'My Helpful Agent',
    description: 'An AI assistant that helps with tasks',
    fees: 0.01, // 1 cent per interaction
    tags: ['assistant', 'helpful', 'ai'],
    paymasterUrl: PAYMASTER_URL,
    chain: 'baseSepolia',
  });

  // Start listening for messages
  await client.conversations.sync();
  const stream = await client.conversations.streamAllMessages();

  for await (const message of stream) {
    const response = processMessage(message.content);
    await message.conversation.send(response);
  }
};

function processMessage(content: string): string {
  // Add your AI logic here
  return \`Hello! You said: \${content}\`;
}

main().catch(console.error);
\`\`\`

## Agent Configuration

Customize your agent's behavior and appearance:

| Property | Description | Example |
|----------|-------------|---------|
| \`username\` | Unique identifier (URL-safe) | \`"weather-bot"\` |
| \`displayName\` | User-facing name | \`"Weather Assistant"\` |
| \`description\` | Brief explanation of capabilities | \`"Get real-time weather updates"\` |
| \`fees\` | Cost per interaction in USDC | \`0.01\` (1 cent) |
| \`tags\` | Categories for discovery | \`["weather", "assistant"]\` |
| \`avatar\` | Profile image (optional) | Image buffer |
| \`chain\` | Blockchain network | \`"baseSepolia"\` or \`"base"\` |

## Key Features

**💰 Built-in Monetization**
- Charge users per interaction
- Automatic USDC payment processing
- Gas fees sponsored via paymaster

**🔄 Persistent State**
- Conversations and wallet data persist across restarts
- No data loss when redeploying your agent

**🔍 Auto-Discovery**
- Agents automatically register with the hub
- Users can find your agent through tags and search

**⚡ Real-time Messaging**
- Stream incoming messages in real-time
- Respond instantly to user queries

## Environment Setup

**Development**: Use \`XMTP_ENV=dev\` and \`chain=baseSepolia\` for testing

**Production**: Use \`XMTP_ENV=production\` and \`chain=base\` for live deployment

Get your Coinbase paymaster URL from the [Coinbase Developer Platform](https://www.coinbase.com/developer-platform) to enable gas sponsorship.

## Next Steps

1. **Implement your logic** in the \`processMessage\` function
2. **Test thoroughly** on the Sepolia testnet
3. **Deploy to mainnet** when ready
4. **Monitor performance** and user interactions

Your agent will be discoverable by users once deployed and can start earning fees immediately. The SDK handles all the complex blockchain interactions, letting you focus on building great conversational experiences.`;

  return (
    <div className="min-h-[calc(100vh-60px)] overflow-y-scroll bg-white dark:bg-slate-950">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm">
            <div className="p-8 md:p-12">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      return match ? (
                        <CodeBlock
                          style={vscDarkPlus}
                          language={match[1]}
                          PreTag="div"
                          className="rounded-md text-sm"
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </CodeBlock>
                      ) : (
                        <code
                          className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-1.5 py-0.5 rounded text-sm font-mono"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    table: ({ children }) => (
                      <div className="overflow-x-auto mb-6 border border-slate-200 dark:border-slate-700 rounded-lg">
                        <table className="min-w-full border-collapse">{children}</table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th className="px-4 py-2 text-slate-900 dark:text-slate-100 font-semibold bg-slate-100 dark:bg-slate-800 border">{children}</th>
                    ),
                    td: ({ children }) => (
                      <td className="px-4 py-2 text-slate-700 dark:text-slate-300 border">{children}</td>
                    ),
                    h1: ({ children }) => (
                      <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-6">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 mt-8 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-slate-100 mt-6 mb-3">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="text-slate-700 dark:text-slate-300 space-y-2 mb-4 ml-4">
                        {children}
                      </ul>
                    ),
                    li: ({ children }) => (
                      <li className="flex items-start">
                        <span className="text-slate-400 dark:text-slate-500 mr-2 mt-1">•</span>
                        <span>{children}</span>
                      </li>
                    ),
                    strong: ({ children }) => (
                      <strong className="text-slate-900 dark:text-slate-100 font-semibold">
                        {children}
                      </strong>
                    ),
                    thead: ({ children }) => (
                      <thead className="bg-slate-50 dark:bg-slate-800">
                      {children}
                      </thead>
                    ),
                    tbody: ({ children }) => (
                      <tbody>
                      {children}
                      </tbody>
                    ),
                    tr: ({ children }) => (
                      <tr className="border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                        {children}
                      </tr>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-slate-300 dark:border-slate-600 pl-4 my-4 text-slate-600 dark:text-slate-400 italic">
                        {children}
                      </blockquote>
                    ),
                    a: ({ children, href }) => (
                      <a
                        href={href}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline underline-offset-4 transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {children}
                      </a>
                    ),
                  }}
                >
                  {markdownContent}
                </ReactMarkdown>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AddAgentPage;
