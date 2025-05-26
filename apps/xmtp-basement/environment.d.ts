declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';

    // Server-only variable


    // Client-only variable

    NEXT_PUBLIC_ENS_DOMAIN: string;
    NEXT_PUBLIC_ONCHAINKIT_CLIENT_API_KEY: string;
    NEXT_PUBLIC_ONCHAINKIT_WALLET_CONFIG: 'smartWalletOnly' | 'all';
    NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME: string;
  }
}
