import {
  createSigner,
  getEncryptionKeyFromHex,
  logAgentDetails,
  validateEnvironment,
} from '@xmtpbasement/xmtp-helpers';
import { IdentifierKind, type XmtpEnv } from '@xmtp/node-sdk';
import { BasedClient } from '@xmtpbasement/xmtp-extended-client';

/* Get the wallet key associated to the public key of
 * the agent and the encryption key for the local db
 * that stores your agent's messages */
const { WALLET_KEY, ENCRYPTION_KEY, XMTP_ENV } = validateEnvironment([
  "WALLET_KEY",
  "ENCRYPTION_KEY",
  "XMTP_ENV",
]);

/* Create the signer using viem and parse the encryption key for the local db */
const signer = createSigner(WALLET_KEY);
const dbEncryptionKey = getEncryptionKeyFromHex(ENCRYPTION_KEY);

async function main() {
  const client = await BasedClient.create(signer, {
    dbEncryptionKey,
    env: XMTP_ENV as XmtpEnv,
    username: "xmtp-ens-agent",
    fees: 0.02,
    description:"This is a GM Agent",
    tags: ["GM Agent", "ENS Agent", "ENS"],
    hubUrl: "http://localhost:3000/api"
  });

  void logAgentDetails(client);

  console.log("✓ Syncing conversations...");
  await client.conversations.sync();

  console.log("Waiting for messages...");
  const stream = await client.conversations.streamAllMessages();


  const dmWithIdentifier = await client.conversations.newDmWithIdentifier({
    identifier: "0xfb50cde9c04B52FAfC614eF45C50C33Ae34A37A3",
    identifierKind: IdentifierKind.Ethereum
  })

  console.log(dmWithIdentifier)

  const a  = await dmWithIdentifier.sendWithFees("hey", "0xfb50cde9c04B52FAfC614eF45C50C33Ae34A37A3")
  console.log(a)
  // if(existingId){
  //   inboxId = existingId
  // } else{
  //   inboxId = await client.conversations.newGroup([inboxId])
  // }
  //

  for await (const message of stream) {
    if (
      message?.senderInboxId.toLowerCase() === client.inboxId.toLowerCase() ||
      message?.contentType?.typeId !== "text"
    ) {
      continue;
    }

    const conversation = await client.conversations.getConversationById(
      message.conversationId,
    );

    if (!conversation) {
      console.log("Unable to find conversation, skipping");
      continue;
    }

    const inboxState = await client.preferences.inboxStateFromInboxIds([
      message.senderInboxId,
    ]);

    const addressFromInboxId = inboxState[0].identifiers[0].identifier;
    console.log(`Sending "gm" response to ${addressFromInboxId}...`);
    await conversation.sendWithFees(`gm`, addressFromInboxId);

    console.log("Waiting for messages...");
  }
}

main().catch(console.error);
