import type { AsyncStream } from '@xmtp/node-sdk';
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
import type { ContentTypeId } from '@xmtp/content-type-primitives';
import { JustaName, SubnameResponse } from '@justaname.id/sdk';
import { createPublicClient, getAddress, http } from 'viem';
import axios from 'axios';
import {
  spendPermissionManagerAbi,
  spendPermissionManagerAddress,
  SpendPermissionResponse,
  SubscriptionsResponse,
} from '@xmtpbasement/spend-permission';
import * as _xmtp_node_bindings from '@xmtp/node-bindings';
import { baseSepolia, mainnet } from 'wagmi/chains';
import { privateKeyToAccount } from 'viem/accounts';
import {
  createBundlerClient,
  createPaymasterClient,
  toCoinbaseSmartAccount,
} from 'viem/account-abstraction';
import fs from 'fs';
import type { WalletData } from '@coinbase/coinbase-sdk';
import {
  ContentTypeTransactionReference,
  TransactionReferenceCodec,
} from '@xmtp/content-type-transaction-reference';
import FormData from 'form-data';

type MonetizedMsgReturn = Promise<{
  messageId: string;
  collected: boolean;
  reason?: string;
}>;

type MonetizedMsgFunction = (
  content: unknown,
  address: string,
  contentType?: ContentTypeId
) => MonetizedMsgReturn;

async function getSubscription(basedClient: BasedClient, address: string) {
  const response = await axios.get<SubscriptionsResponse>(
    basedClient.hubUrl +
      `/subscriptions?account=${address}&spender=${basedClient.accountIdentifier?.identifier}&isValid=true`
  );
  const subscriptions = response.data.subscriptions;

  if (subscriptions.length === 0) {
    return undefined;
  }

  return subscriptions[0];
}

async function collectFees(
  basedClient: BasedClient,
  spendPermission: SpendPermissionResponse
): Promise<string> {
  console.log('🚀 Starting fee collection...');

  const client = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  const data = fs.readFileSync('wallet.json', 'utf8');
  const walletData = JSON.parse(data) as WalletData;

  const spenderAccountOwner = privateKeyToAccount(
    ('0x' + walletData.seed) as `0x${string}`
  );

  const spenderAccount = await toCoinbaseSmartAccount({
    client,
    owners: [spenderAccountOwner],
  });

  const transportUrl = basedClient.hubUrl + '/paymaster';

  const paymasterClient = createPaymasterClient({
    transport: http(transportUrl),
  });

  const spenderBundlerClient = createBundlerClient({
    account: spenderAccount,
    client,
    paymaster: paymasterClient,
    transport: http(transportUrl),
  });

  try {
    const calls = [
      {
        abi: spendPermissionManagerAbi,
        functionName: 'spend',
        to: spendPermissionManagerAddress,
        args: [
          {
            account: spendPermission.account as `0x${string}`,
            spender: spendPermission.spender as `0x${string}`,
            allowance: BigInt(spendPermission.allowance),
            salt: BigInt(spendPermission.salt),
            token: spendPermission.token as `0x${string}`,
            period: spendPermission.period,
            start: Math.floor(new Date(spendPermission.start).getTime() / 1000),
            end: Math.floor(new Date(spendPermission.end).getTime() / 1000),
            extraData: spendPermission.extraData as `0x${string}`,
          },
          BigInt(1),
        ],
      },
    ];

    const userOpHash = await spenderBundlerClient.sendUserOperation({
      calls,
    });

    const userOpReceipt =
      await spenderBundlerClient.waitForUserOperationReceipt({
        hash: userOpHash,
      });

    return userOpReceipt.receipt.transactionHash;
  } catch (e) {
    console.error('❌ Transaction failed:', e);
    return '';
  }
}

function createSendWithFees(instance: Group | Dm, basedClient: BasedClient) {
  return async function sendWithFees(
    content: unknown,
    address: string,
    contentType?: ContentTypeId
  ): Promise<MonetizedMsgReturn> {
    const subscription = await getSubscription(basedClient, address);
    if (!subscription) {
      const messageId = await instance.send('You are not subscribed');
      return {
        messageId,
        collected: false,
        reason: 'Not Subscribed',
      };
    }
    const txHash = await collectFees(basedClient, subscription.spendPermission);

    if (txHash === '') {
      const messageId = await instance.send('Payment Failed');
      return {
        messageId,
        collected: false,
        reason: 'Payment Failed',
      };
    }

    const messageId = await instance.send(content, contentType);
    await instance.send(
      {
        namespace: 'eip155',
        networkId: baseSepolia.id,
        reference: txHash,
      },
      ContentTypeTransactionReference
    );

    if (txHash) {
      return {
        messageId,
        collected: true,
      };
    }

    return {
      messageId,
      collected: false,
      reason: 'Reason not found',
    };
  };
}

function createSendOptimisticWithFees(
  instance: Group | Dm,
  basedClient: BasedClient
) {
  return function sendOptimisticWithFees(
    content: unknown,
    address: string,
    contentType?: ContentTypeId
  ): { messageId: string; feeAmount: number } {
    const messageId = instance.sendOptimistic(content, contentType);

    return {
      messageId,
      feeAmount: basedClient.fees,
    };
  };
}

function addFeeMethods<T extends Group | Dm>(
  instance: T,
  basedClient: BasedClient
): T & {
  sendWithFees: ReturnType<typeof createSendWithFees>;
  sendOptimisticWithFees: ReturnType<typeof createSendOptimisticWithFees>;
} {
  const extended = instance as any;
  extended.sendWithFees = createSendWithFees(instance, basedClient);
  extended.sendOptimisticWithFees = createSendOptimisticWithFees(
    instance,
    basedClient
  );
  return extended;
}

interface BasedGroup extends Group {
  sendWithFees: MonetizedMsgFunction;
  sendOptimisticWithFees: MonetizedMsgFunction;
}

interface BasedDm extends Dm {
  sendWithFees: MonetizedMsgFunction;
  sendOptimisticWithFees: MonetizedMsgFunction;
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
interface BasedConversationsInterface extends Conversations {
  getConversationById(id: string): Promise<BasedDm | BasedGroup | undefined>;

  getDmByInboxId(inboxId: string): BasedDm | undefined;

  getMessageById<T = unknown>(id: string): DecodedMessage<T> | undefined;

  newGroupWithIdentifiers(
    identifiers: Identifier[],
    options?: CreateGroupOptions
  ): Promise<BasedGroup>;

  newGroup(
    inboxIds: string[],
    options?: CreateGroupOptions
  ): Promise<BasedGroup>;

  newDmWithIdentifier(
    identifier: Identifier,
    options?: CreateDmOptions
  ): Promise<BasedDm>;

  newDm(inboxId: string, options?: CreateDmOptions): Promise<BasedDm>;

  list(options?: ListConversationsOptions): Promise<(BasedDm | BasedGroup)[]>;

  listGroups(
    options?: Omit<ListConversationsOptions, 'conversationType'>
  ): BasedGroup[];

  listDms(
    options?: Omit<ListConversationsOptions, 'conversationType'>
  ): BasedDm[];

  sync(): Promise<void>;

  syncAll(consentStates?: ConsentState[]): Promise<bigint>;

  stream(
    callback?: StreamCallback<BasedGroup | BasedDm>
  ): AsyncStream<BasedDm | BasedGroup>;

  streamGroups(callback?: StreamCallback<BasedGroup>): AsyncStream<BasedGroup>;

  streamDms(callback?: StreamCallback<BasedDm>): AsyncStream<BasedDm>;

  streamAllMessages(
    callback?: StreamCallback<DecodedMessage>
  ): Promise<AsyncStream<DecodedMessage<unknown>>>;

  streamAllGroupMessages(
    callback?: StreamCallback<DecodedMessage>
  ): Promise<AsyncStream<DecodedMessage<unknown>>>;

  streamAllDmMessages(
    callback?: StreamCallback<DecodedMessage>
  ): Promise<AsyncStream<DecodedMessage<unknown>>>;

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
    return this.mapArrayToBased(this.wrapped.listDms(options));
  }

  listGroups(
    options?: Omit<ListConversationsOptions, 'conversationType'>
  ): BasedGroup[] {
    return this.mapArrayToBased(this.wrapped.listGroups(options));
  }

  async newDm(inboxId: string, options?: CreateDmOptions): Promise<BasedDm> {
    const dm = await this.wrapped.newDm(inboxId, options);
    return this.mapToBased(dm);
  }

  async newDmWithIdentifier(
    identifier: Identifier,
    options?: CreateDmOptions
  ): Promise<BasedDm> {
    const dm = await this.wrapped.newDmWithIdentifier(identifier, options);
    return this.mapToBased(dm);
  }

  async newGroup(
    inboxIds: string[],
    options?: CreateGroupOptions
  ): Promise<BasedGroup> {
    const group = await this.wrapped.newGroup(inboxIds, options);
    return this.mapToBased(group);
  }

  async newGroupWithIdentifiers(
    identifiers: Identifier[],
    options?: CreateGroupOptions
  ): Promise<BasedGroup> {
    const group = await this.wrapped.newGroupWithIdentifiers(
      identifiers,
      options
    );
    return this.mapToBased(group);
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
    return this.createStreamWrapper(originalStream, (conversation) =>
      this.mapToBased(conversation)
    );
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
    return this.createStreamWrapper(originalStream, (dm) =>
      this.mapToBased(dm)
    );
  }

  streamGroups(callback?: StreamCallback<BasedGroup>): AsyncStream<BasedGroup> {
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
    return this.createStreamWrapper(originalStream, (group) =>
      this.mapToBased(group)
    );
  }

  sync(): Promise<void> {
    return this.wrapped.sync();
  }

  syncAll(consentStates?: ConsentState[]): Promise<bigint> {
    return this.wrapped.syncAll(consentStates);
  }

  // Helper method to create a wrapper around an AsyncStream that transforms its values
  private createStreamWrapper<T, U>(
    originalStream: AsyncStream<T>,
    mapFn: (value: T) => U
  ): AsyncStream<U> {
    // Use the AsyncStream from the original stream as a template
    // @ts-expect-error - Using constructor from prototype
    const wrappedStream = new (Object.getPrototypeOf(
      originalStream
    ).constructor)<U>();

    wrappedStream.callback =
      originalStream.callback as unknown as StreamCallback<U>;

    const originalNext = originalStream.next;
    wrappedStream.next = async () => {
      const result = await originalNext();
      if (result.done || !result.value) {
        return { done: result.done, value: undefined };
      }
      return { done: result.done, value: mapFn(result.value) };
    };

    wrappedStream.return = originalStream.return as unknown as (
      value?: U
    ) => Promise<{
      done: boolean;
      value: U | undefined;
    }>;
    wrappedStream.end = originalStream.end as unknown as () => Promise<{
      done: boolean;
      value: U | undefined;
    }>;

    wrappedStream.onError = originalStream.onError;
    wrappedStream.onReturn = originalStream.onReturn;

    return wrappedStream;
  }

  private mapToBased<T extends Dm | Group>(
    conversation: T
  ): T extends Dm ? BasedDm : BasedGroup {
    return addFeeMethods(conversation, this.basedClient) as any;
  }

  private mapArrayToBased<T extends Dm[] | Group[] | (Dm | Group)[]>(
    conversations: T
  ): T extends Dm[]
    ? BasedDm[]
    : T extends Group[]
    ? BasedGroup[]
    : (BasedDm | BasedGroup)[] {
    return conversations.map((conversation) =>
      this.mapToBased(conversation)
    ) as any;
  }
}

export class BasedClient extends Client {
  subname: string | undefined;
  fees = 0;
  description: string | undefined;
  tags: string[] = [];
  hubUrl: string | undefined;
  displayName: string | undefined;

  private _basedConversations?: BasedConversations;

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  override get conversations(): BasedConversations {
    if (!this._basedConversations) {
      this._basedConversations = new BasedConversations(
        this,
        super.conversations
      ) as BasedConversations & {
        '#private': unknown;
      };
    }
    return this._basedConversations as BasedConversations & {
      '#private': unknown;
    };
  }

  static override async create(
    signer: Signer,
    options?: ClientOptions & {
      username?: string;
      fees?: number;
      displayName?: string;
      avatar: string | Buffer;
      description?: string;
      tags?: string[];
      hubUrl?: string;
    }
  ): Promise<BasedClient> {
    const data = fs.readFileSync('wallet.json', 'utf8');
    const walletData = JSON.parse(data) as WalletData;

    const client = await Client.create(signer, {
      ...options,
      codecs: [...(options?.codecs || []), new TransactionReferenceCodec()],
    });
    const basedClient = Object.setPrototypeOf(
      client,
      BasedClient.prototype
    ) as BasedClient;
    basedClient.hubUrl =
      options?.hubUrl || 'https://xmtp-agent-hub.vercel.app/api';
    basedClient.fees = options?.fees || 0;
    basedClient.description = options?.description;
    basedClient.tags = options?.tags || [];
    basedClient.displayName = options?.displayName;
    const _avatar = options?.avatar;

    const username = options?.username || '';

    if (!username || !basedClient.accountIdentifier?.identifier) {
      return basedClient;
    }

    const clientAddress = getAddress(basedClient.accountIdentifier.identifier);

    if (!clientAddress) throw new Error('Client address is not defined');

    const justanameInstance = JustaName.init();

    const challenge = justanameInstance.siwe.requestChallenge({
      origin: 'http://localhost',
      domain: 'localhost:3000',
      chainId: 1,
      ttl: 100000,
      address: clientAddress,
    });

    const account = privateKeyToAccount(
      (walletData.seed.startsWith('0x')
        ? walletData.seed
        : '0x' + walletData.seed) as `0x${string}`
    );

    const publicClient = createPublicClient({
      chain: mainnet,
      transport: http('https://eth.drpc.org'),
    });

    const spenderAccount = await toCoinbaseSmartAccount({
      client: publicClient,
      owners: [account],
    });

    const signature = await spenderAccount.signMessage({
      message: challenge.challenge,
    });
    const subnames = await justanameInstance.subnames.getSubnamesByAddress({
      address: clientAddress,
    });

    const registrySubname = subnames.subnames.find((_subname) =>
      _subname.ens.startsWith(username)
    );

    const text = {} as Record<string, string>;

    if (basedClient.description) text['description'] = basedClient.description;
    if (basedClient.tags.length === 0) {
      text['xmtp_tags'] = '';
    } else {
      text['xmtp_tags'] = basedClient.tags.join(',');
    }
    if (basedClient.fees) text['xmtp_fees'] = basedClient.fees.toString();
    if (basedClient.displayName) text['displayName'] = basedClient.displayName;

    let ensDomain = '';
    let subnameResponse: SubnameResponse | undefined;
    if (registrySubname) {
      ensDomain = registrySubname.ens.split('.').slice(1).join('.');
      subnameResponse =await justanameInstance.subnames.updateSubname(
        {
          addresses: [{ coinType: '60', address: clientAddress }],
          ensDomain,
          username: username,
          text: text,
        },
        {
          xMessage: challenge.challenge,
          xSignature: signature,
          xAddress: clientAddress,
        }
      );
    } else {
      try {
        const newSubname = await axios.post<SubnameResponse>(
          basedClient.hubUrl + '/subnames/add',
          {
            username,
            address: clientAddress,
            signature: signature,
            message: challenge.challenge,
            text,
            agent: true,
          }
        );
        subnameResponse = newSubname.data
        ensDomain = newSubname.data.ens.split('.').slice(1).join('.');
      } catch (e) {
        let error = 'Unknown error occurred while registering subname';
        if (
          e &&
          typeof e === 'object' &&
          'response' in e &&
          e.response &&
          typeof e.response === 'object' &&
          'data' in e.response &&
          e.response.data &&
          typeof e.response.data === 'object' &&
          'error' in e.response.data
        ) {
          error = e.response.data.error as string;
        }
        throw new Error(error);
      }
    }

    if(_avatar && subnameResponse){
      try {
        const avatar = await getAvatarUrl(
          subnameResponse,
          _avatar,
          signature,
          challenge.challenge,
          'Avatar'
        )

        await justanameInstance.subnames.updateSubname(
          {
            ensDomain,
            username: username,
            text: {avatar},
          },
          {
            xMessage: challenge.challenge,
            xSignature: signature,
            xAddress: clientAddress,
          }
        )
      }catch(e) {
        let error = 'Unknown error occurred while registering subname';
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        console.log(e.response)
        if (
          e &&
          typeof e === 'object' &&
          'response' in e &&
          e.response &&
          typeof e.response === 'object' &&
          'data' in e.response &&
          e.response.data &&
          typeof e.response.data === 'object' &&
          'result' in e.response.data &&
          e.response.data.result &&
          typeof e.response.data.result === 'object' &&
          'error' in e.response.data.result
        ) {
          error = e.response.data.result.error as string;
        }
        throw new Error(error);
      }
    }


    const subname = username + '.' + ensDomain;
    basedClient.subname = subname;

    return basedClient;
  }

}

export default BasedClient;


const  getAvatarUrl = async (
  subname: SubnameResponse,
  avatar: string | Buffer,
  signature: string,
  challenge: string,
  type: 'Avatar' | 'Banner'
) =>  {
  let _avatar = '';
  if (Buffer.isBuffer(avatar)) {
    const form = new FormData();
    const mimeType = getMimeTypeFromBuffer(avatar);
    const extension = getFileExtensionFromMimeType(mimeType);
    const filename = `${type.toLowerCase()}.${extension}`;

    form.append('file', avatar, {
      filename,
      contentType: mimeType,
    });
    form.append('signature', signature);
    const result = await axios.post<{
      result: {
        data: {
          url: string;
        };
        error: null;
      };
      statusCode: number;
    }>(
      `https://api.justaname.id/ens/v1/subname/upload-to-cdn?ens=${subname.ens}&type=${type.toLowerCase()}&chainId=1`,
      form,
      {
        headers: {
          'x-message': challenge.replace(/\n/g, '\\n'),
          'x-address': subname.records.coins.find((coin) => coin.id === 60)
            ?.value,
        },
      }
    );
    if (result.data.statusCode === 200) {
      _avatar = result.data.result.data.url;
    }
  } else {
    _avatar = avatar;
  }

  return _avatar;
}

function getMimeTypeFromBuffer(buffer: Buffer): string {
  if (buffer.length >= 8) {
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return 'image/png';
    }

    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return 'image/jpeg';
    }

    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
      return 'image/gif';
    }

    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
      return 'image/webp';
    }

    if (buffer[0] === 0x42 && buffer[1] === 0x4D) {
      return 'image/bmp';
    }
  }


  throw new Error('Unsupported file type');
}

function getFileExtensionFromMimeType(mimeType: string): string {
  const extensions: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/bmp': 'bmp',
  };

  return extensions[mimeType] || 'bin';
}
