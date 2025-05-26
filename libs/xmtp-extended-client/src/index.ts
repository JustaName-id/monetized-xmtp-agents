import { Client, Conversation, Dm, Group, Signer, ClientOptions } from '@xmtp/node-sdk';
import type { ContentTypeId } from '@xmtp/content-type-primitives'
import {JustaName} from "@justaname.id/sdk";
import { getAddress } from 'viem'
/**
 * BasedClient extends the XMTP Client with additional functionality
 */
export class BasedClient extends Client {
  /**
   * Creates a new BasedClient instance with a signer
   *
   * @param signer - The signer to use for authentication
   * @param options - Optional configuration for the client
   * @returns A new BasedClient instance
   */
  static override async create(
    signer: Signer,
    options?: ClientOptions & { username?: string, fees?: number, description?: string, tags?: string[], spender?:number  }
  ): Promise<BasedClient> {
    // Call the original create method
    const client = await Client.create(signer, options);

    if(!options?.username || !client.accountIdentifier?.identifier ){
      return client as unknown as BasedClient;
    }

    const clientAddress = getAddress(client.accountIdentifier?.identifier)

    if(!clientAddress) throw new Error(
      "Client address is not defined"
    )

    const ensDomain = "justadev.eth";
    const justanameInstance = JustaName.init({
      ensDomains: [{
        apiKey: "",
        chainId: 1,
        ensDomain
      }],
    })

    const subnames = await justanameInstance.subnames.getSubnamesByAddress({
      address: clientAddress,
    });


    const registrySubname = subnames.subnames.find((_subname) => _subname.ens.endsWith(ensDomain))
    const challenge = justanameInstance.siwe.requestChallenge({
      origin:"http://localhost",
      domain:"localhost:3000",
      chainId:1,
      ttl: 100000,
      address: clientAddress,
    })


    const text = {} as Record<string, string>

    if(options.description) text["description"] = options.description
    if(options.tags) text["xmtp_tags"] = options.tags.join(",")
    if(options.fees) text["xmtp_fees"] = options.fees.toString()
    if(options.spender){
      text["xmtp_spender"] = options.spender.toString()
    }else{
      text["xmtp_spender"] = clientAddress
    }

    const signatureUint8Array = await signer.signMessage(challenge.challenge);
    const signatureHex = "0x"+Array.from(signatureUint8Array, (byte) =>
      byte.toString(16).padStart(2, '0')
    ).join('');

    if(registrySubname) {
      await justanameInstance.subnames.updateSubname({
        addresses: [{coinType: '60', address: clientAddress}],
        ensDomain: ensDomain,
        username: options.username,
        text: text,
      }, {
        xMessage: challenge.challenge,
        xSignature: signatureHex,
        xAddress: clientAddress
      })
    }
    else{
      await justanameInstance.subnames.addSubname({
        addresses: [{coinType: '60', address: clientAddress}],
        ensDomain: ensDomain,
        username: options.username,
        text: text,
      }, {
        xMessage: challenge.challenge,
        xSignature: signatureHex,
        xAddress: clientAddress
      })
    }


    console.log(`Subname Registered: ${options.username}.${ensDomain}`)
    // Cast the client to BasedClient
    return client as unknown as BasedClient;
  }

  /**
   * Gets a wrapped conversation that adds functionality before sending messages
   *
   * @param conversation - The original conversation
   * @returns A wrapped conversation with enhanced functionality
   */
  wrapConversation<T extends Conversation>(conversation: T): T {
    // Store the original send method
    const originalSend = conversation.send.bind(conversation);

    // Override the send method
    conversation.send = async (
      content: unknown,
      contentType?: ContentTypeId
    ): Promise<string> => {
      // Placeholder for pre-send functionality
      console.log('Before sending message');
      // TODO: Implement pre-send functionality

      // Call the original send method
      return originalSend(content, contentType);
    };

    return conversation;
  }

  /**
   * Gets the conversations manager for this client with wrapped conversations
   */
  override get conversations() {
    const originalConversations = super.conversations;

    // Wrap methods that return conversations
    const originalGetConversationById =
      originalConversations.getConversationById.bind(originalConversations);
    originalConversations.getConversationById = async (id: string): Promise<Dm | Group | undefined> => {
      const conversation = await originalGetConversationById(id);
      if (conversation) {
        return this.wrapConversation(conversation);
      }
      return conversation;
    };

    const originalGetDmByInboxId = originalConversations.getDmByInboxId.bind(
      originalConversations
    );
    originalConversations.getDmByInboxId = (inboxId: string): Dm | undefined => {
      const conversation = originalGetDmByInboxId(inboxId);
      if (conversation) {
        return this.wrapConversation(conversation);
      }
      return conversation;
    };

    const originalNewGroupWithIdentifiers =
      originalConversations.newGroupWithIdentifiers.bind(originalConversations);
    originalConversations.newGroupWithIdentifiers = async (
      identifiers,
      options
    ): Promise<Group> => {
      const conversation = await originalNewGroupWithIdentifiers(
        identifiers,
        options
      );
      return this.wrapConversation(conversation);
    };

    const originalNewGroup = originalConversations.newGroup.bind(
      originalConversations
    );
    originalConversations.newGroup = async (inboxIds, options): Promise<Group> => {
      const conversation = await originalNewGroup(inboxIds, options);
      return this.wrapConversation(conversation);
    };

    const originalNewDmWithIdentifier =
      originalConversations.newDmWithIdentifier.bind(originalConversations);
    originalConversations.newDmWithIdentifier = async (identifier, options): Promise<Dm> => {
      const conversation = await originalNewDmWithIdentifier(
        identifier,
        options
      );
      return this.wrapConversation(conversation);
    };

    const originalNewDm = originalConversations.newDm.bind(
      originalConversations
    );
    originalConversations.newDm = async (inboxId, options): Promise<Dm> => {
      const conversation = await originalNewDm(inboxId, options);
      return this.wrapConversation(conversation);
    };

    const originalList = originalConversations.list.bind(originalConversations);
    originalConversations.list = async (options): Promise<(Dm | Group)[]> => {
      const conversations = await originalList(options);
      return conversations.map((conversation) =>
        this.wrapConversation(conversation)
      );
    };

    return originalConversations;
  }
}

export default BasedClient;
