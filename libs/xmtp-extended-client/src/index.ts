import { Client, Conversation, Dm, Group, Signer, ClientOptions } from '@xmtp/node-sdk';
import type { ContentTypeId } from '@xmtp/content-type-primitives'
import {
  JustaName,
  SubnameResponse,
} from "@justaname.id/sdk";
import { getAddress } from 'viem'
import axios from "axios";
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

  subname: string | undefined;
  fees=0;
  description: string | undefined;
  tags: string[] = [];
  hubUrl: string | undefined;


  static override async create(
    signer: Signer,
    options?: ClientOptions & {
      username?: string,
      fees?: number,
      description?: string,
      tags?: string[],
      hubUrl?: string,
    }
  ): Promise<BasedClient> {
    // Call the original create method
    const client = await Client.create(signer, options);

    const hubUrl = options?.hubUrl || "https://xmtp-agent-hub.vercel.app/api";
    const fees = options?.fees || 0;
    const description = options?.description;
    const tags = options?.tags || [];
    const username = options?.username || "";

    if(!username || !client.accountIdentifier?.identifier ){
      return client as unknown as BasedClient;
    }

    const clientAddress = getAddress(client.accountIdentifier?.identifier)

    if(!clientAddress) throw new Error(
      "Client address is not defined"
    )

    const justanameInstance = JustaName.init()

    const challenge = justanameInstance.siwe.requestChallenge({
      origin:"http://localhost",
      domain:"localhost:3000",
      chainId:1,
      ttl: 100000,
      address: clientAddress,
    })


    const text = {} as Record<string, string>

    if(description) text["description"] = description
    if(tags.length === 0){
      text["xmtp_tags"] = ""
    }else{
      text["xmtp_tags"] = tags.join(",")
    }
    if(fees) text["xmtp_fees"] = fees.toString()



    const signatureUint8Array = await signer.signMessage(challenge.challenge);
    const signatureHex = "0x"+Array.from(signatureUint8Array, (byte) =>
      byte.toString(16).padStart(2, '0')
    ).join('');

    // let agentSubnames: SubnameGetAllByAddressResponse | undefined;
    // try {
    //   agentSubnames = await justanameInstance.subnames.getSubnamesByAddress({
    //     address: clientAddress
    //   })
    // }catch (e){
    //   agentSubnames = undefined;
    // }
    //
    //
    // if(agentSubnames && agentSubnames?.subnames.length > 0){
    //   const address = subnameExists.records.coins.find((coin) => coin.id===60)
    //   if(address && address.value !==clientAddress){
    //     throw new Error("Username taken! Please try another one")
    //   }
    // }

    const subnames = await justanameInstance.subnames.getSubnamesByAddress({
      address: clientAddress,
    });


    const registrySubname = subnames.subnames.find((_subname) => _subname.ens.startsWith(username))

    let ensDomain = ''
    if(registrySubname) {
      ensDomain = registrySubname.ens.split(".").slice(1).join(".")
      await justanameInstance.subnames.updateSubname({
        addresses: [{coinType: '60', address: clientAddress}],
        ensDomain,
        username: username,
        text: text,
      }, {
        xMessage: challenge.challenge,
        xSignature: signatureHex,
        xAddress: clientAddress
      })
    }
    else {
      try{
        const newSubname = await axios.post<SubnameResponse>(hubUrl+"/subnames/add", {
          username,
          address: clientAddress,
          signature: signatureHex,
          message: challenge.challenge,
          text,
          agent: true
        })
        ensDomain = newSubname.data.ens.split(".").slice(1).join(".")
      }catch (e){
        console.log(e)
        throw new Error("Failed to register subname")
      }

    }


    const baseClient = client as unknown as BasedClient

    const subname = username + "." + ensDomain;
    baseClient.subname =subname
    baseClient.fees = options?.fees || 0
    baseClient.description = options?.description
    baseClient.tags = options?.tags || []
    baseClient.hubUrl = hubUrl
    return baseClient;
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
      const messageId = await originalSend(content, contentType);

      // Placeholder for post-send functionality
      console.log('After sending message');

      return messageId
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
