declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';

    // Server-only variable
    XMTP_AGENT_ENS_DOMAIN: string;
    XMTP_AGENT_JUSTANAME_API_KEY: string;
    USER_ENS_DOMAIN: string;
    USER_JUSTANAME_API_KEY: string;
    DATABASE_URL: string;
    BASE_PAYMASTER_URL: string
    // Client-only variable

    NEXT_PUBLIC_XMTP_AGENT_ENS_DOMAIN: string;
    NEXT_PUBLIC_USER_ENS_DOMAIN: string;
    NEXT_PUBLIC_ONCHAINKIT_CLIENT_API_KEY: string;
    NEXT_PUBLIC_ONCHAINKIT_WALLET_CONFIG: 'smartWalletOnly' | 'all';
    NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME: string;
  }
}
