import type {AsyncStream} from '@xmtp/node-sdk'
import {
  Client,
  ClientOptions,
  ConsentState,
  Conversations,
  CreateDmOptions,
  CreateGroupOptions,
  DecodedMessage,
  Dm,
  Group,
  HmacKey,
  Identifier,
  ListConversationsOptions,
  Signer,
  StreamCallback,
} from '@xmtp/node-sdk';
import type {ContentTypeId} from '@xmtp/content-type-primitives';
import { JustaName, SubnameResponse,} from "@justaname.id/sdk";
import { getAddress, createWalletClient, http, Address, hashTypedData } from 'viem';
import axios from "axios";
import {
  spendPermissionManagerAddress,
  SpendRequestResponse,
  SubscriptionsResponse
} from "@xmtpbasement/spend-permission";
import * as _xmtp_node_bindings from "@xmtp/node-bindings";
import {baseSepolia} from "wagmi/chains";
import { privateKeyToAccount } from "viem/accounts";
import {recoverAddress} from "ethers";


type MonetizedMsgReturn = Promise<{
  messageId: string;
  collected: boolean;
  reason?: string
}>;

// Original function type can now be written as:
type MonetizedMsgFunction = (
  content: unknown,
  address: string,
  contentType?: ContentTypeId
) => MonetizedMsgReturn;


async function getSubscription(basedClient: BasedClient, address:string) {
  const response = await axios.get<SubscriptionsResponse>(basedClient.hubUrl +
    `/subscriptions?account=${address}&spender=${basedClient.accountIdentifier?.identifier}&isValid=true`
  );
  const subscriptions = response.data.subscriptions

  if(subscriptions.length === 0) {
    return undefined
  }

  console.log(subscriptions)

  return subscriptions[0]
}

async function collectFees(basedClient: BasedClient, spendRequest: SpendRequestResponse): Promise<boolean> {
  const signer = basedClient.signer;
  if(!signer) return false;
  const _spendRequest =  {
    account: getAddress(spendRequest.account)  as Address,
    spender: getAddress(spendRequest.spender)  as Address,
    token: spendRequest.token  as Address,
    allowance: BigInt(spendRequest.allowance),
    period: 1, // seconds in a day
    start: Math.floor((new Date(spendRequest.start)).getTime() / 1000) , // unix timestamp
    end: Math.floor((new Date(spendRequest.end)).getTime() / 1000) , // 7 days from now
    salt: BigInt(0),
    extraData: "0x" as Address,
    value: BigInt(spendRequest.allowance),
  }

  const account = privateKeyToAccount(
    process.env.WALLET_KEY! as `0x${string}`
  );

  const client = createWalletClient({
    account: account,
    chain: baseSepolia,
    transport: http()
  })

  const signature = await client.signTypedData({
    domain: {
      name: 'Extended Spend Permission Manager',
      version: '1',
      chainId: baseSepolia.id,
      verifyingContract: spendPermissionManagerAddress,
    },
    types: {
      SpendRequest: [
        { name: 'account', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'token', type: 'address' },
        { name: 'allowance', type: 'uint160' },
        { name: 'period', type: 'uint48' },
        { name: 'start', type: 'uint48' },
        { name: 'end', type: 'uint48' },
        { name: 'salt', type: 'uint256' },
        { name: 'extraData', type: 'bytes' },
        { name: 'value', type: 'uint160' },
      ],
    },
    primaryType: 'SpendRequest',
    message: _spendRequest
  })

  const hashed = hashTypedData({
    domain: {
      name: 'Extended Spend Permission Manager',
      version: '1',
      chainId: baseSepolia.id,
      verifyingContract: spendPermissionManagerAddress,
    },
    types: {
      SpendRequest: [
        { name: 'account', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'token', type: 'address' },
        { name: 'allowance', type: 'uint160' },
        { name: 'period', type: 'uint48' },
        { name: 'start', type: 'uint48' },
        { name: 'end', type: 'uint48' },
        { name: 'salt', type: 'uint256' },
        { name: 'extraData', type: 'bytes' },
        { name: 'value', type: 'uint160' },
      ],
    },
    primaryType: 'SpendRequest',
    message: _spendRequest
  })
  const address = recoverAddress(hashed, signature)

  console.log(address)

  const replacer = (key: string, value: any) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };

  const spendRequestSanitized = JSON.parse(
    JSON.stringify(_spendRequest, replacer)
  );

  const response = await axios.post<{ status:  "success" | "failure", transactionHash: string}>(basedClient.hubUrl +
    `/spend`, {
      spendRequest: spendRequestSanitized,
      signature: signature
    }
  );

  return response.data.status === "success";
}

function createSendWithFees(instance: Group | Dm, basedClient: BasedClient) {
  return async function sendWithFees(
    content: unknown,
    address: string,
    contentType?: ContentTypeId
  ): Promise<MonetizedMsgReturn> {
    const subscription = await getSubscription(basedClient, address);
    if(!subscription){
      const messageId =  await instance.send('You are not subscribed');
      return {
        messageId,
        collected: false,
        reason: "Not Subscribed"
      }

    }


    const messageId = await instance.send(content, contentType);

    const collected = await collectFees(basedClient, {...subscription.spendPermission, value: subscription.spendPermission.allowance})

    if(collected){
      return {
        messageId,
        collected: true,
      }
    }

    return {
      messageId,
      collected: false,
      reason: "Reason not found"
    }
  };
}

function createSendOptimisticWithFees(instance: Group | Dm, basedClient: BasedClient) {
  return function sendOptimisticWithFees(
    content: unknown,
    address: string,
    contentType?: ContentTypeId
  ): { messageId: string; feeAmount: number } {
    const messageId = instance.sendOptimistic(content, contentType);

    return {
      messageId,
      feeAmount: basedClient.fees
    };
  };
}

function addFeeMethods<T extends Group | Dm>(
  instance: T,
  basedClient: BasedClient
): T & { sendWithFees: ReturnType<typeof createSendWithFees>; sendOptimisticWithFees: ReturnType<typeof createSendOptimisticWithFees> } {
  const extended = instance as any;
  extended.sendWithFees = createSendWithFees(instance, basedClient);
  extended.sendOptimisticWithFees = createSendOptimisticWithFees(instance, basedClient);
  return extended;
}



interface BasedGroup extends Group {
  sendWithFees: MonetizedMsgFunction;
  sendOptimisticWithFees: MonetizedMsgFunction
}
interface BasedDm extends Dm {
  sendWithFees:MonetizedMsgFunction
  sendOptimisticWithFees: MonetizedMsgFunction
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
interface BasedConversationsInterface extends Conversations {
  getConversationById(id: string): Promise<BasedDm | BasedGroup | undefined>;
  getDmByInboxId(inboxId: string): BasedDm | undefined;
  getMessageById<T = unknown>(id: string): DecodedMessage<T> | undefined;
  newGroupWithIdentifiers(identifiers: Identifier[], options?: CreateGroupOptions): Promise<BasedGroup>;
  newGroup(inboxIds: string[], options?: CreateGroupOptions): Promise<BasedGroup>;
  newDmWithIdentifier(identifier: Identifier, options?: CreateDmOptions): Promise<BasedDm>;
  newDm(inboxId: string, options?: CreateDmOptions): Promise<BasedDm>;
  list(options?: ListConversationsOptions): Promise<(BasedDm | BasedGroup)[]>;
  listGroups(options?: Omit<ListConversationsOptions, "conversationType">): BasedGroup[];
  listDms(options?: Omit<ListConversationsOptions, "conversationType">): BasedDm[];
  sync(): Promise<void>
  syncAll(consentStates?: ConsentState[]): Promise<bigint>;
  stream(callback?: StreamCallback<BasedGroup | BasedDm>): AsyncStream<BasedDm | BasedGroup>;
  streamGroups(callback?: StreamCallback<BasedGroup>): AsyncStream<BasedGroup>;
  streamDms(callback?: StreamCallback<BasedDm>): AsyncStream<BasedDm>;
  streamAllMessages(callback?: StreamCallback<DecodedMessage>): Promise<AsyncStream<DecodedMessage<unknown>>>;
  streamAllGroupMessages(callback?: StreamCallback<DecodedMessage>): Promise<AsyncStream<DecodedMessage<unknown>>>;
  streamAllDmMessages(callback?: StreamCallback<DecodedMessage>): Promise<AsyncStream<DecodedMessage<unknown>>>;
  hmacKeys(): Record<string, _xmtp_node_bindings.HmacKey[]>;
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
class BasedConversations implements BasedConversationsInterface {


  constructor(
    private readonly basedClient: BasedClient,
    private readonly wrapped: Conversations
  ) {}

  async getConversationById(id: string) {
    const conversation = await this.wrapped.getConversationById(id);
    if (!conversation) return undefined;
    return this.mapToBased(conversation);
  }

  getDmByInboxId(inboxId: string): BasedDm | undefined {
    const dm = this.wrapped.getDmByInboxId(inboxId);
    if (!dm) return undefined;
    return this.mapToBased(dm);
  }

  getMessageById<T = unknown>(id: string): DecodedMessage<T> | undefined {
    return this.wrapped.getMessageById(id);
  }

  hmacKeys(): Record<string, HmacKey[]> {
    return this.wrapped.hmacKeys();
  }

  async list(
    options?: ListConversationsOptions
  ): Promise<(BasedDm | BasedGroup)[]> {
    const conversartions = await this.wrapped.list(options);
    return this.mapArrayToBased(conversartions);
  }

  listDms(
    options?: Omit<ListConversationsOptions, 'conversationType'>
  ): BasedDm[] {
    return this.mapArrayToBased(this.wrapped.listDms(options))
  }

  listGroups(
    options?: Omit<ListConversationsOptions, 'conversationType'>
  ): BasedGroup[]{
    return this.mapArrayToBased(this.wrapped.listGroups(options))
  }

  async newDm(inboxId: string, options?: CreateDmOptions): Promise<BasedDm>{
     const dm = await this.wrapped.newDm(inboxId, options);
     return this.mapToBased(dm);
  }

  async newDmWithIdentifier(
    identifier: Identifier,
    options?: CreateDmOptions
  ): Promise<BasedDm> {
    const dm = await this.wrapped.newDmWithIdentifier(identifier, options);
    return this.mapToBased(dm)
  }

  async newGroup(
    inboxIds: string[],
    options?: CreateGroupOptions
  ): Promise<BasedGroup> {
    const group = await this.wrapped.newGroup(inboxIds, options);
    return this.mapToBased(group)
  }

  async newGroupWithIdentifiers(
    identifiers: Identifier[],
    options?: CreateGroupOptions
  ): Promise<BasedGroup> {
    const group = await this.wrapped.newGroupWithIdentifiers(identifiers, options);
    return this.mapToBased(group)
  }

  stream(
    callback?: StreamCallback<BasedGroup | BasedDm>
  ): AsyncStream<BasedDm | BasedGroup> {
    // Create a wrapper callback that maps the original types to Based types
    const wrappedCallback: StreamCallback<Group | Dm> | undefined = callback
      ? (err: Error | null, value: Group | Dm | undefined) => {
          if (err || !value) {
            callback(err, undefined);
            return;
          }
          const basedValue = this.mapToBased(value);
          callback(err, basedValue);
        }
      : undefined;

    // Call the wrapped stream method with the wrapped callback
    const originalStream = this.wrapped.stream(wrappedCallback);

    // Create a wrapper around the original stream that transforms Group/Dm to BasedGroup/BasedDm
    return this.createStreamWrapper(originalStream, (conversation) => this.mapToBased(conversation));
  }

  streamAllDmMessages(
    callback?: StreamCallback<DecodedMessage>
  ): Promise<AsyncStream<DecodedMessage<unknown>>> {
    return this.wrapped.streamAllDmMessages(callback);
  }

  streamAllGroupMessages(
    callback?: StreamCallback<DecodedMessage>
  ): Promise<AsyncStream<DecodedMessage<unknown>>> {
    return this.wrapped.streamAllGroupMessages(callback);
  }

  streamAllMessages(
    callback?: StreamCallback<DecodedMessage>
  ): Promise<AsyncStream<DecodedMessage<unknown>>> {
    return this.wrapped.streamAllMessages(callback);
  }

  streamDms(callback?: StreamCallback<BasedDm>): AsyncStream<BasedDm> {
    // Create a wrapper callback that maps the original types to Based types
    const wrappedCallback: StreamCallback<Dm> | undefined = callback
      ? (err: Error | null, value: Dm | undefined) => {
          if (err || !value) {
            callback(err, undefined);
            return;
          }
          const basedValue = this.mapToBased(value);
          callback(err, basedValue);
        }
      : undefined;

    // Call the wrapped streamDms method with the wrapped callback
    const originalStream = this.wrapped.streamDms(wrappedCallback);

    // Create a wrapper around the original stream that transforms Dm to BasedDm
    return this.createStreamWrapper(originalStream, (dm) => this.mapToBased(dm));
  }

  // Helper method to create a wrapper around an AsyncStream that transforms its values
  private createStreamWrapper<T, U>(
    originalStream: AsyncStream<T>,
    mapFn: (value: T) => U
  ): AsyncStream<U> {
    // Use the AsyncStream from the original stream as a template
    // @ts-expect-error - Using constructor from prototype
    const wrappedStream = new (Object.getPrototypeOf(originalStream).constructor)<U>();

    // Cast or transform the callback to match the expected type
    wrappedStream.callback = originalStream.callback as unknown as StreamCallback<U>;

    // Override the next method to transform the values
    const originalNext = originalStream.next;
    wrappedStream.next = async () => {
      const result = await originalNext();
      if (result.done || !result.value) {
        return { done: result.done, value: undefined };
      }
      return { done: result.done, value: mapFn(result.value) };
    };

    // Override the return and end methods
    wrappedStream.return = originalStream.return as unknown as (value?: U) => Promise<{ done: boolean; value: U | undefined; }>;
    wrappedStream.end = originalStream.end as unknown as () => Promise<{ done: boolean; value: U | undefined; }>;

    // Copy error handling
    wrappedStream.onError = originalStream.onError;
    wrappedStream.onReturn = originalStream.onReturn;

    return wrappedStream;
  }

  streamGroups(callback?: StreamCallback<BasedGroup>): AsyncStream<BasedGroup> {
    // Create a wrapper callback that maps the original types to Based types
    const wrappedCallback: StreamCallback<Group> | undefined = callback
      ? (err: Error | null, value: Group | undefined) => {
          if (err || !value) {
            callback(err, undefined);
            return;
          }
          const basedValue = this.mapToBased(value);
          callback(err, basedValue);
        }
      : undefined;

    // Call the wrapped streamGroups method with the wrapped callback
    const originalStream = this.wrapped.streamGroups(wrappedCallback);

    // Create a wrapper around the original stream that transforms Group to BasedGroup
    return this.createStreamWrapper(originalStream, (group) => this.mapToBased(group));
  }

  sync(): Promise<void> {
    return this.wrapped.sync()
  }

  syncAll(consentStates?: ConsentState[]): Promise<bigint> {
    return this.wrapped.syncAll(consentStates)
  }

  private mapToBased<T extends Dm | Group>(
    conversation: T
  ): T extends Dm ? BasedDm : BasedGroup {
    return addFeeMethods(conversation, this.basedClient) as any;
  }

  private mapArrayToBased<T extends Dm[] | Group[] | (Dm | Group)[]>(
    conversations: T
  ): T extends Dm[] ? BasedDm[] : T extends Group[] ? BasedGroup[] : (BasedDm | BasedGroup)[] {
    return conversations.map((conversation) => this.mapToBased(conversation)) as any;
  }
}
export class BasedClient extends Client {
  subname: string | undefined;
  fees = 0;
  description: string | undefined;
  tags: string[] = [];
  hubUrl: string | undefined;


  private _basedConversations?: BasedConversations;

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
  override get conversations(): BasedConversations {
    if (!this._basedConversations) {
      this._basedConversations = new BasedConversations(this, super.conversations) as BasedConversations & { '#private': unknown };
    }
    return this._basedConversations as BasedConversations & { '#private': unknown };
  }

  static override async create(
    signer: Signer,
    options?: ClientOptions & {
      username?: string;
      fees?: number;
      description?: string;
      tags?: string[];
      hubUrl?: string;
    }
  ): Promise<BasedClient> {
    const client = await Client.create(signer, options);
    const basedClient = Object.setPrototypeOf(client, BasedClient.prototype) as BasedClient;

    basedClient.hubUrl = options?.hubUrl || "https://xmtp-agent-hub.vercel.app/api";
    basedClient.fees = options?.fees || 0;
    basedClient.description = options?.description;
    basedClient.tags = options?.tags || [];

    const username = options?.username || "";

    if (!username || !basedClient.accountIdentifier?.identifier) {
      return basedClient;
    }

    const clientAddress = getAddress(basedClient.accountIdentifier.identifier);

    if (!clientAddress) throw new Error("Client address is not defined");

    const justanameInstance = JustaName.init();

    const challenge = justanameInstance.siwe.requestChallenge({
      origin: "http://localhost",
      domain: "localhost:3000",
      chainId: 1,
      ttl: 100000,
      address: clientAddress,
    });

    const text = {} as Record<string, string>;

    if (basedClient.description) text["description"] = basedClient.description;
    if (basedClient.tags.length === 0) {
      text["xmtp_tags"] = "";
    } else {
      text["xmtp_tags"] = basedClient.tags.join(",");
    }
    if (basedClient.fees) text["xmtp_fees"] = basedClient.fees.toString();

    const signatureUint8Array = await signer.signMessage(challenge.challenge);
    const signatureHex = "0x" + Array.from(signatureUint8Array, (byte) =>
      byte.toString(16).padStart(2, '0')
    ).join('');

    const subnames = await justanameInstance.subnames.getSubnamesByAddress({
      address: clientAddress,
    });

    const registrySubname = subnames.subnames.find((_subname) => _subname.ens.startsWith(username));

    let ensDomain = '';
    if (registrySubname) {
      ensDomain = registrySubname.ens.split(".").slice(1).join(".");
      await justanameInstance.subnames.updateSubname({
        addresses: [{ coinType: '60', address: clientAddress }],
        ensDomain,
        username: username,
        text: text,
      }, {
        xMessage: challenge.challenge,
        xSignature: signatureHex,
        xAddress: clientAddress
      });
    } else {
      try {
        const newSubname = await axios.post<SubnameResponse>(basedClient.hubUrl + "/subnames/add", {
          username,
          address: clientAddress,
          signature: signatureHex,
          message: challenge.challenge,
          text,
          agent: true
        });
        ensDomain = newSubname.data.ens.split(".").slice(1).join(".");
      } catch (e) {
        console.log(e);
        throw new Error("Failed to register subname");
      }
    }

    const subname = username + "." + ensDomain;
    basedClient.subname = subname;

    return basedClient;
  }
}
export default BasedClient;
